from decimal import Decimal
from rest_framework import views, permissions, status
from rest_framework.response import Response
from .services import ScenarioEngineService
from apps.analytics.services import AnalyticsService
from apps.challenge.models import ChallengeConfig

class ScenarioCalculatorView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        # Defaults to user analytics if not supplied
        analytics = AnalyticsService.get_full_analytics(request.user)
        summary = analytics['summary']

        challenge = ChallengeConfig.objects.filter(user=request.user, is_active=True).first()
        default_cap = float(challenge.starting_capital) if challenge else 15000.0

        starting_capital = float(request.data.get('starting_capital', default_cap))
        win_rate = float(request.data.get('win_rate', summary.get('win_rate') or 55.0))
        avg_win = float(request.data.get('avg_win', summary.get('avg_win') or 1200.0))
        avg_loss = float(request.data.get('avg_loss', summary.get('avg_loss') or 600.0))
        trades_per_day = int(request.data.get('trades_per_day', 2))
        trading_days = int(request.data.get('trading_days', 45))

        res = ScenarioEngineService.calculate_scenarios(
            starting_capital=starting_capital,
            win_rate=win_rate,
            avg_win=avg_win,
            avg_loss=avg_loss,
            trades_per_day=trades_per_day,
            trading_days=trading_days
        )
        return Response(res)

class MonteCarloSimulatorView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        analytics = AnalyticsService.get_full_analytics(request.user)
        summary = analytics['summary']

        challenge = ChallengeConfig.objects.filter(user=request.user, is_active=True).first()
        default_cap = float(challenge.starting_capital) if challenge else 15000.0

        starting_capital = float(request.data.get('starting_capital', default_cap))
        win_rate = float(request.data.get('win_rate', summary.get('win_rate') or 55.0))
        avg_win = float(request.data.get('avg_win', summary.get('avg_win') or 1200.0))
        avg_loss = float(request.data.get('avg_loss', summary.get('avg_loss') or 600.0))
        num_trades = int(request.data.get('num_trades', 60))
        num_simulations = int(request.data.get('num_simulations', 200))

        res = ScenarioEngineService.run_monte_carlo(
            starting_capital=starting_capital,
            win_rate=win_rate,
            avg_win=avg_win,
            avg_loss=avg_loss,
            num_trades=num_trades,
            num_simulations=num_simulations
        )
        return Response(res)
