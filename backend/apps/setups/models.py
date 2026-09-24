from decimal import Decimal
from django.db import models
from django.contrib.auth.models import User

class Setup(models.Model):
    INDEX_CHOICES = [
        ('ALL', 'All Indices'),
        ('NIFTY', 'NIFTY 50'),
        ('BANKNIFTY', 'BANKNIFTY'),
        ('SENSEX', 'SENSEX'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='setups', null=True, blank=True)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, default='')
    entry_conditions = models.TextField(blank=True, default='')
    stop_loss_rules = models.TextField(blank=True, default='')
    target_rules = models.TextField(blank=True, default='')
    min_rr = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('2.00'))
    applicable_index = models.CharField(max_length=20, choices=INDEX_CHOICES, default='ALL')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.applicable_index})"
