import abc
from datetime import datetime, timedelta
from django.utils import timezone

class NewsProvider(abc.ABC):
    @abc.abstractmethod
    def get_news(self, category=None) -> list:
        pass

class DemoNewsProvider(NewsProvider):
    def get_news(self, category=None) -> list:
        now = timezone.now()
        articles = [
            {
                'id': 1,
                'headline': 'RBI Monetary Policy Committee Keeps Repo Rate Unchanged at 6.50%, Stance Neutral',
                'source': 'Economic Times',
                'published_at': (now - timedelta(minutes=45)).strftime('%Y-%m-%d %H:%M'),
                'category': 'RBI',
                'url': 'https://economictimes.indiatimes.com/markets',
                'impact': 'HIGH',
                'summary': 'The RBI MPC decided unanimously to keep benchmark repo rates steady, highlighting resilient domestic growth while monitoring food inflation pressures.'
            },
            {
                'id': 2,
                'headline': 'SEBI Introduces New Framework for Index Derivatives and Weekly Options Expiry Cadence',
                'source': 'Moneycontrol',
                'published_at': (now - timedelta(hours=2)).strftime('%Y-%m-%d %H:%M'),
                'category': 'SEBI',
                'url': 'https://www.moneycontrol.com',
                'impact': 'HIGH',
                'summary': 'SEBI issues circular regarding rationalization of contract specifications, margin requirements, and weekly option expiries per exchange.'
            },
            {
                'id': 3,
                'headline': 'NIFTY Crosses Key Moving Average As Private Banks and IT Stocks Rebound',
                'source': 'Livemint',
                'published_at': (now - timedelta(hours=3, minutes=15)).strftime('%Y-%m-%d %H:%M'),
                'category': 'NIFTY',
                'url': 'https://www.livemint.com/market',
                'impact': 'MEDIUM',
                'summary': 'Benchmark index demonstrates strong support near previous day low, fueled by HDFC Bank and Reliance Industries buyer interest.'
            },
            {
                'id': 4,
                'headline': 'US Federal Reserve Chair Powell Signals Measured Pace on Future Rate Adjustments',
                'source': 'Bloomberg',
                'published_at': (now - timedelta(hours=5)).strftime('%Y-%m-%d %H:%M'),
                'category': 'Federal Reserve',
                'url': 'https://www.bloomberg.com',
                'impact': 'HIGH',
                'summary': 'Fed Chair remarks reiterate that incoming labor and inflation data will determine the magnitude of upcoming policy moves.'
            },
            {
                'id': 5,
                'headline': 'India August CPI Inflation Eases to 3.65%, Stays Below RBI 4% Medium-Term Target',
                'source': 'Business Standard',
                'published_at': (now - timedelta(hours=7)).strftime('%Y-%m-%d %H:%M'),
                'category': 'Inflation',
                'url': 'https://www.business-standard.com',
                'impact': 'MEDIUM',
                'summary': 'Retail inflation remained within the central bank tolerance band, supported by declining vegetable and fuel price pressures.'
            },
            {
                'id': 6,
                'headline': 'BANKNIFTY Holds 52,200 Support Ahead of Major PSU Bank Quarterly Results',
                'source': 'CNBC-TV18',
                'published_at': (now - timedelta(hours=8)).strftime('%Y-%m-%d %H:%M'),
                'category': 'BANKNIFTY',
                'url': 'https://www.cnbctv18.com',
                'impact': 'MEDIUM',
                'summary': 'Banking index consolidates in a 400-point corridor with heavy open interest concentration at 52,500 Call and 52,000 Put.'
            },
            {
                'id': 7,
                'headline': 'Brent Crude Drops Toward $74 as Global Supply Expectations Outweigh Middle East Tensions',
                'source': 'Reuters',
                'published_at': (now - timedelta(hours=10)).strftime('%Y-%m-%d %H:%M'),
                'category': 'Major economic events',
                'url': 'https://www.reuters.com',
                'impact': 'LOW',
                'summary': 'Lower crude prices continue to provide macroeconomic relief for Indian oil importers and the current account balance.'
            },
            {
                'id': 8,
                'headline': 'SENSEX Up 380 Points Led by Automobile and FMCG Gains',
                'source': 'Financial Express',
                'published_at': (now - timedelta(hours=12)).strftime('%Y-%m-%d %H:%M'),
                'category': 'SENSEX',
                'url': 'https://www.financialexpress.com',
                'impact': 'LOW',
                'summary': 'Broad-based participation in BSE Sensex components with healthy advance-decline market breadth.'
            }
        ]

        if category and category != 'ALL':
            articles = [a for a in articles if a['category'].lower() == category.lower()]
        return articles

def get_news_provider() -> NewsProvider:
    return DemoNewsProvider()
