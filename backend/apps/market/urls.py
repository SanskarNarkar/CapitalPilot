from django.urls import path
from .views import MarketOverviewView

urlpatterns = [
    path('overview/', MarketOverviewView.as_view(), name='market-overview'),
]
