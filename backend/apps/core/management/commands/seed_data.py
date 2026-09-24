from decimal import Decimal
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone

from apps.accounts.models import UserProfile
from apps.challenge.models import ChallengeConfig, DailySnapshot
from apps.setups.models import Setup
from apps.risk.models import InstrumentLotSize, GlobalRiskSettings, IndexRiskProfile
from apps.journal.models import DailyTradingPlan
from apps.trades.models import Trade
from apps.notifications.models import Notification

class Command(BaseCommand):
    help = 'Seeds realistic 3-week challenge data, setups, trades, and risk configurations for CapitalPilot'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.NOTICE("Initiating CapitalPilot data seeding..."))

        # 1. Create or get primary demo user
        user, created = User.objects.get_or_create(username='trader', defaults={
            'email': 'trader@capitalpilot.com',
            'first_name': 'Sanskar',
            'last_name': 'Pilot'
        })
        user.set_password('capitalpilot123')
        user.save()
        self.stdout.write(self.style.SUCCESS(f"User '{user.username}' created/verified."))

        profile, _ = UserProfile.objects.get_or_create(user=user)
        profile.dhan_client_id = 'DHAN-DEMO-8899'
        profile.default_index = 'NIFTY'
        profile.experience_level = 'INTERMEDIATE'
        profile.save()

        # 2. Seed Instrument Lot Sizes (Updateable, not hard-coded!)
        lot_sizes = [
            ('NIFTY', 65, 'Current NSE NIFTY contract lot size'),
            ('BANKNIFTY', 30, 'Current NSE BANKNIFTY contract lot size'),
            ('SENSEX', 20, 'Current BSE SENSEX contract lot size'),
            ('FINNIFTY', 25, 'Standard NSE FINNIFTY contract lot size'),
            ('MIDCPNIFTY', 50, 'Standard NSE MIDCPNIFTY contract lot size'),
        ]
        for idx, lot, note in lot_sizes:
            InstrumentLotSize.objects.update_or_create(
                index=idx,
                defaults={
                    'lot_size': lot,
                    'is_active': True,
                    'notes': note,
                    'effective_date': timezone.now().date() - timedelta(days=90)
                }
            )
        self.stdout.write(self.style.SUCCESS("Instrument lot sizes configured."))

        # 3. Seed Default Trading Setups
        default_setups_data = [
            {
                'name': 'VWAP Rejection',
                'description': 'Price tests institutional volume-weighted average price and rejects with candle confirmation.',
                'entry_conditions': 'First 5-min rejection candle at VWAP in the direction of the daily bias.',
                'stop_loss_rules': '5-10 points above/below the rejection candle wick.',
                'target_rules': '1:2 minimum or previous swing high/low.',
                'min_rr': Decimal('2.00'),
                'applicable_index': 'ALL'
            },
            {
                'name': 'Opening Range Breakout',
                'description': 'Breakout of the first 15-minute high or low with volume surge.',
                'entry_conditions': 'Clean 5-minute candle closing outside 15-min range with RSI > 60 or < 40.',
                'stop_loss_rules': 'Mid-point of 15-min opening range.',
                'target_rules': '1:2 R:R or 1.5x of the opening range width.',
                'min_rr': Decimal('2.00'),
                'applicable_index': 'NIFTY'
            },
            {
                'name': 'Support Breakout',
                'description': 'Key horizontal support test and failure for short positions.',
                'entry_conditions': 'Multiple touches on support followed by strong bearish breakdown.',
                'stop_loss_rules': 'Above the breakdown pivot candle.',
                'target_rules': 'Next daily support zone.',
                'min_rr': Decimal('2.00'),
                'applicable_index': 'ALL'
            },
            {
                'name': 'Support Breakdown',
                'description': 'Short execution upon confirmed breakdown of key intraday floor.',
                'entry_conditions': 'Volume expansion with red candle close below support.',
                'stop_loss_rules': 'Above breakdown candle high.',
                'target_rules': '1:2.5 R:R.',
                'min_rr': Decimal('2.00'),
                'applicable_index': 'ALL'
            },
            {
                'name': 'Resistance Breakout',
                'description': 'Long momentum breakout past supply barrier.',
                'entry_conditions': 'Consolidation below resistance followed by high volume green breakout.',
                'stop_loss_rules': 'Below the breakout level or candle low.',
                'target_rules': 'Next liquidity pool / pivot.',
                'min_rr': Decimal('2.00'),
                'applicable_index': 'ALL'
            },
            {
                'name': 'Trend Continuation',
                'description': 'Pullback into moving average in strong trend.',
                'entry_conditions': 'Pullback to 20 EMA with bullish/bearish engulfing.',
                'stop_loss_rules': 'Swing pivot beyond 20 EMA.',
                'target_rules': 'Trend extension 1:2 R:R.',
                'min_rr': Decimal('2.00'),
                'applicable_index': 'ALL'
            },
            {
                'name': 'Previous Day High Breakout',
                'description': 'Bullish continuation beyond PDH.',
                'entry_conditions': 'Morning rally accepting above PDH.',
                'stop_loss_rules': 'Below PDH level by 15 points.',
                'target_rules': '1:2.5 R:R.',
                'min_rr': Decimal('2.50'),
                'applicable_index': 'BANKNIFTY'
            },
            {
                'name': 'Previous Day Low Breakdown',
                'description': 'Bearish continuation below PDL.',
                'entry_conditions': 'Sustained weakness beneath previous session low.',
                'stop_loss_rules': 'Above PDL by 15 points.',
                'target_rules': '1:2.5 R:R.',
                'min_rr': Decimal('2.50'),
                'applicable_index': 'NIFTY'
            },
            {
                'name': 'EMA Trend Continuation',
                'description': '9 & 21 EMA crossover alignment pullbacks.',
                'entry_conditions': 'Price touches 9 EMA ribbon and resumes dominant trend.',
                'stop_loss_rules': 'Below 21 EMA.',
                'target_rules': '1:2 R:R.',
                'min_rr': Decimal('2.00'),
                'applicable_index': 'ALL'
            },
            {
                'name': 'Custom Discretionary',
                'description': 'Discretionary price action setup.',
                'entry_conditions': 'Defined setup per trading plan.',
                'stop_loss_rules': 'Strict technical invalidation level.',
                'target_rules': '1:2 R:R.',
                'min_rr': Decimal('2.00'),
                'applicable_index': 'ALL'
            }
        ]

        setups_dict = {}
        for s_data in default_setups_data:
            s_obj, _ = Setup.objects.update_or_create(
                name=s_data['name'],
                defaults={
                    'user': None,  # Global default setup
                    'description': s_data['description'],
                    'entry_conditions': s_data['entry_conditions'],
                    'stop_loss_rules': s_data['stop_loss_rules'],
                    'target_rules': s_data['target_rules'],
                    'min_rr': s_data['min_rr'],
                    'applicable_index': s_data['applicable_index'],
                    'is_active': True
                }
            )
            setups_dict[s_data['name']] = s_obj
        self.stdout.write(self.style.SUCCESS("Trading setups library seeded."))

        # 4. Global Risk Settings & Index Profiles
        GlobalRiskSettings.objects.update_or_create(
            user=user,
            defaults={
                'risk_per_trade_pct': Decimal('1.00'),
                'max_daily_loss_pct': Decimal('2.00'),
                'max_consecutive_losses': 2,
                'max_trades_per_day': 3,
                'min_rr_ratio': Decimal('2.00'),
                'max_drawdown_pct': Decimal('10.00'),
                'is_firewall_enabled': True
            }
        )

        for idx, max_lots in [('NIFTY', 4), ('BANKNIFTY', 3), ('SENSEX', 4)]:
            IndexRiskProfile.objects.update_or_create(
                user=user,
                index=idx,
                defaults={
                    'risk_per_trade_pct': Decimal('1.00'),
                    'max_daily_loss_pct': Decimal('2.00'),
                    'max_trades': 3,
                    'min_rr': Decimal('2.00'),
                    'preferred_setups': 'VWAP Rejection, ORB',
                    'max_position_lots': max_lots,
                    'is_active': True
                }
            )
        self.stdout.write(self.style.SUCCESS("Risk profiles & firewall configuration initialized."))

        # 5. Challenge Configuration (₹15,000 to ₹1,35,000)
        today = timezone.now().date()
        challenge_start = today - timedelta(days=18)
        challenge, _ = ChallengeConfig.objects.update_or_create(
            user=user,
            is_active=True,
            defaults={
                'name': '15k to 1.35L Options Challenge',
                'starting_capital': Decimal('15000.00'),
                'target_profit': Decimal('120000.00'),
                'target_capital': Decimal('135000.00'),
                'start_date': challenge_start
            }
        )
        self.stdout.write(self.style.SUCCESS("15k to 1.35L Challenge active."))

        # 6. Seed Daily Plans & 25 Realistic Trades across 14 trading days
        # Clear existing trades for demo user to ensure clean deterministic stats
        Trade.objects.filter(user=user).delete()
        DailyTradingPlan.objects.filter(user=user).delete()

        raw_trades_data = [
            # Day -18
            (-18, '09:25:00', 'NIFTY', 'NIFTY 24400 CE', 'OPTION', 'CE', 25, 110.0, 142.0, 95.0, 145.0, 'VWAP Rejection', 'CALM', 'Disciplined', True, 'NONE', 'First trade of challenge. Perfect bounce.'),
            (-18, '11:15:00', 'BANKNIFTY', 'BANKNIFTY 52000 PE', 'OPTION', 'PE', 15, 210.0, 195.0, 195.0, 250.0, 'Support Breakdown', 'CALM', 'Disciplined', True, 'NONE', 'Fake breakdown, hit stop loss quickly.'),
            # Day -17
            (-17, '09:35:00', 'NIFTY', 'NIFTY 24450 CE', 'OPTION', 'CE', 25, 125.0, 165.0, 110.0, 160.0, 'Opening Range Breakout', 'CONFIDENT', 'Focused', True, 'NONE', '15m ORB continuation above morning highs.'),
            # Day -16
            (-16, '10:05:00', 'NIFTY', 'NIFTY 24500 PE', 'OPTION', 'PE', 25, 115.0, 145.0, 100.0, 150.0, 'Resistance Breakout', 'CALM', 'Patient', True, 'NONE', 'Clean scalp.'),
            (-16, '13:20:00', 'BANKNIFTY', 'BANKNIFTY 52200 CE', 'OPTION', 'CE', 15, 230.0, 205.0, 205.0, 280.0, 'Trend Continuation', 'FOMO', 'Rushed', False, 'LATE_ENTRY', 'Chased green candle late in afternoon session.'),
            # Day -15
            (-15, '09:40:00', 'SENSEX', 'SENSEX 80500 CE', 'OPTION', 'CE', 20, 180.0, 240.0, 155.0, 235.0, 'Previous Day High Breakout', 'CONFIDENT', 'Strong', True, 'NONE', 'Sensex expiry scalp.'),
            # Day -14
            (-14, '09:50:00', 'NIFTY', 'NIFTY 24550 CE', 'OPTION', 'CE', 25, 130.0, 172.0, 115.0, 170.0, 'EMA Trend Continuation', 'CALM', 'Relaxed', True, 'NONE', '9 EMA bounce on 5m chart.'),
            # Day -13
            (-13, '10:15:00', 'BANKNIFTY', 'BANKNIFTY 52100 PE', 'OPTION', 'PE', 15, 240.0, 215.0, 215.0, 300.0, 'Support Breakdown', 'FEAR', 'Anxious', True, 'NONE', 'Choppy tape, disciplined stop loss exit.'),
            (-13, '11:45:00', 'NIFTY', 'NIFTY 24500 PE', 'OPTION', 'PE', 25, 105.0, 140.0, 92.0, 135.0, 'VWAP Rejection', 'CALM', 'Patient', True, 'NONE', 'Second chance VWAP rejection yielded 35 pts.'),
            # Day -11
            (-11, '09:30:00', 'NIFTY', 'NIFTY 24600 CE', 'OPTION', 'CE', 25, 140.0, 188.0, 122.0, 180.0, 'Opening Range Breakout', 'CONFIDENT', 'In Flow', True, 'NONE', 'Rally post gap up.'),
            # Day -10
            (-10, '10:30:00', 'BANKNIFTY', 'BANKNIFTY 52400 CE', 'OPTION', 'CE', 15, 260.0, 335.0, 230.0, 320.0, 'Trend Continuation', 'CALM', 'Poised', True, 'NONE', 'Major banking index momentum run.'),
            (-10, '13:45:00', 'NIFTY', 'NIFTY 24650 CE', 'OPTION', 'CE', 25, 95.0, 75.0, 75.0, 140.0, 'Custom Discretionary', 'REVENGE', 'Frustrated', False, 'REVENGE_TRADE', 'Tried to squeeze extra profit before close.'),
            # Day -9
            (-9, '09:20:00', 'NIFTY', 'NIFTY 24600 PE', 'OPTION', 'PE', 25, 150.0, 195.0, 132.0, 190.0, 'Previous Day Low Breakdown', 'CALM', 'Disciplined', True, 'NONE', 'Followed morning gap down cleanly.'),
            # Day -8
            (-8, '10:10:00', 'SENSEX', 'SENSEX 80800 CE', 'OPTION', 'CE', 20, 190.0, 255.0, 165.0, 250.0, 'Resistance Breakout', 'CONFIDENT', 'Steady', True, 'NONE', 'BSE index trend day.'),
            # Day -7
            (-7, '09:35:00', 'NIFTY', 'NIFTY 24650 CE', 'OPTION', 'CE', 50, 110.0, 138.0, 96.0, 140.0, 'Opening Range Breakout', 'CALM', 'Calm', True, 'NONE', 'Scaled to 2 lots as capital crossed ₹25,000.'),
            (-7, '11:00:00', 'BANKNIFTY', 'BANKNIFTY 52600 PE', 'OPTION', 'PE', 15, 210.0, 185.0, 185.0, 260.0, 'VWAP Rejection', 'FEAR', 'Nervous', True, 'NONE', 'Small loss taken cleanly.'),
            # Day -5
            (-5, '09:45:00', 'NIFTY', 'NIFTY 24700 CE', 'OPTION', 'CE', 50, 120.0, 158.0, 104.0, 155.0, 'EMA Trend Continuation', 'CONFIDENT', 'Decisive', True, 'NONE', 'Smooth pullback into 9 EMA.'),
            # Day -4
            (-4, '10:20:00', 'BANKNIFTY', 'BANKNIFTY 52800 CE', 'OPTION', 'CE', 30, 250.0, 318.0, 220.0, 310.0, 'Support Breakout', 'CALM', 'Patient', True, 'NONE', '2 lots Bank Nifty scalp.'),
            (-4, '13:10:00', 'NIFTY', 'NIFTY 24750 PE', 'OPTION', 'PE', 50, 85.0, 70.0, 70.0, 120.0, 'VWAP Rejection', 'UNCERTAIN', 'Hesitant', False, 'EARLY_ENTRY', 'Jumped in before VWAP touch.'),
            # Day -3
            (-3, '09:30:00', 'NIFTY', 'NIFTY 24700 PE', 'OPTION', 'PE', 50, 130.0, 175.0, 112.0, 170.0, 'Previous Day Low Breakdown', 'CONFIDENT', 'Sharp', True, 'NONE', 'Exited at predetermined target.'),
            # Day -2
            (-2, '10:00:00', 'SENSEX', 'SENSEX 81000 CE', 'OPTION', 'CE', 20, 210.0, 282.0, 180.0, 275.0, 'Resistance Breakout', 'CALM', 'Methodical', True, 'NONE', 'Smooth expiry scalp.'),
            # Day -1
            (-1, '09:40:00', 'NIFTY', 'NIFTY 24750 CE', 'OPTION', 'CE', 50, 115.0, 152.0, 98.0, 150.0, 'VWAP Rejection', 'CONFIDENT', 'Positive', True, 'NONE', 'Textbook setup.'),
            (-1, '11:30:00', 'BANKNIFTY', 'BANKNIFTY 53000 PE', 'OPTION', 'PE', 30, 240.0, 210.0, 210.0, 300.0, 'Support Breakdown', 'CALM', 'Controlled', True, 'NONE', 'Cut at stop.'),
            # Day 0 (Today)
            (0, '09:30:00', 'NIFTY', 'NIFTY 24800 CE', 'OPTION', 'CE', 50, 122.5, 154.0, 105.0, 150.0, 'Opening Range Breakout', 'CONFIDENT', 'Laser Focused', True, 'NONE', 'Morning breakout trade locked in.'),
            (0, '11:15:00', 'BANKNIFTY', 'BANKNIFTY 53100 CE', 'OPTION', 'CE', 30, 210.0, 248.0, 190.0, 245.0, 'Trend Continuation', 'CALM', 'Satisfied', True, 'NONE', 'Target reached. Done for the day.')
        ]

        # Group trade dates to build daily plans
        dates_seen = set()
        for offset, t_time, idx, sym, inst, o_type, qty, entry, exit_p, sl, tgt, s_name, psych, emot, r_fol, mist, notes in raw_trades_data:
            trade_date = today + timedelta(days=offset)
            dates_seen.add(trade_date)

        for d in sorted(dates_seen):
            DailyTradingPlan.objects.update_or_create(
                user=user,
                date=d,
                defaults={
                    'starting_capital': Decimal('15000.00'),
                    'daily_profit_target': Decimal('2000.00'),
                    'max_daily_loss': Decimal('800.00'),
                    'max_trades': 3,
                    'risk_per_trade_pct': Decimal('1.00'),
                    'max_risk_amount': Decimal('400.00'),
                    'primary_index': 'NIFTY',
                    'secondary_index': 'BANKNIFTY',
                    'preferred_setups': 'VWAP Rejection, ORB',
                    'avoid_conditions': 'First 15m whipsaw, US rate announcement',
                    'market_bias': 'BULLISH' if d.day % 2 == 0 else 'NEUTRAL',
                    'important_events': 'Weekly Expiry, Macro data',
                    'notes': 'Trade strictly according to edge. Respect stop losses without hesitation.',
                    'plan_followed': True
                }
            )

        # Create Trades
        trade_counter = 1
        for offset, t_time, idx, sym, inst, o_type, qty, entry, exit_p, sl, tgt, s_name, psych, emot, r_fol, mist, notes in raw_trades_data:
            trade_date = today + timedelta(days=offset)
            setup_obj = setups_dict.get(s_name)

            # Keep demo quantities aligned with current exchange lots while preserving
            # the original one-lot/two-lot intent of the sample dataset.
            legacy_lots = {'NIFTY': 25, 'BANKNIFTY': 15, 'SENSEX': 10}
            current_lots = {'NIFTY': 65, 'BANKNIFTY': 30, 'SENSEX': 20}
            lot_count = max(1, round(qty / legacy_lots[idx]))
            qty = lot_count * current_lots[idx]

            Trade.objects.create(
                user=user,
                trade_id=f"TRD-{trade_date.strftime('%Y%m%d')}-{trade_counter:03d}",
                dhan_order_id=f"DHAN-ORD-{8000 + trade_counter}",
                dhan_trade_id=f"DHAN-TRD-{9000 + trade_counter}",
                date=trade_date,
                time=t_time,
                index=idx,
                symbol=sym,
                security_id=f"{50000 + trade_counter}",
                instrument=inst,
                option_type=o_type,
                side='BUY',
                quantity=qty,
                entry_price=Decimal(str(entry)),
                exit_price=Decimal(str(exit_p)),
                stop_loss=Decimal(str(sl)),
                target=Decimal(str(tgt)),
                setup=setup_obj,
                entry_reason=f"Technical confirmation via {s_name}",
                exit_reason="Target or stop loss reached according to rules",
                psychology=psych,
                emotion=emot,
                rule_followed=r_fol,
                mistake=mist,
                notes=notes,
                status='CLOSED'
            )
            trade_counter += 1

        self.stdout.write(self.style.SUCCESS(f"{len(raw_trades_data)} realistic trades and daily plans seeded."))

        # 7. Seed Notifications
        Notification.objects.filter(user=user).delete()
        Notification.objects.create(
            user=user,
            title="Challenge Milestone Achieved: ₹35,000 Equity",
            message="Your account capital has crossed ₹35,000, achieving 17.5% of your ₹1,35,000 target. Maintain risk discipline.",
            notification_type='MILESTONE'
        )
        Notification.objects.create(
            user=user,
            title="Dhan Synchronization Active",
            message="Broker sync verified with DhanHQ API. Automatic reconciliation status: SYNCHRONIZED.",
            notification_type='SYNC'
        )
        Notification.objects.create(
            user=user,
            title="AI Coach Weekly Review Available",
            message="Your weekly performance review is ready: Win rate 68.2%, zero daily risk breaches in last 7 days.",
            notification_type='REVIEW'
        )
        self.stdout.write(self.style.SUCCESS("Notifications initialized."))
        self.stdout.write(self.style.SUCCESS("=== CapitalPilot Data Seeding Finished Successfully! ==="))
