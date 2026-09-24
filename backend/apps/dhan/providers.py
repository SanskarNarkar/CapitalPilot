import abc
import logging
import requests
from decimal import Decimal
from datetime import datetime, date, timedelta
from django.conf import settings
from django.utils import timezone
from .auth_service import DhanAuthError, DhanAuthService

logger = logging.getLogger(__name__)

class DhanAPIError(Exception):
    """Raised when Dhan returns an unsuccessful API response."""

class DhanProviderBase(abc.ABC):
    """Abstract Base Class for DhanHQ API operations."""

    @abc.abstractmethod
    def get_orders(self) -> list:
        pass

    @abc.abstractmethod
    def get_trades(self) -> list:
        pass

    @abc.abstractmethod
    def get_positions(self) -> list:
        pass

    @abc.abstractmethod
    def get_holdings(self) -> list:
        pass

    @abc.abstractmethod
    def get_ledger(self) -> list:
        pass

    @abc.abstractmethod
    def get_fund_limits(self) -> dict:
        pass

    @abc.abstractmethod
    def get_option_chain(self, underlying: str = 'NIFTY') -> dict:
        pass

    @abc.abstractmethod
    def get_market_data(self) -> dict:
        pass

class LiveDhanProvider(DhanProviderBase):
    """Live DhanHQ OpenAPI v2 client implementation."""

    BASE_URL = "https://api.dhan.co/v2"

    def __init__(self, client_id=None, access_token=None):
        self.client_id = client_id or getattr(settings, 'DHAN_CLIENT_ID', '')
        self.access_token = access_token or getattr(settings, 'DHAN_ACCESS_TOKEN', '')

    def _request(self, method: str, endpoint: str, params=None, data=None):
        url = f"{self.BASE_URL}/{endpoint.lstrip('/')}"
        for attempt in range(2):
            try:
                token = DhanAuthService.get_valid_access_token(force_refresh=attempt == 1)
                headers = {
                    'access-token': token,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
                response = requests.request(method, url, headers=headers, params=params, json=data, timeout=10)
                if response.status_code in (400, 401):
                    try:
                        error_payload = response.json()
                    except ValueError:
                        error_payload = {}
                    invalid_token = error_payload.get('errorCode') in ('DH-906', 'DH-901')
                    if invalid_token and attempt == 0:
                        DhanAuthService.invalidate_cached_token()
                        logger.warning('Dhan API token rejected; refreshing once')
                        continue
                    if invalid_token:
                        raise DhanAPIError('Dhan access token was rejected after one refresh')
                if response.status_code == 401 and attempt == 0:
                    DhanAuthService.invalidate_cached_token()
                    logger.warning('Dhan API token rejected; refreshing once')
                    continue
                try:
                    response.raise_for_status()
                except requests.exceptions.HTTPError as exc:
                    try:
                        error_payload = response.json()
                    except ValueError:
                        error_payload = {}
                    message = error_payload.get('errorMessage') or f'HTTP {response.status_code}'
                    code = error_payload.get('errorCode')
                    detail = f'{code}: {message}' if code else message
                    raise DhanAPIError(f'Dhan API request failed for {endpoint}: {detail}') from exc
                payload = response.json()
                if isinstance(payload, dict) and (payload.get('errorCode') or payload.get('errorType')):
                    raise DhanAPIError(payload.get('errorMessage') or payload.get('errorCode') or 'Dhan API error')
                return payload
            except DhanAuthError as exc:
                raise DhanAPIError(str(exc)) from exc
            except requests.exceptions.RequestException as exc:
                raise DhanAPIError(f"Dhan API request failed for {endpoint}") from exc

        raise DhanAPIError(f"Dhan API authentication failed for {endpoint}")

    def get_orders(self) -> list:
        res = self._request('GET', '/orders')
        return res if isinstance(res, list) else res.get('data', [])

    def get_trades(self) -> list:
        res = self._request('GET', '/trades')
        return res if isinstance(res, list) else res.get('data', [])

    def get_positions(self) -> list:
        res = self._request('GET', '/positions')
        return res if isinstance(res, list) else res.get('data', [])

    def get_holdings(self) -> list:
        res = self._request('GET', '/holdings')
        return res if isinstance(res, list) else res.get('data', [])

    def get_ledger(self) -> list:
        res = self._request('GET', '/ledger')
        return res if isinstance(res, list) else res.get('data', [])

    def get_fund_limits(self) -> dict:
        res = self._request('GET', '/fundlimit')
        return res if isinstance(res, dict) else {}

    def get_option_chain(self, underlying: str = 'NIFTY') -> dict:
        return self._request('POST', '/optionchain', data={'Underlying': underlying})

    def get_market_data(self) -> dict:
        return self._request('GET', '/marketfeed/quote')

class DemoDhanProvider(DhanProviderBase):
    """Realistic Indian Options Demo Dhan Provider for testing and offline execution."""

    def __init__(self):
        self.is_demo = True

    def get_orders(self) -> list:
        today = timezone.now().date()
        return [
            {
                'orderId': 'DHAN-ORD-9011',
                'tradingSymbol': 'NIFTY 24600 CE',
                'securityId': '53210',
                'exchangeSegment': 'NSE_FNO',
                'transactionType': 'BUY',
                'orderType': 'MARKET',
                'quantity': 65,
                'price': 122.50,
                'orderStatus': 'TRADED',
                'createTime': f"{today} 09:30:15",
                'updateTime': f"{today} 09:30:16"
            },
            {
                'orderId': 'DHAN-ORD-9012',
                'tradingSymbol': 'NIFTY 24600 CE',
                'securityId': '53210',
                'exchangeSegment': 'NSE_FNO',
                'transactionType': 'SELL',
                'orderType': 'LIMIT',
                'quantity': 65,
                'price': 148.00,
                'orderStatus': 'TRADED',
                'createTime': f"{today} 09:48:22",
                'updateTime': f"{today} 09:48:22"
            },
            {
                'orderId': 'DHAN-ORD-9021',
                'tradingSymbol': 'BANKNIFTY 52500 PE',
                'securityId': '64192',
                'exchangeSegment': 'NSE_FNO',
                'transactionType': 'BUY',
                'orderType': 'LIMIT',
                'quantity': 30,
                'price': 210.00,
                'orderStatus': 'TRADED',
                'createTime': f"{today} 11:15:00",
                'updateTime': f"{today} 11:15:02"
            },
            {
                'orderId': 'DHAN-ORD-9022',
                'tradingSymbol': 'BANKNIFTY 52500 PE',
                'securityId': '64192',
                'exchangeSegment': 'NSE_FNO',
                'transactionType': 'SELL',
                'orderType': 'STOP_LOSS',
                'quantity': 30,
                'price': 195.00,
                'orderStatus': 'TRADED',
                'createTime': f"{today} 11:29:40",
                'updateTime': f"{today} 11:29:40"
            }
        ]

    def get_trades(self) -> list:
        today = timezone.now().date()
        return [
            {
                'tradeId': 'DHAN-TRD-101',
                'orderId': 'DHAN-ORD-9011',
                'tradingSymbol': 'NIFTY 24600 CE',
                'securityId': '53210',
                'exchangeSegment': 'NSE_FNO',
                'transactionType': 'BUY',
                'tradedQuantity': 65,
                'tradedPrice': 122.50,
                'tradeTime': f"{today} 09:30:16",
                'exchangeTradeId': 'EXCH-778811'
            },
            {
                'tradeId': 'DHAN-TRD-102',
                'orderId': 'DHAN-ORD-9012',
                'tradingSymbol': 'NIFTY 24600 CE',
                'securityId': '53210',
                'exchangeSegment': 'NSE_FNO',
                'transactionType': 'SELL',
                'tradedQuantity': 65,
                'tradedPrice': 148.00,
                'tradeTime': f"{today} 09:48:22",
                'exchangeTradeId': 'EXCH-778899'
            },
            {
                'tradeId': 'DHAN-TRD-103',
                'orderId': 'DHAN-ORD-9021',
                'tradingSymbol': 'BANKNIFTY 52500 PE',
                'securityId': '64192',
                'exchangeSegment': 'NSE_FNO',
                'transactionType': 'BUY',
                'tradedQuantity': 30,
                'tradedPrice': 210.00,
                'tradeTime': f"{today} 11:15:02",
                'exchangeTradeId': 'EXCH-882211'
            },
            {
                'tradeId': 'DHAN-TRD-104',
                'orderId': 'DHAN-ORD-9022',
                'tradingSymbol': 'BANKNIFTY 52500 PE',
                'securityId': '64192',
                'exchangeSegment': 'NSE_FNO',
                'transactionType': 'SELL',
                'tradedQuantity': 30,
                'tradedPrice': 195.00,
                'tradeTime': f"{today} 11:29:40",
                'exchangeTradeId': 'EXCH-882299'
            }
        ]

    def get_positions(self) -> list:
        return [
            {
                'tradingSymbol': 'NIFTY 24650 CE',
                'securityId': '53215',
                'positionType': 'CLOSED',
                'buyQty': 25,
                'buyAvg': 120.00,
                'sellQty': 25,
                'sellAvg': 145.00,
                'netQty': 0,
                'realizedProfit': 625.00,
                'unrealizedProfit': 0.00
            }
        ]

    def get_holdings(self) -> list:
        return []

    def get_ledger(self) -> list:
        today = timezone.now().date()
        return [
            {'date': str(today), 'particulars': 'Opening Balance', 'debit': 0.0, 'credit': 15000.0, 'balance': 15000.0},
            {'date': str(today), 'particulars': 'Options Realized P&L', 'debit': 0.0, 'credit': 412.50, 'balance': 15412.50},
        ]

    def get_fund_limits(self) -> dict:
        return {
            'availabelBalance': 15412.50,
            'withdrawableBalance': 15412.50,
            'utilizedAmount': 0.0,
        }

    def get_option_chain(self, underlying: str = 'NIFTY') -> dict:
        return {
            'underlying': underlying,
            'spot': 24620.50 if underlying == 'NIFTY' else 52450.00,
            'strikes': [
                {'strike': 24500, 'callLtp': 175.5, 'putLtp': 45.2, 'callOi': 154000, 'putOi': 298000},
                {'strike': 24550, 'callLtp': 142.0, 'putLtp': 62.0, 'callOi': 189000, 'putOi': 210000},
                {'strike': 24600, 'callLtp': 112.5, 'putLtp': 85.0, 'callOi': 345000, 'putOi': 310000},
                {'strike': 24650, 'callLtp': 86.0, 'putLtp': 114.5, 'callOi': 420000, 'putOi': 175000},
                {'strike': 24700, 'callLtp': 64.2, 'putLtp': 150.0, 'callOi': 510000, 'putOi': 120000},
            ]
        }

    def get_market_data(self) -> dict:
        return {
            'mode': 'DEMO',
            'NIFTY': {'ltp': 24620.50, 'change': 112.35, 'change_pct': 0.46},
            'BANKNIFTY': {'ltp': 52450.00, 'change': -145.20, 'change_pct': -0.28},
            'SENSEX': {'ltp': 80920.00, 'change': 320.10, 'change_pct': 0.40},
            'INDIA_VIX': {'ltp': 12.85, 'change': -0.45, 'change_pct': -3.38}
        }

def get_dhan_provider() -> DhanProviderBase:
    """Factory to instantiate the appropriate provider according to settings and credentials."""
    client_id = getattr(settings, 'DHAN_CLIENT_ID', '')
    access_token = getattr(settings, 'DHAN_ACCESS_TOKEN', '')
    demo_mode = getattr(settings, 'DHAN_DEMO_MODE', getattr(settings, 'DEMO_MODE', True))

    if not demo_mode:
        return LiveDhanProvider(client_id=client_id, access_token=access_token)
    return DemoDhanProvider()
