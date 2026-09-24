from celery import shared_task
from django.contrib.auth.models import User
from .services import DhanSyncService
from .auth_service import DhanAuthError, DhanAuthService

@shared_task
def sync_dhan_trades_task(user_id):
    try:
        user = User.objects.get(id=user_id)
        result = DhanSyncService.sync_user_trades(user)
        return result
    except User.DoesNotExist:
        return {'error': 'User not found'}

@shared_task
def refresh_dhan_access_token():
    if DhanAuthService.is_demo_mode():
        return {'status': 'DEMO_MODE'}
    try:
        DhanAuthService.get_valid_access_token()
        return {'status': 'AUTHENTICATED'}
    except DhanAuthError as exc:
        return {'status': 'UNAVAILABLE', 'error': str(exc)}
