from django.contrib import admin
from django.conf import settings
from django.http import Http404
from django.shortcuts import render
from django.urls import path, include, re_path
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    return Response({
        'status': 'healthy',
        'application': 'CapitalPilot',
        'tagline': 'Personal Trading Operating System',
        'version': '1.0.0'
    })


def frontend(request):
    if not (settings.FRONTEND_DIST / 'index.html').exists():
        raise Http404
    return render(request, 'index.html')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health/', health_check, name='health-check'),
    path('api/auth/', include('apps.accounts.urls')),
    path('api/challenge/', include('apps.challenge.urls')),
    path('api/trades/', include('apps.trades.urls')),
    path('api/risk/', include('apps.risk.urls')),
    path('api/setups/', include('apps.setups.urls')),
    path('api/journal/', include('apps.journal.urls')),
    path('api/dhan/', include('apps.dhan.urls')),
    path('api/market/', include('apps.market.urls')),
    path('api/news/', include('apps.news.urls')),
    path('api/analytics/', include('apps.analytics.urls')),
    path('api/scenario/', include('apps.scenario.urls')),
    path('api/coach/', include('apps.ai_coach.urls')),
    path('api/notifications/', include('apps.notifications.urls')),
    re_path(r'^(?!api/|admin/|static/).*$', frontend, name='frontend'),
]
