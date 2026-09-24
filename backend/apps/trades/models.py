from decimal import Decimal
import uuid
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from apps.setups.models import Setup

class Trade(models.Model):
    INDEX_CHOICES = [
        ('NIFTY', 'NIFTY 50'),
        ('BANKNIFTY', 'BANKNIFTY'),
        ('SENSEX', 'SENSEX'),
        ('FINNIFTY', 'FINNIFTY'),
        ('MIDCPNIFTY', 'MIDCPNIFTY'),
    ]

    SIDE_CHOICES = [
        ('BUY', 'Buy'),
        ('SELL', 'Sell'),
    ]

    INSTRUMENT_CHOICES = [
        ('OPTION', 'Option'),
        ('FUTURE', 'Future'),
        ('EQUITY', 'Equity'),
    ]

    OPTION_TYPE_CHOICES = [
        ('CE', 'Call Option (CE)'),
        ('PE', 'Put Option (PE)'),
        ('NONE', 'Not Applicable'),
    ]

    STATUS_CHOICES = [
        ('OPEN', 'Open'),
        ('CLOSED', 'Closed'),
    ]

    PSYCHOLOGY_CHOICES = [
        ('CALM', 'Calm'),
        ('CONFIDENT', 'Confident'),
        ('FEAR', 'Fear'),
        ('GREED', 'Greed'),
        ('FOMO', 'FOMO'),
        ('REVENGE', 'Revenge'),
        ('UNCERTAIN', 'Uncertain'),
    ]

    MISTAKE_CHOICES = [
        ('NONE', 'None'),
        ('EARLY_ENTRY', 'Early entry'),
        ('LATE_ENTRY', 'Late entry'),
        ('EARLY_EXIT', 'Early exit'),
        ('LATE_EXIT', 'Late exit'),
        ('REVENGE_TRADE', 'Revenge trade'),
        ('OVERTRADING', 'Overtrading'),
        ('INCREASED_QUANTITY', 'Increased quantity after loss'),
        ('IGNORED_SL', 'Ignored SL'),
        ('IGNORED_PLAN', 'Ignored plan'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='trades')
    trade_id = models.CharField(max_length=50, blank=True, db_index=True)
    dhan_order_id = models.CharField(max_length=100, blank=True, null=True, db_index=True)
    dhan_trade_id = models.CharField(max_length=100, blank=True, null=True)
    
    date = models.DateField(default=timezone.now, db_index=True)
    time = models.TimeField(default='09:20:00')
    exit_time = models.TimeField(null=True, blank=True)

    index = models.CharField(max_length=20, choices=INDEX_CHOICES, default='NIFTY')
    symbol = models.CharField(max_length=100, help_text="e.g. NIFTY 24500 CE")
    security_id = models.CharField(max_length=50, blank=True, default='')
    instrument = models.CharField(max_length=20, choices=INSTRUMENT_CHOICES, default='OPTION')
    option_type = models.CharField(max_length=10, choices=OPTION_TYPE_CHOICES, default='CE')
    strike = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    expiry = models.DateField(null=True, blank=True)
    side = models.CharField(max_length=10, choices=SIDE_CHOICES, default='BUY')
    quantity = models.IntegerField(default=65)
    
    entry_price = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    exit_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    stop_loss = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    target = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))

    # Financial breakdown
    gross_pnl = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal('0.00'))
    charges = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    net_pnl = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal('0.00'))
    broker_reported_pnl = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)

    # Risk metrics
    risk_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    rr_ratio = models.DecimalField(max_digits=6, decimal_places=2, default=Decimal('0.00'))
    holding_time_minutes = models.IntegerField(default=0)

    # Journaling & psychology
    setup = models.ForeignKey(Setup, on_delete=models.SET_NULL, null=True, blank=True, related_name='trades')
    entry_reason = models.TextField(blank=True, default='')
    exit_reason = models.TextField(blank=True, default='')
    psychology = models.CharField(max_length=20, choices=PSYCHOLOGY_CHOICES, default='CALM')
    emotion = models.CharField(max_length=50, blank=True, default='Disciplined')
    rule_followed = models.BooleanField(default=True)
    mistake = models.CharField(max_length=30, choices=MISTAKE_CHOICES, default='NONE')
    notes = models.TextField(blank=True, default='')
    screenshot_url = models.CharField(max_length=500, blank=True, default='')
    
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='CLOSED')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date', '-time', '-id']

    def __str__(self):
        return f"{self.trade_id or self.symbol} ({self.side}) Net: ₹{self.net_pnl}"

    def save(self, *args, **kwargs):
        if not self.trade_id:
            date_prefix = self.date.strftime("%Y%m%d")
            self.trade_id = f"TRD-{date_prefix}-{uuid.uuid4().hex[:6].upper()}"

        # Automatic P&L and Risk computation
        risk_per_unit = abs(self.entry_price - self.stop_loss)
        self.risk_amount = round(risk_per_unit * Decimal(self.quantity), 2)
        
        reward_per_unit = abs(self.target - self.entry_price)
        if risk_per_unit > 0:
            self.rr_ratio = round(reward_per_unit / risk_per_unit, 2)
        else:
            self.rr_ratio = Decimal('0.00')

        if self.status == 'CLOSED' and self.exit_price is not None:
            if self.side == 'BUY':
                self.gross_pnl = round((self.exit_price - self.entry_price) * Decimal(self.quantity), 2)
            else:
                self.gross_pnl = round((self.entry_price - self.exit_price) * Decimal(self.quantity), 2)

            # Auto calculate Indian options charges if not specified
            if self.charges == Decimal('0.00'):
                turnover = (self.entry_price + self.exit_price) * Decimal(self.quantity)
                brokerage = Decimal('40.00') # 20 buy + 20 sell
                stt = round(self.exit_price * Decimal(self.quantity) * Decimal('0.00125'), 2)
                exchange_charges = round(turnover * Decimal('0.0005'), 2)
                gst = round((brokerage + exchange_charges) * Decimal('0.18'), 2)
                stamp_duty = Decimal('3.00')
                self.charges = brokerage + stt + exchange_charges + gst + stamp_duty
                
            self.net_pnl = round(self.gross_pnl - self.charges, 2)

        super().save(*args, **kwargs)
