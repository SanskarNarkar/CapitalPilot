from decimal import Decimal
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class InstrumentLotSize(models.Model):
    INDEX_CHOICES = [
        ('NIFTY', 'NIFTY 50'),
        ('BANKNIFTY', 'BANKNIFTY'),
        ('SENSEX', 'SENSEX'),
        ('FINNIFTY', 'FINNIFTY'),
        ('MIDCPNIFTY', 'MIDCPNIFTY'),
    ]

    index = models.CharField(max_length=20, choices=INDEX_CHOICES, db_index=True)
    lot_size = models.IntegerField(help_text="Exchange contract lot size")
    effective_date = models.DateField(default=timezone.now)
    is_active = models.BooleanField(default=True)
    notes = models.CharField(max_length=255, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['index', '-effective_date']

    def __str__(self):
        return f"{self.index} Lot Size: {self.lot_size} (Eff: {self.effective_date})"

class GlobalRiskSettings(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='risk_settings')
    risk_per_trade_pct = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('1.00'), help_text="Default 1%")
    max_daily_loss_pct = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('2.00'), help_text="Default 2%")
    max_consecutive_losses = models.IntegerField(default=2, help_text="Max consecutive losses before cooldown")
    max_trades_per_day = models.IntegerField(default=3, help_text="Default 3 trades")
    min_rr_ratio = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('2.00'), help_text="Default 1:2")
    max_drawdown_pct = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('10.00'), help_text="Max challenge drawdown %")
    is_firewall_enabled = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} Global Risk Settings"

class IndexRiskProfile(models.Model):
    INDEX_CHOICES = [
        ('NIFTY', 'NIFTY 50'),
        ('BANKNIFTY', 'BANKNIFTY'),
        ('SENSEX', 'SENSEX'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='index_risk_profiles')
    index = models.CharField(max_length=20, choices=INDEX_CHOICES)
    risk_per_trade_pct = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('1.00'))
    max_daily_loss_pct = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('2.00'))
    max_trades = models.IntegerField(default=3)
    min_rr = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('2.00'))
    preferred_setups = models.CharField(max_length=255, blank=True, default='VWAP Rejection, ORB')
    trading_session_start = models.TimeField(default='09:15:00')
    trading_session_end = models.TimeField(default='15:15:00')
    max_position_lots = models.IntegerField(default=4, help_text="Max allowable lots in single trade")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'index')

    def __str__(self):
        return f"{self.user.username} - {self.index} Risk Profile"
