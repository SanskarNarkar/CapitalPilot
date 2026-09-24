from rest_framework import views, permissions
from rest_framework.response import Response
from .services import AICoachService

class AICoachInsightsView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        insights = AICoachService.analyze_user_performance(request.user)
        return Response(insights)

class AICoachReviewsView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        reviews = AICoachService.get_periodic_reviews(request.user)
        return Response(reviews)
