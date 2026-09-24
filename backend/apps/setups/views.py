from rest_framework import viewsets, permissions
from django.db.models import Q
from .models import Setup
from .serializers import SetupSerializer

class SetupViewSet(viewsets.ModelViewSet):
    serializer_class = SetupSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Return global default setups (user is null) and user's custom setups
        return Setup.objects.filter(Q(user=user) | Q(user__isnull=True)).order_by('name')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
