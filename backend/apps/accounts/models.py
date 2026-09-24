from django.db import models
from django.contrib.auth.models import User

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    phone = models.CharField(max_length=20, blank=True, default='')
    dhan_client_id = models.CharField(max_length=50, blank=True, default='')
    default_index = models.CharField(max_length=20, default='NIFTY')
    experience_level = models.CharField(max_length=20, default='INTERMEDIATE')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}'s Profile"
