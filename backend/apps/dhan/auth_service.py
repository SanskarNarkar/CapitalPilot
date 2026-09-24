import base64
import binascii
import hashlib
import json
import logging
import time
from datetime import datetime, timedelta, timezone as datetime_timezone
from zoneinfo import ZoneInfo

import pyotp
import requests
from cryptography.fernet import Fernet, InvalidToken
from django.conf import settings
from django.db import transaction
from django.utils import timezone

from .models import DhanAuthState

logger = logging.getLogger(__name__)


class DhanAuthError(Exception):
    """Safe application-level error for Dhan authentication failures."""


class DhanAuthService:
    AUTH_KEY = 'default'

    @classmethod
    def is_demo_mode(cls):
        return bool(getattr(settings, 'DHAN_DEMO_MODE', getattr(settings, 'DEMO_MODE', True)))

    @classmethod
    def _cipher(cls):
        digest = hashlib.sha256(settings.SECRET_KEY.encode('utf-8')).digest()
        return Fernet(base64.urlsafe_b64encode(digest))

    @classmethod
    def _state(cls):
        return DhanAuthState.objects.get_or_create(key=cls.AUTH_KEY)[0]

    @classmethod
    def _auto_configured(cls):
        return all([
            getattr(settings, 'DHAN_CLIENT_ID', ''),
            getattr(settings, 'DHAN_PIN', ''),
            getattr(settings, 'DHAN_TOTP_SECRET', ''),
        ])

    @classmethod
    def _buffer(cls):
        return timedelta(minutes=getattr(settings, 'DHAN_TOKEN_REFRESH_BUFFER_MINUTES', 30))

    @classmethod
    def _decrypt(cls, state):
        if not state.access_token_encrypted:
            return ''
        try:
            return cls._cipher().decrypt(state.access_token_encrypted.encode()).decode()
        except (InvalidToken, ValueError):
            logger.warning('Dhan stored token could not be decrypted')
            return ''

    @classmethod
    def _encrypt(cls, token):
        return cls._cipher().encrypt(token.encode()).decode()

    @classmethod
    def _parse_expiry(cls, value):
        if not value:
            return None
        parsed = datetime.fromisoformat(str(value).replace('Z', '+00:00'))
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=ZoneInfo(settings.TIME_ZONE))
        return parsed.astimezone(timezone.get_current_timezone())

    @classmethod
    def _token_expiry(cls, token):
        try:
            payload = token.split('.')[1]
            payload += '=' * (-len(payload) % 4)
            data = json.loads(base64.urlsafe_b64decode(payload).decode())
            return datetime.fromtimestamp(data['exp'], tz=datetime_timezone.utc)
        except (IndexError, KeyError, ValueError, TypeError, binascii.Error, UnicodeDecodeError, json.JSONDecodeError):
            return None

    @classmethod
    def is_token_valid(cls, token, expires_at=None):
        expiry = expires_at or cls._token_expiry(token)
        return bool(token and expiry and expiry > timezone.now() + cls._buffer())

    @classmethod
    def is_token_near_expiry(cls, expires_at):
        return not expires_at or expires_at <= timezone.now() + cls._buffer()

    @classmethod
    def generate_totp(cls):
        secret = getattr(settings, 'DHAN_TOTP_SECRET', '')
        if not secret:
            raise DhanAuthError('Automatic Dhan authentication is not configured')
        try:
            return pyotp.TOTP(secret).now()
        except (ValueError, TypeError) as exc:
            raise DhanAuthError('Dhan TOTP configuration is invalid') from exc

    @classmethod
    def generate_access_token(cls):
        if not cls._auto_configured():
            raise DhanAuthError('Automatic Dhan authentication credentials are incomplete')

        logger.info('Dhan authentication started')
        params = {
            'dhanClientId': settings.DHAN_CLIENT_ID,
            'pin': settings.DHAN_PIN,
            'totp': cls.generate_totp(),
        }
        last_error = None
        for attempt in range(3):
            try:
                response = requests.post(
                    getattr(settings, 'DHAN_AUTH_URL', 'https://auth.dhan.co/app/generateAccessToken'),
                    params=params,
                    timeout=10,
                )
                payload = response.json()
                if isinstance(payload, dict) and response.ok and payload.get('accessToken') and payload.get('expiryTime'):
                    return payload['accessToken'], cls._parse_expiry(payload['expiryTime'])
                last_error = payload.get('errorMessage') if isinstance(payload, dict) else None
                last_error = last_error or 'Dhan authentication was rejected'
            except (requests.RequestException, ValueError):
                last_error = 'Dhan authentication service unavailable'
                logger.warning('Dhan authentication attempt failed')
            if attempt < 2:
                time.sleep(0.2 * (2 ** attempt))

        raise DhanAuthError(str(last_error)[:255])

    @classmethod
    def _save_generated(cls, state, token, expires_at):
        state.access_token_encrypted = cls._encrypt(token)
        state.expires_at = expires_at
        state.last_generated_at = timezone.now()
        state.last_success_at = timezone.now()
        state.last_error = ''
        state.status = 'AUTHENTICATED'
        state.save(update_fields=[
            'access_token_encrypted', 'expires_at', 'last_generated_at',
            'last_success_at', 'last_error', 'status', 'updated_at',
        ])

    @classmethod
    def get_valid_access_token(cls, force_refresh=False):
        if cls.is_demo_mode():
            raise DhanAuthError('Dhan authentication is disabled in demo mode')

        manual_token = getattr(settings, 'DHAN_ACCESS_TOKEN', '')
        with transaction.atomic():
            state, _ = DhanAuthState.objects.select_for_update().get_or_create(key=cls.AUTH_KEY)
            stored_token = cls._decrypt(state)
            if not force_refresh and cls.is_token_valid(stored_token, state.expires_at):
                return stored_token

            if cls._auto_configured():
                try:
                    token, expires_at = cls.generate_access_token()
                    cls._save_generated(state, token, expires_at)
                    logger.info('Dhan authentication successful')
                    return token
                except DhanAuthError as exc:
                    state.last_error = str(exc)[:255]
                    state.status = 'AUTHENTICATION_FAILED'
                    state.save(update_fields=['last_error', 'status', 'updated_at'])
                    logger.warning('Dhan authentication failed')

            if cls.is_token_valid(manual_token):
                state.status = 'AUTHENTICATED_MANUAL'
                state.last_success_at = timezone.now()
                state.save(update_fields=['status', 'last_success_at', 'updated_at'])
                return manual_token

        raise DhanAuthError('No valid Dhan access token is available')

    @classmethod
    def invalidate_cached_token(cls):
        with transaction.atomic():
            state = DhanAuthState.objects.select_for_update().filter(key=cls.AUTH_KEY).first()
            if state:
                state.access_token_encrypted = ''
                state.expires_at = timezone.now()
                state.status = 'TOKEN_EXPIRED'
                state.save(update_fields=['access_token_encrypted', 'expires_at', 'status', 'updated_at'])

    @classmethod
    def record_api_failure(cls, message):
        state = DhanAuthState.objects.filter(key=cls.AUTH_KEY).first()
        if state:
            state.last_error = str(message)[:255]
            state.status = 'API_ERROR'
            state.save(update_fields=['last_error', 'status', 'updated_at'])

    @classmethod
    def get_auth_status(cls):
        state = cls._state()
        token = cls._decrypt(state)
        manual = getattr(settings, 'DHAN_ACCESS_TOKEN', '')
        valid = cls.is_token_valid(token, state.expires_at) or cls.is_token_valid(manual)
        return {
            'connected': valid and not cls.is_demo_mode(),
            'mode': 'demo' if cls.is_demo_mode() else 'live',
            'authenticated': valid and not cls.is_demo_mode(),
            'token_valid': valid and not cls.is_demo_mode(),
            'expires_at': state.expires_at.isoformat() if state.expires_at else None,
            'last_refresh': state.last_success_at.isoformat() if state.last_success_at else None,
            'last_sync': state.last_sync_at.isoformat() if state.last_sync_at else None,
            'error': state.last_error or None,
        }