from decimal import Decimal
from django.utils import timezone
from django.db.models import Sum
from .models import InstrumentLotSize, GlobalRiskSettings, IndexRiskProfile
from apps.setups.models import Setup
from apps.journal.models import DailyTradingPlan

class RiskEngineService:
    @staticmethod
    def get_active_lot_size(index_name: str) -> int:
        """Fetch active lot size from database without hard-coding."""
        today = timezone.now().date()
        lot_record = InstrumentLotSize.objects.filter(
            index=index_name.upper(),
            is_active=True,
            effective_date__lte=today
        ).order_by('-effective_date').first()
        
        if lot_record:
            return lot_record.lot_size
            
        # Standard default fallback if not seeded
        fallbacks = {
            'NIFTY': 65,
            'BANKNIFTY': 30,
            'SENSEX': 20,
            'FINNIFTY': 25,
            'MIDCPNIFTY': 50,
        }
        return fallbacks.get(index_name.upper(), 25)

    @staticmethod
    def calculate_position_size(user, index_name: str, entry_price: Decimal, stop_loss: Decimal, custom_capital: Decimal = None):
        """Calculate maximum allowed lot count and quantity based on risk rules."""
        entry_price = Decimal(str(entry_price))
        stop_loss = Decimal(str(stop_loss))
        risk_per_unit = abs(entry_price - stop_loss)

        if risk_per_unit <= Decimal('0.00'):
            return {
                'error': 'Stop loss cannot be equal to entry price',
                'recommended_quantity': 0,
                'recommended_lots': 0,
                'lot_size': 0
            }

        # Retrieve risk settings
        settings, _ = GlobalRiskSettings.objects.get_or_create(user=user)
        profile = IndexRiskProfile.objects.filter(user=user, index=index_name.upper(), is_active=True).first()
        risk_pct = profile.risk_per_trade_pct if profile else settings.risk_per_trade_pct

        # Retrieve user active challenge capital
        if custom_capital:
            capital = Decimal(str(custom_capital))
        else:
            challenge = user.challenges.filter(is_active=True).first()
            if challenge:
                # Calculate current equity
                closed_pnl = user.trades.filter(status='CLOSED').aggregate(s=Sum('net_pnl'))['s'] or Decimal('0.00')
                capital = max(Decimal('1000.00'), challenge.starting_capital + closed_pnl)
            else:
                capital = Decimal('15000.00')

        allowed_risk = capital * (risk_pct / Decimal('100.00'))
        lot_size = RiskEngineService.get_active_lot_size(index_name)
        
        risk_per_lot = risk_per_unit * Decimal(lot_size)
        raw_lots = int(allowed_risk // risk_per_lot)
        
        # Max position cap if defined
        max_lots = profile.max_position_lots if profile else 10
        recommended_lots = min(raw_lots, max_lots)
        recommended_quantity = recommended_lots * lot_size
        actual_risk = Decimal(recommended_quantity) * risk_per_unit

        return {
            'index': index_name.upper(),
            'lot_size': lot_size,
            'risk_per_unit': float(round(risk_per_unit, 2)),
            'allowed_risk_amount': float(round(allowed_risk, 2)),
            'capital_considered': float(round(capital, 2)),
            'risk_pct_used': float(risk_pct),
            'recommended_lots': recommended_lots,
            'recommended_quantity': recommended_quantity,
            'actual_risk_amount': float(round(actual_risk, 2)),
            'risk_per_lot': float(round(risk_per_lot, 2))
        }

    @staticmethod
    def evaluate_firewall(user, trade_data: dict) -> dict:
        """
        Evaluate proposed trade against 9 strict risk firewall rules:
        1. Daily loss check
        2. Risk-per-trade check
        3. Maximum trade count
        4. Consecutive-loss check
        5. Maximum drawdown check
        6. Position-size / lot check
        7. Risk/reward check
        8. Setup validation
        9. Daily-plan validation
        """
        today = timezone.now().date()
        settings, _ = GlobalRiskSettings.objects.get_or_create(user=user)
        
        index_name = trade_data.get('index', 'NIFTY').upper()
        profile = IndexRiskProfile.objects.filter(user=user, index=index_name, is_active=True).first()

        entry_price = Decimal(str(trade_data.get('entry_price', '0.00')))
        stop_loss = Decimal(str(trade_data.get('stop_loss', '0.00')))
        target_price = Decimal(str(trade_data.get('target', '0.00')))
        quantity = int(trade_data.get('quantity', 0))
        setup_id = trade_data.get('setup_id') or trade_data.get('setup')

        risk_per_unit = abs(entry_price - stop_loss)
        required_risk = Decimal(quantity) * risk_per_unit

        # Fetch capital & daily stats
        challenge = user.challenges.filter(is_active=True).first()
        starting_cap = challenge.starting_capital if challenge else Decimal('15000.00')
        all_closed_trades = user.trades.filter(status='CLOSED')
        cumulative_pnl = all_closed_trades.aggregate(s=Sum('net_pnl'))['s'] or Decimal('0.00')
        current_capital = max(Decimal('1.00'), starting_cap + cumulative_pnl)

        today_trades = user.trades.filter(date=today)
        today_closed = today_trades.filter(status='CLOSED')
        today_net_pnl = today_closed.aggregate(s=Sum('net_pnl'))['s'] or Decimal('0.00')

        # Limits
        max_daily_loss_pct = profile.max_daily_loss_pct if profile else settings.max_daily_loss_pct
        max_daily_loss_amount = starting_cap * (max_daily_loss_pct / Decimal('100.00'))
        
        # Remaining daily risk allowance
        # If today_net_pnl is negative, it consumed some of the daily loss allowance
        loss_today_so_far = abs(min(Decimal('0.00'), today_net_pnl))
        remaining_daily_risk = max(Decimal('0.00'), max_daily_loss_amount - loss_today_so_far)

        rules_results = []
        is_blocked = False

        # Rule 1: Daily Loss Check
        if loss_today_so_far >= max_daily_loss_amount:
            rules_results.append({
                'rule': 'daily_loss',
                'status': 'FAIL',
                'message': f"Maximum daily loss limit of ₹{max_daily_loss_amount:.2f} already reached today."
            })
            is_blocked = True
        elif (loss_today_so_far + required_risk) > max_daily_loss_amount:
            excess = (loss_today_so_far + required_risk) - max_daily_loss_amount
            rules_results.append({
                'rule': 'daily_loss',
                'status': 'FAIL',
                'message': f"Trade risk (₹{required_risk:.2f}) exceeds remaining daily risk limit by ₹{excess:.2f}."
            })
            is_blocked = True
        else:
            rules_results.append({
                'rule': 'daily_loss',
                'status': 'PASS',
                'message': f"Within daily risk allowance. Remaining: ₹{remaining_daily_risk:.2f}."
            })

        # Rule 2: Risk-per-trade Check
        risk_per_trade_pct = profile.risk_per_trade_pct if profile else settings.risk_per_trade_pct
        max_trade_risk_allowed = current_capital * (risk_per_trade_pct / Decimal('100.00'))
        if required_risk > max_trade_risk_allowed:
            rules_results.append({
                'rule': 'risk_per_trade',
                'status': 'FAIL',
                'message': f"Trade risk (₹{required_risk:.2f}) exceeds allowed {risk_per_trade_pct}% per trade (₹{max_trade_risk_allowed:.2f})."
            })
            is_blocked = True
        else:
            rules_results.append({
                'rule': 'risk_per_trade',
                'status': 'PASS',
                'message': f"Risk per trade (₹{required_risk:.2f}) is within allowed ₹{max_trade_risk_allowed:.2f}."
            })

        # Rule 3: Maximum Trade Count Check
        max_trades = profile.max_trades if profile else settings.max_trades_per_day
        executed_today_count = today_trades.count()
        if executed_today_count >= max_trades:
            rules_results.append({
                'rule': 'max_trades',
                'status': 'FAIL',
                'message': f"Daily trade limit reached ({executed_today_count}/{max_trades} trades)."
            })
            is_blocked = True
        else:
            rules_results.append({
                'rule': 'max_trades',
                'status': 'PASS',
                'message': f"Trade count ok ({executed_today_count}/{max_trades} trades taken)."
            })

        # Rule 4: Consecutive Loss Check
        max_consec = settings.max_consecutive_losses
        recent_trades = list(today_closed.order_by('-id')[:max_consec])
        if len(recent_trades) >= max_consec and all(t.net_pnl < 0 for t in recent_trades):
            rules_results.append({
                'rule': 'consecutive_losses',
                'status': 'FAIL',
                'message': f"Firewall locked: {max_consec} consecutive losses today. Cooling off mandatory."
            })
            is_blocked = True
        else:
            rules_results.append({
                'rule': 'consecutive_losses',
                'status': 'PASS',
                'message': "Consecutive loss limit not breached."
            })

        # Rule 5: Maximum Drawdown Check
        max_dd_pct = settings.max_drawdown_pct
        drawdown_amount = max(Decimal('0.00'), starting_cap - current_capital)
        current_dd_pct = (drawdown_amount / starting_cap) * Decimal('100.00') if starting_cap > 0 else Decimal('0.00')
        if current_dd_pct >= max_dd_pct:
            rules_results.append({
                'rule': 'max_drawdown',
                'status': 'FAIL',
                'message': f"Maximum challenge drawdown limit reached ({current_dd_pct:.1f}% >= {max_dd_pct}%)."
            })
            is_blocked = True
        else:
            rules_results.append({
                'rule': 'max_drawdown',
                'status': 'PASS',
                'message': f"Current drawdown {current_dd_pct:.1f}% is within {max_dd_pct}% threshold."
            })

        # Rule 6: Position Size & Lot Check
        lot_size = RiskEngineService.get_active_lot_size(index_name)
        if quantity <= 0 or (quantity % lot_size != 0):
            rules_results.append({
                'rule': 'position_size_lot',
                'status': 'FAIL',
                'message': f"Quantity {quantity} must be a valid multiple of {index_name} lot size ({lot_size})."
            })
            is_blocked = True
        else:
            max_lots = profile.max_position_lots if profile else 10
            if (quantity // lot_size) > max_lots:
                rules_results.append({
                    'rule': 'position_size_lot',
                    'status': 'FAIL',
                    'message': f"Requested {quantity // lot_size} lots exceeds maximum allowed ({max_lots} lots)."
                })
                is_blocked = True
            else:
                rules_results.append({
                    'rule': 'position_size_lot',
                    'status': 'PASS',
                    'message': f"Quantity {quantity} is a valid lot multiple ({quantity // lot_size} lots)."
                })

        # Rule 7: Risk/Reward Check
        reward_per_unit = abs(target_price - entry_price)
        min_rr = profile.min_rr if profile else settings.min_rr_ratio
        if risk_per_unit > 0:
            rr_ratio = reward_per_unit / risk_per_unit
            if rr_ratio < min_rr:
                rules_results.append({
                    'rule': 'risk_reward',
                    'status': 'FAIL',
                    'message': f"Risk/Reward {rr_ratio:.2f}:1 is below required minimum of {min_rr:.2f}:1."
                })
                is_blocked = True
            else:
                rules_results.append({
                    'rule': 'risk_reward',
                    'status': 'PASS',
                    'message': f"Risk/Reward {rr_ratio:.2f}:1 meets minimum requirement of {min_rr:.2f}:1."
                })
        else:
            rules_results.append({
                'rule': 'risk_reward',
                'status': 'FAIL',
                'message': "Stop loss cannot be identical to entry price."
            })
            is_blocked = True

        # Rule 8: Setup Validation
        if setup_id:
            setup = Setup.objects.filter(id=setup_id, is_active=True).first()
            if not setup:
                rules_results.append({
                    'rule': 'setup_validation',
                    'status': 'FAIL',
                    'message': "Specified trading setup does not exist or is inactive."
                })
                is_blocked = True
            else:
                rules_results.append({
                    'rule': 'setup_validation',
                    'status': 'PASS',
                    'message': f"Valid active setup: {setup.name}."
                })
        else:
            rules_results.append({
                'rule': 'setup_validation',
                'status': 'FAIL',
                'message': "Every trade must be tagged with a predefined setup from your library."
            })
            is_blocked = True

        # Rule 9: Daily Plan Validation
        plan = DailyTradingPlan.objects.filter(user=user, date=today).first()
        if not plan:
            rules_results.append({
                'rule': 'daily_plan',
                'status': 'FAIL',
                'message': "No trading plan filed for today. Plan your trade before trading your plan."
            })
            is_blocked = True
        elif not plan.plan_followed:
            rules_results.append({
                'rule': 'daily_plan',
                'status': 'FAIL',
                'message': "Daily trading plan is flagged as violated. Trading halted for the day."
            })
            is_blocked = True
        else:
            rules_results.append({
                'rule': 'daily_plan',
                'status': 'PASS',
                'message': f"Active daily plan followed (Bias: {plan.market_bias})."
            })

        status_verdict = 'BLOCKED' if is_blocked else 'ALLOWED'
        excess_risk = max(Decimal('0.00'), required_risk - remaining_daily_risk)

        return {
            'status': status_verdict,
            'is_allowed': not is_blocked,
            'required_risk': float(round(required_risk, 2)),
            'remaining_daily_risk': float(round(remaining_daily_risk, 2)),
            'excess_risk': float(round(excess_risk, 2)),
            'rules': rules_results,
            'failed_rules_count': sum(1 for r in rules_results if r['status'] == 'FAIL')
        }
