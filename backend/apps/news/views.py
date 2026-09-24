from rest_framework import views, permissions
from rest_framework.response import Response
from .providers import get_news_provider

class NewsListView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        category = request.query_params.get('category')
        provider = get_news_provider()
        news = provider.get_news(category=category)
        return Response(news)
