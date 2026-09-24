from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    GlobalRiskSettingsView, 
    IndexRiskProfileViewSet, 
    InstrumentLotSizeViewSet,
    CalculatePositionSizeView,
    ValidateFirewallView
)

router = DefaultRouter()
router.register(r'profiles', IndexRiskProfileViewSet, basename='index-risk-profiles')
router.register(r'lots', InstrumentLotSizeViewSet, basename='instrument-lots')

urlpatterns = [
    path('settings/', GlobalRiskSettingsView.as_view(), name='global-risk-settings'),
    path('calculate-size/', CalculatePositionSizeView.as_view(), name='calculate-position-size'),
    path('firewall/validate/', ValidateFirewallView.as_view(), name='firewall-validate'),
    path('', include(router.urls)),
]
