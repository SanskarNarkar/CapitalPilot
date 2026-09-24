from django.db import models
from django.contrib.auth.models import User

class Notification(models.Model):
    TYPE_CHOICES = [
        ('RISK', 'Risk Limit Alert'),
        ('SYNC', 'Synchronization'),
        ('RECONCILE', 'Reconciliation Mismatch'),
        ('MILESTONE', 'Challenge Milestone'),
        ('REVIEW', 'Coach Review Available'),
        ('SYSTEM', 'System Alert'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='SYSTEM')
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.notification_type}] {self.title} - {self.user.username}"
