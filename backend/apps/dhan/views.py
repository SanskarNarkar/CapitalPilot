from rest_framework import views, permissions, status
from rest_framework.response import Response
from .services import DhanSyncService
from .providers import DhanAPIError, get_dhan_provider
from .auth_service import DhanAuthError, DhanAuthService
from apps.notifications.models import Notification

class DhanSyncView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            result = DhanSyncService.sync_user_trades(request.user)
        except DhanAPIError as exc:
            return Response({'status': 'ERROR', 'detail': str(exc)}, status=502)
        
        # Create notification
        Notification.objects.create(
            user=request.user,
            title="Dhan Synchronization Completed",
            message=f"Synced {result['synced_count']} new trade(s). {result['skipped_duplicates']} duplicates skipped ({result['mode']} MODE).",
            notification_type='SYNC'
        )

        return Response(result, status=status.HTTP_200_OK)

class DhanReconcileView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            result = DhanSyncService.reconcile(request.user)
        except DhanAPIError as exc:
            return Response({'status': 'ERROR', 'detail': str(exc)}, status=502)
        return Response(result, status=status.HTTP_200_OK)

class DhanStatusView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        provider = get_dhan_provider()
        is_demo = getattr(provider, 'is_demo', False)
        return Response({
            'mode': 'DEMO' if is_demo else 'LIVE',
            'is_configured': not is_demo,
            'client_id_configured': bool(getattr(provider, 'client_id', None)),
            'message': 'Running in DEMO MODE with simulated DhanHQ data' if is_demo else 'Connected to live DhanHQ API'
        })

class DhanAuthStatusView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            if not DhanAuthService.is_demo_mode():
                DhanAuthService.get_valid_access_token()
            return Response(DhanAuthService.get_auth_status())
        except DhanAuthError as exc:
            status_data = DhanAuthService.get_auth_status()
            status_data['error'] = str(exc)[:255]
            return Response(status_data, status=status.HTTP_200_OK)

class DhanOptionChainView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        underlying = request.query_params.get('underlying', 'NIFTY')
        provider = get_dhan_provider()
        try:
            data = provider.get_option_chain(underlying=underlying)
        except DhanAPIError as exc:
            return Response({'status': 'ERROR', 'detail': str(exc)}, status=502)
        return Response(data)

class DhanPositionsView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        provider = get_dhan_provider()
        try:
            data = provider.get_positions()
        except DhanAPIError as exc:
            return Response({'status': 'ERROR', 'detail': str(exc)}, status=502)
        return Response(data)
