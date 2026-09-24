from django.urls import path
from .views import DhanSyncView, DhanReconcileView, DhanAuthStatusView, DhanStatusView, DhanOptionChainView, DhanPositionsView

urlpatterns = [
    path('sync/', DhanSyncView.as_view(), name='dhan-sync'),
    path('reconcile/', DhanReconcileView.as_view(), name='dhan-reconcile'),
    path('status/', DhanStatusView.as_view(), name='dhan-status'),
    path('auth/status/', DhanAuthStatusView.as_view(), name='dhan-auth-status'),
    path('optionchain/', DhanOptionChainView.as_view(), name='dhan-optionchain'),
    path('positions/', DhanPositionsView.as_view(), name='dhan-positions'),
]
