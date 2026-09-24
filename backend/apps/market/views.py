from rest_framework import views, permissions
from rest_framework.response import Response
from .providers import MarketAPIError, get_market_provider

class MarketOverviewView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        provider = get_market_provider()
        try:
            data = provider.get_market_overview()
        except MarketAPIError as exc:
            return Response({'status': 'ERROR', 'detail': str(exc)}, status=502)
        return Response(data)
