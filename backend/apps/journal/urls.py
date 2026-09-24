from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DailyTradingPlanViewSet

router = DefaultRouter()
router.register(r'', DailyTradingPlanViewSet, basename='journal-plan')

urlpatterns = [
    path('', include(router.urls)),
]
