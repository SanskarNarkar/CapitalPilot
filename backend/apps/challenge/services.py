from decimal import Decimal
from django.utils import timezone
from django.db.models import Sum
from .models import ChallengeConfig, DailySnapshot
from apps.dhan.providers import get_dhan_provider

class ChallengeService:
    @staticmethod
    def get_or_create_default_challenge(user):
        challenge = ChallengeConfig.objects.filter(user=user, is_active=True).first()
        if not challenge:
            challenge = ChallengeConfig.objects.create(
                user=user,
                name="15k to 1.35L Options Challenge",
                starting_capital=Decimal('15000.00'),
                target_profit=Decimal('120000.00'),
                target_capital=Decimal('135000.00'),
                is_active=True
            )
        return challenge

    @staticmethod
    def get_summary(user):
        challenge = ChallengeService.get_or_create_default_challenge(user)
        closed_trades = user.trades.filter(status='CLOSED').order_by('date', 'time', 'id')
        
        starting_capital = challenge.starting_capital
        target_capital = challenge.target_capital
        target_profit = challenge.target_profit

        total_net_pnl = closed_trades.aggregate(s=Sum('net_pnl'))['s'] or Decimal('0.00')
        total_gross_pnl = closed_trades.aggregate(s=Sum('gross_pnl'))['s'] or Decimal('0.00')
        total_charges = closed_trades.aggregate(s=Sum('charges'))['s'] or Decimal('0.00')
        
        provider = get_dhan_provider()
        live_balance = None
        if not getattr(provider, 'is_demo', False):
            fund_limits = provider.get_fund_limits()
            live_balance = fund_limits.get('availabelBalance')
            if live_balance is None:
                live_balance = fund_limits.get('availableBalance')

        if live_balance is not None:
            current_capital = Decimal(str(live_balance))
            starting_capital = current_capital - total_net_pnl
        else:
            current_capital = starting_capital + total_net_pnl
        remaining_profit = max(Decimal('0.00'), target_capital - current_capital)
        
        progress_pct = Decimal('0.00')
        if target_profit > 0:
            progress_pct = round(((current_capital - starting_capital) / target_profit) * Decimal('100.00'), 2)
            progress_pct = max(Decimal('0.00'), min(Decimal('100.00'), progress_pct))

        # Daily performance breakdown
        trades_by_date = {}
        for trade in closed_trades:
            d_str = trade.date.isoformat()
            if d_str not in trades_by_date:
                trades_by_date[d_str] = Decimal('0.00')
            trades_by_date[d_str] += trade.net_pnl

        trading_days = len(trades_by_date)
        winning_days = sum(1 for pnl in trades_by_date.values() if pnl > 0)
        losing_days = sum(1 for pnl in trades_by_date.values() if pnl < 0)
        break_even_days = sum(1 for pnl in trades_by_date.values() if pnl == 0)

        daily_pnls = list(trades_by_date.values())
        best_day = max(daily_pnls) if daily_pnls else Decimal('0.00')
        worst_day = min(daily_pnls) if daily_pnls else Decimal('0.00')

        # Current streak calculation
        streak = 0
        sorted_dates = sorted(trades_by_date.keys())
        for d in reversed(sorted_dates):
            pnl = trades_by_date[d]
            if streak == 0:
                streak = 1 if pnl > 0 else (-1 if pnl < 0 else 0)
            elif streak > 0:
                if pnl > 0:
                    streak += 1
                else:
                    break
            elif streak < 0:
                if pnl < 0:
                    streak -= 1
                else:
                    break

        # Capital curve and drawdown calculation
        running_cap = starting_capital
        peak_cap = starting_capital
        max_drawdown_amount = Decimal('0.00')
        max_drawdown_pct = Decimal('0.00')

        for d in sorted_dates:
            running_cap += trades_by_date[d]
            if running_cap > peak_cap:
                peak_cap = running_cap
            dd = peak_cap - running_cap
            if dd > max_drawdown_amount:
                max_drawdown_amount = dd
                if peak_cap > 0:
                    max_drawdown_pct = round((dd / peak_cap) * Decimal('100.00'), 2)

        today = timezone.now().date()
        today_trades = closed_trades.filter(date=today)
        today_pnl = today_trades.aggregate(s=Sum('net_pnl'))['s'] or Decimal('0.00')

        return {
            'challenge_id': challenge.id,
            'name': challenge.name,
            'starting_capital': float(starting_capital),
            'current_capital': float(current_capital),
            'target_capital': float(target_capital),
            'target_profit': float(target_profit),
            'remaining_profit': float(remaining_profit),
            'progress_pct': float(progress_pct),
            'total_net_pnl': float(total_net_pnl),
            'total_gross_pnl': float(total_gross_pnl),
            'total_charges': float(total_charges),
            'today_pnl': float(today_pnl),
            'trading_days': trading_days,
            'winning_days': winning_days,
            'losing_days': losing_days,
            'break_even_days': break_even_days,
            'best_day': float(best_day),
            'worst_day': float(worst_day),
            'current_streak': streak,
            'max_drawdown_amount': float(max_drawdown_amount),
            'max_drawdown_pct': float(max_drawdown_pct),
            'is_active': challenge.is_active,
            'start_date': challenge.start_date.isoformat(),
        }

    @staticmethod
    def get_curve(user):
        challenge = ChallengeService.get_or_create_default_challenge(user)
        closed_trades = user.trades.filter(status='CLOSED').order_by('date', 'time', 'id')

        provider = get_dhan_provider()
        starting_capital = challenge.starting_capital
        if not getattr(provider, 'is_demo', False):
            fund_limits = provider.get_fund_limits()
            live_balance = fund_limits.get('availabelBalance')
            if live_balance is None:
                live_balance = fund_limits.get('availableBalance')
            if live_balance is not None:
                starting_capital = Decimal(str(live_balance))
        
        trades_by_date = {}
        for trade in closed_trades:
            d_str = trade.date.isoformat()
            if d_str not in trades_by_date:
                trades_by_date[d_str] = {'pnl': Decimal('0.00'), 'trades': 0}
            trades_by_date[d_str]['pnl'] += trade.net_pnl
            trades_by_date[d_str]['trades'] += 1

        curve = []
        running_capital = starting_capital
        peak_capital = running_capital
        cumulative_pnl = Decimal('0.00')

        curve.append({
            'date': challenge.start_date.isoformat(),
            'capital': float(running_capital),
            'daily_pnl': 0.0,
            'cumulative_pnl': 0.0,
            'drawdown': 0.0,
            'trades_count': 0
        })

        for d_str in sorted(trades_by_date.keys()):
            daily_pnl = trades_by_date[d_str]['pnl']
            trades_count = trades_by_date[d_str]['trades']
            running_capital += daily_pnl
            cumulative_pnl += daily_pnl
            
            if running_capital > peak_capital:
                peak_capital = running_capital
            drawdown = peak_capital - running_capital

            curve.append({
                'date': d_str,
                'capital': float(running_capital),
                'daily_pnl': float(daily_pnl),
                'cumulative_pnl': float(cumulative_pnl),
                'drawdown': float(drawdown),
                'trades_count': trades_count
            })

        return curve
