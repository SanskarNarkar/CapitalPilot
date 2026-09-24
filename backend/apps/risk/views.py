from rest_framework import viewsets, views, permissions, status
from rest_framework.response import Response
from .models import InstrumentLotSize, GlobalRiskSettings, IndexRiskProfile
from .serializers import InstrumentLotSizeSerializer, GlobalRiskSettingsSerializer, IndexRiskProfileSerializer
from .services import RiskEngineService

class GlobalRiskSettingsView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        settings, _ = GlobalRiskSettings.objects.get_or_create(user=request.user)
        return Response(GlobalRiskSettingsSerializer(settings).data)

    def put(self, request):
        settings, _ = GlobalRiskSettings.objects.get_or_create(user=request.user)
        serializer = GlobalRiskSettingsSerializer(settings, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

class IndexRiskProfileViewSet(viewsets.ModelViewSet):
    serializer_class = IndexRiskProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return IndexRiskProfile.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class InstrumentLotSizeViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = InstrumentLotSize.objects.filter(is_active=True)
    serializer_class = InstrumentLotSizeSerializer
    permission_classes = [permissions.IsAuthenticated]

class CalculatePositionSizeView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        index_name = request.data.get('index', 'NIFTY')
        entry_price = request.data.get('entry_price')
        stop_loss = request.data.get('stop_loss')
        custom_capital = request.data.get('capital')

        if entry_price is None or stop_loss is None:
            return Response({'error': 'entry_price and stop_loss are required'}, status=status.HTTP_400_BAD_REQUEST)

        result = RiskEngineService.calculate_position_size(
            user=request.user,
            index_name=index_name,
            entry_price=entry_price,
            stop_loss=stop_loss,
            custom_capital=custom_capital
        )
        return Response(result)

class ValidateFirewallView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        result = RiskEngineService.evaluate_firewall(user=request.user, trade_data=request.data)
        return Response(result)
