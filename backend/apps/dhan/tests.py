import base64
import json
from datetime import timedelta
from unittest.mock import Mock, patch

from django.test import TestCase, override_settings
from django.utils import timezone

from .auth_service import DhanAuthError, DhanAuthService
from .models import DhanAuthState
from .providers import DemoDhanProvider, DhanAPIError, LiveDhanProvider, get_dhan_provider


def fake_jwt(expiry):
    payload = base64.urlsafe_b64encode(json.dumps({'exp': int(expiry.timestamp())}).encode()).decode().rstrip('=')
    return f'header.{payload}.signature'


class DhanAuthServiceTests(TestCase):
    def test_demo_mode_never_authenticates(self):
        with override_settings(DHAN_DEMO_MODE=True, DEMO_MODE=True, DHAN_PIN='pin', DHAN_TOTP_SECRET='secret'):
            with patch('apps.dhan.auth_service.requests.post') as request:
                provider = get_dhan_provider()
                self.assertIsInstance(provider, DemoDhanProvider)
                with self.assertRaises(DhanAuthError):
                    DhanAuthService.get_valid_access_token()
                request.assert_not_called()

    @override_settings(DHAN_DEMO_MODE=False, DEMO_MODE=False, DHAN_ACCESS_TOKEN='')
    def test_valid_stored_token_is_reused(self):
        token = fake_jwt(timezone.now() + timedelta(hours=2))
        state = DhanAuthState.objects.create(
            access_token_encrypted=DhanAuthService._encrypt(token),
            expires_at=timezone.now() + timedelta(hours=2),
        )
        with patch.object(DhanAuthService, 'generate_access_token') as generate:
            self.assertEqual(DhanAuthService.get_valid_access_token(), token)
            generate.assert_not_called()
        state.refresh_from_db()

    @override_settings(
        DHAN_DEMO_MODE=False,
        DEMO_MODE=False,
        DHAN_CLIENT_ID='client',
        DHAN_PIN='123456',
        DHAN_TOTP_SECRET='JBSWY3DPEHPK3PXP',
        DHAN_ACCESS_TOKEN='',
    )
    def test_expired_token_is_generated_and_saved(self):
        DhanAuthState.objects.create(
            access_token_encrypted=DhanAuthService._encrypt('expired'),
            expires_at=timezone.now() - timedelta(minutes=1),
        )
        new_token = fake_jwt(timezone.now() + timedelta(hours=24))
        response = Mock(ok=True)
        response.json.return_value = {
            'accessToken': new_token,
            'expiryTime': (timezone.now() + timedelta(hours=24)).isoformat(),
        }
        with patch('apps.dhan.auth_service.requests.post', return_value=response) as request:
            self.assertEqual(DhanAuthService.get_valid_access_token(), new_token)
            self.assertEqual(request.call_count, 1)

    @override_settings(
        DHAN_DEMO_MODE=False,
        DEMO_MODE=False,
        DHAN_CLIENT_ID='',
        DHAN_PIN='',
        DHAN_TOTP_SECRET='',
        DHAN_ACCESS_TOKEN='not-a-jwt',
    )
    def test_missing_credentials_fails_cleanly(self):
        with self.assertRaises(DhanAuthError):
            DhanAuthService.get_valid_access_token()

    @override_settings(DHAN_DEMO_MODE=False, DEMO_MODE=False, DHAN_ACCESS_TOKEN='')
    def test_401_refreshes_once(self):
        token = fake_jwt(timezone.now() + timedelta(hours=2))
        DhanAuthState.objects.create(
            access_token_encrypted=DhanAuthService._encrypt(token),
            expires_at=timezone.now() + timedelta(hours=2),
        )
        first = Mock(status_code=401)
        second = Mock(status_code=200)
        second.json.return_value = []
        with patch('apps.dhan.providers.requests.request', side_effect=[first, second]) as request, \
                patch.object(DhanAuthService, 'get_valid_access_token', side_effect=[token, token]), \
                patch.object(DhanAuthService, 'invalidate_cached_token'):
            self.assertEqual(LiveDhanProvider().get_orders(), [])
            self.assertEqual(request.call_count, 2)

    @override_settings(DHAN_DEMO_MODE=False, DEMO_MODE=False, DHAN_ACCESS_TOKEN='')
    def test_auth_status_contains_no_secret(self):
        status = DhanAuthService.get_auth_status()
        encoded = json.dumps(status)
        self.assertNotIn('accessToken', encoded)
        self.assertNotIn('totp', encoded.lower())
        self.assertNotIn('pin', encoded.lower())
