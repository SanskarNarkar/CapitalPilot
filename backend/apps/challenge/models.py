from decimal import Decimal
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class ChallengeConfig(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='challenges')
    name = models.CharField(max_length=100, default="15k to 1.35L Options Challenge")
    starting_capital = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal('15000.00'))
    target_profit = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal('120000.00'))
    target_capital = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal('135000.00'))
    start_date = models.DateField(default=timezone.now)
    end_date = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.name} (Target: ₹{self.target_capital})"

class DailySnapshot(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='daily_snapshots')
    challenge = models.ForeignKey(ChallengeConfig, on_delete=models.CASCADE, related_name='snapshots')
    date = models.DateField()
    starting_capital = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal('0.00'))
    ending_capital = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal('0.00'))
    gross_pnl = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal('0.00'))
    charges = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal('0.00'))
    net_pnl = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal('0.00'))
    trade_count = models.IntegerField(default=0)
    win_count = models.IntegerField(default=0)
    loss_count = models.IntegerField(default=0)
    drawdown = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal('0.00'))
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['date']
        unique_together = ('user', 'challenge', 'date')

    def __str__(self):
        return f"{self.date}: Net P&L ₹{self.net_pnl} (Capital: ₹{self.ending_capital})"
