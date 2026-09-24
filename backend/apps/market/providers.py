import abc
import requests
from django.conf import settings

class MarketAPIError(Exception):
    """Raised when the live market feed cannot be read."""

class MarketDataProvider(abc.ABC):
    @abc.abstractmethod
    def get_market_overview(self) -> dict:
        pass

class DhanMarketProvider(MarketDataProvider):
    def __init__(self, client_id, access_token):
        self.client_id = client_id
        self.access_token = access_token

    def get_market_overview(self) -> dict:
        # Calls DhanHQ market feed endpoint if keys are configured
        try:
            url = "https://api.dhan.co/v2/marketfeed/quote"
            headers = {
                'access-token': self.access_token,
                'client-id': self.client_id,
                'Content-Type': 'application/json'
            }
            res = requests.get(url, headers=headers, timeout=5)
            if res.status_code == 200:
                data = res.json()
                data['is_demo'] = False
                data['mode'] = 'LIVE'
                return data
        except requests.RequestException as exc:
            raise MarketAPIError(f"Dhan market feed request failed: {exc}") from exc

        raise MarketAPIError(f"Dhan market feed returned HTTP {res.status_code}")

class ExternalMarketProvider(MarketDataProvider):
    def get_market_overview(self) -> dict:
        # Fallback to public quote APIs or DemoMarketProvider
        return DemoMarketProvider().get_market_overview()

class DemoMarketProvider(MarketDataProvider):
    """Realistic Indian Market Context with explicit DEMO DATA labeling."""

    def get_market_overview(self) -> dict:
        return {
            'is_demo': True,
            'mode': 'DEMO DATA',
            'indices': [
                {
                    'symbol': 'NIFTY 50',
                    'ltp': 24652.80,
                    'change': 135.40,
                    'change_pct': 0.55,
                    'high': 24680.10,
                    'low': 24510.30,
                    'sentiment': 'BULLISH',
                    'trend': 'Higher Highs'
                },
                {
                    'symbol': 'BANKNIFTY',
                    'ltp': 52480.20,
                    'change': -92.50,
                    'change_pct': -0.18,
                    'high': 52710.00,
                    'low': 52310.00,
                    'sentiment': 'NEUTRAL',
                    'trend': 'Rangebound'
                },
                {
                    'symbol': 'SENSEX',
                    'ltp': 80945.30,
                    'change': 380.25,
                    'change_pct': 0.47,
                    'high': 81050.00,
                    'low': 80550.00,
                    'sentiment': 'BULLISH',
                    'trend': 'Consolidation'
                },
                {
                    'symbol': 'INDIA VIX',
                    'ltp': 12.65,
                    'change': -0.42,
                    'change_pct': -3.21,
                    'high': 13.20,
                    'low': 12.45,
                    'sentiment': 'LOW_VOLATILITY',
                    'trend': 'Declining'
                },
                {
                    'symbol': 'GIFT NIFTY',
                    'ltp': 24710.00,
                    'change': 58.00,
                    'change_pct': 0.24,
                    'high': 24735.00,
                    'low': 24640.00,
                    'sentiment': 'MILD_POSITIVE',
                    'trend': 'Premium +58 pts'
                },
                {
                    'symbol': 'USD/INR',
                    'ltp': 83.85,
                    'change': 0.04,
                    'change_pct': 0.05,
                    'high': 83.92,
                    'low': 83.78,
                    'sentiment': 'STABLE',
                    'trend': 'Rangebound'
                },
                {
                    'symbol': 'BRENT CRUDE ($)',
                    'ltp': 74.20,
                    'change': -0.85,
                    'change_pct': -1.13,
                    'high': 75.40,
                    'low': 73.80,
                    'sentiment': 'FAVORABLE_FOR_INDIA',
                    'trend': 'Downward Drift'
                }
            ],
            'global_markets': [
                {'name': 'US: Dow Jones', 'ltp': 41820.0, 'change_pct': 0.35, 'status': 'Positive'},
                {'name': 'US: S&P 500', 'ltp': 5710.5, 'change_pct': 0.42, 'status': 'Positive'},
                {'name': 'US: Nasdaq 100', 'ltp': 19950.0, 'change_pct': 0.61, 'status': 'Positive'},
                {'name': 'Japan: Nikkei 225', 'ltp': 38200.0, 'change_pct': 1.15, 'status': 'Bullish'},
            ],
            'fii_dii': {
                'date': 'Yesterday Close',
                'fii_cash_buy': 11420.50,
                'fii_cash_sell': 10890.20,
                'fii_net': 530.30,
                'dii_cash_buy': 9820.00,
                'dii_cash_sell': 8120.00,
                'dii_net': 1700.00,
                'fii_index_futures_oi_ratio': '48% Long / 52% Short',
                'summary': 'Net Institutional Inflow: +₹2,230.30 Cr (Supportive for Dip Buying)'
            }
        }

def get_market_provider() -> MarketDataProvider:
    client_id = getattr(settings, 'DHAN_CLIENT_ID', '')
    access_token = getattr(settings, 'DHAN_ACCESS_TOKEN', '')
    demo_mode = getattr(settings, 'DEMO_MODE', True)

    if not demo_mode and client_id and access_token:
        return DhanMarketProvider(client_id, access_token)
    return DemoMarketProvider()
