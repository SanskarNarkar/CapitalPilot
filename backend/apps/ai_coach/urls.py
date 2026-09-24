from django.urls import path
from .views import AICoachInsightsView, AICoachReviewsView

urlpatterns = [
    path('insights/', AICoachInsightsView.as_view(), name='ai-coach-insights'),
    path('reviews/', AICoachReviewsView.as_view(), name='ai-coach-reviews'),
]
