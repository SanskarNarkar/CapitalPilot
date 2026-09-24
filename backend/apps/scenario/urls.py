from django.urls import path
from .views import ScenarioCalculatorView, MonteCarloSimulatorView

urlpatterns = [
    path('calculate/', ScenarioCalculatorView.as_view(), name='scenario-calculate'),
    path('monte-carlo/', MonteCarloSimulatorView.as_view(), name='scenario-monte-carlo'),
]
