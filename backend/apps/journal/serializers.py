from rest_framework import serializers
from .models import DailyTradingPlan

class DailyTradingPlanSerializer(serializers.ModelSerializer):
    trades_count = serializers.SerializerMethodField()
    actual_pnl = serializers.SerializerMethodField()

    class Meta:
        model = DailyTradingPlan
        fields = (
            'id', 'date', 'starting_capital', 'daily_profit_target', 
            'max_daily_loss', 'max_trades', 'risk_per_trade_pct', 
            'max_risk_amount', 'primary_index', 'secondary_index', 
            'preferred_setups', 'avoid_conditions', 'market_bias', 
            'important_events', 'notes', 'plan_followed',
            'trades_count', 'actual_pnl', 'created_at', 'updated_at'
        )

    def get_trades_count(self, obj):
        return obj.user.trades.filter(date=obj.date).count()

    def get_actual_pnl(self, obj):
        trades = obj.user.trades.filter(date=obj.date, status='CLOSED')
        return float(sum([t.net_pnl for t in trades])) if trades.exists() else 0.0
