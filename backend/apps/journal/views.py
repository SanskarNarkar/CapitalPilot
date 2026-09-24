from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import DailyTradingPlan
from .serializers import DailyTradingPlanSerializer

class DailyTradingPlanViewSet(viewsets.ModelViewSet):
    serializer_class = DailyTradingPlanSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return DailyTradingPlan.objects.filter(user=self.request.user).order_by('-date')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def today(self, request):
        today = timezone.now().date()
        plan = DailyTradingPlan.objects.filter(user=request.user, date=today).first()
        if plan:
            return Response(DailyTradingPlanSerializer(plan).data)
        return Response({'detail': 'No plan recorded for today'}, status=status.HTTP_404_NOT_FOUND)
