from decimal import Decimal
from django.utils import timezone
from django.db.models import Sum, Q
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Trade
from .serializers import TradeSerializer, TradeCreateUpdateSerializer
from apps.risk.services import RiskEngineService

class TradeViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return TradeCreateUpdateSerializer
        return TradeSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = Trade.objects.filter(user=user)

        # Filters
        index = self.request.query_params.get('index')
        if index and index != 'ALL':
            queryset = queryset.filter(index=index.upper())

        side = self.request.query_params.get('side')
        if side and side != 'ALL':
            queryset = queryset.filter(side=side.upper())

        trade_status = self.request.query_params.get('status')
        if trade_status and trade_status != 'ALL':
            queryset = queryset.filter(status=trade_status.upper())

        emotion = self.request.query_params.get('emotion')
        if emotion and emotion != 'ALL':
            queryset = queryset.filter(psychology=emotion.upper())

        date = self.request.query_params.get('date')
        if date:
            queryset = queryset.filter(date=date)

        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date and end_date:
            queryset = queryset.filter(date__range=[start_date, end_date])

        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(symbol__icontains=search) | 
                Q(trade_id__icontains=search) | 
                Q(dhan_order_id__icontains=search) | 
                Q(notes__icontains=search)
            )

        return queryset.order_by('-date', '-time', '-id')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        user = request.user
        today = timezone.now().date()

        all_trades = Trade.objects.filter(user=user)
        closed_trades = all_trades.filter(status='CLOSED')
        today_trades = closed_trades.filter(date=today)
        open_trades = all_trades.filter(status='OPEN')

        total_closed = closed_trades.count()
        wins = closed_trades.filter(net_pnl__gt=0).count()
        losses = closed_trades.filter(net_pnl__lt=0).count()
        win_rate = round((wins / total_closed) * 100, 2) if total_closed > 0 else 0.0

        total_pnl = closed_trades.aggregate(s=Sum('net_pnl'))['s'] or Decimal('0.00')
        today_pnl = today_trades.aggregate(s=Sum('net_pnl'))['s'] or Decimal('0.00')

        return Response({
            'total_trades': all_trades.count(),
            'closed_trades': total_closed,
            'open_trades': open_trades.count(),
            'wins': wins,
            'losses': losses,
            'win_rate': win_rate,
            'total_net_pnl': float(total_pnl),
            'today_net_pnl': float(today_pnl),
        })

    @action(detail=False, methods=['get'])
    def open_positions(self, request):
        open_trades = Trade.objects.filter(user=request.user, status='OPEN').order_by('-date', '-time')
        return Response(TradeSerializer(open_trades, many=True).data)
