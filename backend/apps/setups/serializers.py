from rest_framework import serializers
from .models import Setup

class SetupSerializer(serializers.ModelSerializer):
    stats = serializers.SerializerMethodField()

    class Meta:
        model = Setup
        fields = (
            'id', 'name', 'description', 'entry_conditions', 
            'stop_loss_rules', 'target_rules', 'min_rr', 
            'applicable_index', 'is_active', 'stats',
            'created_at', 'updated_at'
        )

    def get_stats(self, obj):
        # Calculate stats dynamically if trades are available
        trades = obj.trades.filter(status='CLOSED')
        user = self.context.get('request').user if self.context.get('request') else None
        if user and user.is_authenticated:
            trades = trades.filter(user=user)

        total_trades = trades.count()
        if total_trades == 0:
            return {
                'total_trades': 0,
                'wins': 0,
                'losses': 0,
                'win_rate': 0.0,
                'avg_win': 0.0,
                'avg_loss': 0.0,
                'total_pnl': 0.0,
                'profit_factor': 0.0,
                'expectancy': 0.0
            }

        wins = trades.filter(net_pnl__gt=0)
        losses = trades.filter(net_pnl__lt=0)
        win_count = wins.count()
        loss_count = losses.count()
        win_rate = round((win_count / total_trades) * 100, 2)

        gross_profit = sum([float(t.net_pnl) for t in wins]) if win_count else 0.0
        gross_loss = abs(sum([float(t.net_pnl) for t in losses])) if loss_count else 0.0
        total_pnl = round(sum([float(t.net_pnl) for t in trades]), 2)

        avg_win = round(gross_profit / win_count, 2) if win_count > 0 else 0.0
        avg_loss = round(gross_loss / loss_count, 2) if loss_count > 0 else 0.0
        profit_factor = round(gross_profit / gross_loss, 2) if gross_loss > 0 else (99.0 if gross_profit > 0 else 0.0)

        win_prob = win_count / total_trades
        loss_prob = loss_count / total_trades
        expectancy = round((win_prob * avg_win) - (loss_prob * avg_loss), 2)

        return {
            'total_trades': total_trades,
            'wins': win_count,
            'losses': loss_count,
            'win_rate': win_rate,
            'avg_win': avg_win,
            'avg_loss': avg_loss,
            'total_pnl': total_pnl,
            'profit_factor': profit_factor,
            'expectancy': expectancy
        }
