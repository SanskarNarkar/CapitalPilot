from django.db import models
from django.utils import timezone


class DhanAuthState(models.Model):
    """Encrypted server-side state for the account-level Dhan token."""

    key = models.CharField(max_length=32, unique=True, default='default')
    access_token_encrypted = models.TextField(blank=True, default='')
    expires_at = models.DateTimeField(null=True, blank=True)
    last_generated_at = models.DateTimeField(null=True, blank=True)
    last_success_at = models.DateTimeField(null=True, blank=True)
    last_sync_at = models.DateTimeField(null=True, blank=True)
    last_error = models.CharField(max_length=255, blank=True, default='')
    status = models.CharField(max_length=32, default='UNAUTHENTICATED')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def mark_sync(self):
        self.last_sync_at = timezone.now()
        self.save(update_fields=['last_sync_at', 'updated_at'])