from rest_framework import serializers
from .models import ChallengeConfig, DailySnapshot

class ChallengeConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChallengeConfig
        fields = (
            'id', 'name', 'starting_capital', 'target_profit', 
            'target_capital', 'start_date', 'end_date', 'is_active',
            'created_at', 'updated_at'
        )

class DailySnapshotSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailySnapshot
        fields = '__all__'
