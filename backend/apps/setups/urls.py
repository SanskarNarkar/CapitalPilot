from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SetupViewSet

router = DefaultRouter()
router.register(r'', SetupViewSet, basename='setup')

urlpatterns = [
    path('', include(router.urls)),
]
