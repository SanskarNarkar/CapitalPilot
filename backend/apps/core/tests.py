from decimal import Decimal
from datetime import timedelta
from django.test import TestCase
from django.contrib.auth.models import User
from django.utils import timezone

from apps.challenge.models import ChallengeConfig
from apps.challenge.services import ChallengeService
from apps.setups.models import Setup
from apps.risk.models import InstrumentLotSize, GlobalRiskSettings, IndexRiskProfile
from apps.risk.services import RiskEngineService
from apps.journal.models import DailyTradingPlan
from apps.trades.models import Trade
from apps.dhan.services import DhanSyncService
from apps.analytics.services import AnalyticsService
from apps.scenario.services import ScenarioEngineService
from apps.ai_coach.services import AICoachService

class CapitalPilotBackendTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='test_trader', password='password123')
        
        # Seed lot sizes
        InstrumentLotSize.objects.create(index='NIFTY', lot_size=65, is_active=True)
        InstrumentLotSize.objects.create(index='BANKNIFTY', lot_size=30, is_active=True)
        InstrumentLotSize.objects.create(index='SENSEX', lot_size=20, is_active=True)

        # Seed Setup
        self.setup = Setup.objects.create(
            name='VWAP Rejection',
            min_rr=Decimal('2.00'),
            applicable_index='ALL',
            is_active=True
        )

        # Seed Risk settings
        self.risk_settings = GlobalRiskSettings.objects.create(
            user=self.user,
            risk_per_trade_pct=Decimal('1.00'),
            max_daily_loss_pct=Decimal('2.00'),
            max_consecutive_losses=2,
            max_trades_per_day=3,
            min_rr_ratio=Decimal('2.00'),
            max_drawdown_pct=Decimal('10.00'),
            is_firewall_enabled=True
        )

        # Seed Challenge
        self.challenge = ChallengeConfig.objects.create(
            user=self.user,
            name='15k to 1.35L Challenge',
            starting_capital=Decimal('15000.00'),
            target_profit=Decimal('120000.00'),
            target_capital=Decimal('135000.00'),
            is_active=True
        )

        # Seed Daily Plan for today
        self.today = timezone.now().date()
        self.plan = DailyTradingPlan.objects.create(
            user=self.user,
            date=self.today,
            starting_capital=Decimal('15000.00'),
            daily_profit_target=Decimal('1500.00'),
            max_daily_loss=Decimal('600.00'),
            max_trades=3,
            risk_per_trade_pct=Decimal('1.00'),
            max_risk_amount=Decimal('200.00'),
            primary_index='NIFTY',
            plan_followed=True
        )

    def test_dynamic_lot_size_lookup(self):
        """Verify contract lot size is dynamically queried and not permanently hard-coded."""
        nifty_lot = RiskEngineService.get_active_lot_size('NIFTY')
        self.assertEqual(nifty_lot, 65)
        
        banknifty_lot = RiskEngineService.get_active_lot_size('BANKNIFTY')
        self.assertEqual(banknifty_lot, 30)

    def test_position_sizing_calculator(self):
        """Verify position sizing respects allowed risk, capital, and exchange lots."""
        # Capital ₹15,000, 1% risk = ₹150.
        # Entry 100, SL 98 -> risk_per_unit = 2.
        # Risk per lot (65) = ₹130.
        # Max lots allowed = int(150 // 130) = 1 lot (65 qty).
        res = RiskEngineService.calculate_position_size(
            user=self.user,
            index_name='NIFTY',
            entry_price=Decimal('100.00'),
            stop_loss=Decimal('98.00')
        )
        self.assertEqual(res['recommended_lots'], 1)
        self.assertEqual(res['recommended_quantity'], 65)
        self.assertEqual(res['actual_risk_amount'], 130.0)

    def test_trade_firewall_allowed(self):
        """Verify firewall returns ALLOWED when trade adheres to all 9 rules."""
        trade_data = {
            'index': 'NIFTY',
            'quantity': 65,
            'entry_price': '100.00',
            'stop_loss': '98.00',
            'target': '115.00', # 15 reward / 5 risk = 3:1 R:R >= 2:1
            'setup_id': self.setup.id
        }
        res = RiskEngineService.evaluate_firewall(user=self.user, trade_data=trade_data)
        self.assertEqual(res['status'], 'ALLOWED')
        self.assertTrue(res['is_allowed'])

    def test_trade_firewall_blocked_on_invalid_lot(self):
        """Verify firewall blocks trades with invalid non-lot quantities."""
        trade_data = {
            'index': 'NIFTY',
            'quantity': 37, # Invalid for NIFTY (lot is 65)
            'entry_price': '100.00',
            'stop_loss': '95.00',
            'target': '115.00',
            'setup_id': self.setup.id
        }
        res = RiskEngineService.evaluate_firewall(user=self.user, trade_data=trade_data)
        self.assertEqual(res['status'], 'BLOCKED')
        self.assertFalse(res['is_allowed'])
        
        lot_rule = next(r for r in res['rules'] if r['rule'] == 'position_size_lot')
        self.assertEqual(lot_rule['status'], 'FAIL')

    def test_trade_firewall_blocked_on_excess_risk(self):
        """Verify firewall blocks trades exceeding daily risk limits."""
        trade_data = {
            'index': 'NIFTY',
            'quantity': 100, # 4 lots = 100 * 5 = ₹500 risk (exceeds single trade 1% = ₹150)
            'entry_price': '100.00',
            'stop_loss': '95.00',
            'target': '115.00',
            'setup_id': self.setup.id
        }
        res = RiskEngineService.evaluate_firewall(user=self.user, trade_data=trade_data)
        self.assertEqual(res['status'], 'BLOCKED')
        
        risk_rule = next(r for r in res['rules'] if r['rule'] == 'risk_per_trade')
        self.assertEqual(risk_rule['status'], 'FAIL')

    def test_dhan_sync_and_reconciliation(self):
        """Verify Dhan demo sync populates trades idempotently and reconciles without duplicates."""
        # Run sync first time
        sync1 = DhanSyncService.sync_user_trades(self.user)
        self.assertEqual(sync1['status'], 'SUCCESS')
        synced_count = sync1['synced_count']
        self.assertGreater(synced_count, 0)

        # Run sync second time to verify duplicate prevention
        sync2 = DhanSyncService.sync_user_trades(self.user)
        self.assertEqual(sync2['synced_count'], 0)
        self.assertEqual(sync2['skipped_duplicates'], synced_count)

        # Run reconciliation
        rec = DhanSyncService.reconcile(self.user)
        self.assertEqual(rec['difference'], 0)
        self.assertEqual(rec['status'], 'SYNCHRONIZED')

    def test_challenge_summary_and_capital_curve(self):
        """Verify challenge metrics and capital curve calculation."""
        summary = ChallengeService.get_summary(self.user)
        self.assertEqual(summary['starting_capital'], 15000.0)
        self.assertEqual(summary['target_capital'], 135000.0)
        self.assertEqual(summary['target_profit'], 120000.0)

        curve = ChallengeService.get_curve(self.user)
        self.assertGreater(len(curve), 0)
        self.assertEqual(curve[0]['capital'], 15000.0)

    def test_analytics_calculations(self):
        """Verify analytics engine metrics."""
        analytics = AnalyticsService.get_full_analytics(self.user)
        self.assertIn('summary', analytics)
        self.assertIn('capital_curve', analytics)
        self.assertIn('setup_performance', analytics)
        self.assertIn('time_of_day_performance', analytics)
        self.assertIn('psychology_performance', analytics)

    def test_scenario_and_monte_carlo(self):
        """Verify Scenario Engine and Monte Carlo simulator produce valid probabilistic bounds."""
        scenarios = ScenarioEngineService.calculate_scenarios(
            starting_capital=15000.0,
            win_rate=55.0,
            avg_win=1000.0,
            avg_loss=500.0,
            trades_per_day=2,
            trading_days=30
        )
        self.assertEqual(len(scenarios['trajectories']), 31)
        self.assertGreater(scenarios['summary']['aggressive_ending'], scenarios['summary']['conservative_ending'])

        mc = ScenarioEngineService.run_monte_carlo(
            starting_capital=15000.0,
            win_rate=55.0,
            avg_win=1000.0,
            avg_loss=500.0,
            num_trades=30,
            num_simulations=50
        )
        self.assertIn('p50_median', mc['percentiles'])
        self.assertIn('sample_paths', mc)

    def test_ai_coach_insights(self):
        """Verify AI coach runs on user trades and generates discipline directive."""
        # Sync trades to provide historical data
        DhanSyncService.sync_user_trades(self.user)
        insights = AICoachService.analyze_user_performance(self.user)
        self.assertIn('todays_discipline', insights)
        self.assertTrue(len(insights['todays_discipline']['headline']) > 0)
