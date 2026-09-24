from rest_framework import views, permissions
from rest_framework.response import Response
from .services import AnalyticsService

class AnalyticsDashboardView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        data = AnalyticsService.get_full_analytics(request.user)
        return Response(data)
