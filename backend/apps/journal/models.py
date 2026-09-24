from decimal import Decimal
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class DailyTradingPlan(models.Model):
    BIAS_CHOICES = [
        ('BULLISH', 'Bullish'),
        ('BEARISH', 'Bearish'),
        ('NEUTRAL', 'Neutral / Rangebound'),
        ('VOLATILE', 'Volatile / Both Sides'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='trading_plans')
    date = models.DateField(default=timezone.now)
    starting_capital = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal('15000.00'))
    daily_profit_target = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal('1500.00'))
    max_daily_loss = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal('600.00'))
    max_trades = models.IntegerField(default=3)
    risk_per_trade_pct = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('1.00'))
    max_risk_amount = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal('200.00'))
    primary_index = models.CharField(max_length=20, default='NIFTY')
    secondary_index = models.CharField(max_length=20, blank=True, default='BANKNIFTY')
    preferred_setups = models.CharField(max_length=255, blank=True, default='VWAP Rejection, ORB')
    avoid_conditions = models.TextField(blank=True, default='Choppy first 15 mins, Major RBI press conference')
    market_bias = models.CharField(max_length=20, choices=BIAS_CHOICES, default='NEUTRAL')
    important_events = models.TextField(blank=True, default='US CPI Data, Weekly Expiry')
    notes = models.TextField(blank=True, default='')
    plan_followed = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date']
        unique_together = ('user', 'date')

    def __str__(self):
        return f"{self.user.username} Plan for {self.date} ({self.market_bias})"
