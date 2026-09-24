from rest_framework import views, generics, permissions, status
from rest_framework.response import Response
from .models import ChallengeConfig, DailySnapshot
from .serializers import ChallengeConfigSerializer, DailySnapshotSerializer
from .services import ChallengeService

class ChallengeSummaryView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        summary = ChallengeService.get_summary(request.user)
        return Response(summary)

class ChallengeCurveView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        curve = ChallengeService.get_curve(request.user)
        return Response(curve)

class ChallengeConfigView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        challenge = ChallengeService.get_or_create_default_challenge(request.user)
        return Response(ChallengeConfigSerializer(challenge).data)

    def post(self, request):
        challenge = ChallengeConfig.objects.filter(user=request.user, is_active=True).first()
        if challenge:
            serializer = ChallengeConfigSerializer(challenge, data=request.data, partial=True)
        else:
            serializer = ChallengeConfigSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        saved = serializer.save(user=request.user)
        return Response(ChallengeConfigSerializer(saved).data)

class DailySnapshotListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = DailySnapshotSerializer

    def get_queryset(self):
        return DailySnapshot.objects.filter(user=self.request.user).order_by('date')
