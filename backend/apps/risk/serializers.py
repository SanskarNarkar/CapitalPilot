from rest_framework import serializers
from .models import InstrumentLotSize, GlobalRiskSettings, IndexRiskProfile

class InstrumentLotSizeSerializer(serializers.ModelSerializer):
    class Meta:
        model = InstrumentLotSize
        fields = '__all__'

class GlobalRiskSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = GlobalRiskSettings
        fields = (
            'id', 'risk_per_trade_pct', 'max_daily_loss_pct', 
            'max_consecutive_losses', 'max_trades_per_day', 
            'min_rr_ratio', 'max_drawdown_pct', 'is_firewall_enabled',
            'created_at', 'updated_at'
        )

class IndexRiskProfileSerializer(serializers.ModelSerializer):
    lot_size = serializers.SerializerMethodField()

    class Meta:
        model = IndexRiskProfile
        fields = (
            'id', 'index', 'risk_per_trade_pct', 'max_daily_loss_pct', 
            'max_trades', 'min_rr', 'preferred_setups', 
            'trading_session_start', 'trading_session_end', 
            'max_position_lots', 'lot_size', 'is_active',
            'created_at', 'updated_at'
        )

    def get_lot_size(self, obj):
        from .services import RiskEngineService
        return RiskEngineService.get_active_lot_size(obj.index)
