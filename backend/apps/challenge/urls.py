from django.urls import path
from .views import ChallengeSummaryView, ChallengeCurveView, ChallengeConfigView, DailySnapshotListView

urlpatterns = [
    path('current/', ChallengeSummaryView.as_view(), name='challenge-summary'),
    path('curve/', ChallengeCurveView.as_view(), name='challenge-curve'),
    path('config/', ChallengeConfigView.as_view(), name='challenge-config'),
    path('snapshots/', DailySnapshotListView.as_view(), name='challenge-snapshots'),
]
