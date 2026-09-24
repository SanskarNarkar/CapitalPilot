from rest_framework import serializers
from .models import Trade
from apps.setups.serializers import SetupSerializer

class TradeSerializer(serializers.ModelSerializer):
    setup_name = serializers.CharField(source='setup.name', read_only=True)

    class Meta:
        model = Trade
        fields = '__all__'
        read_only_fields = ('user', 'gross_pnl', 'net_pnl', 'risk_amount', 'rr_ratio')

class TradeCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Trade
        fields = '__all__'
        read_only_fields = ('user', 'gross_pnl', 'net_pnl', 'risk_amount', 'rr_ratio')
