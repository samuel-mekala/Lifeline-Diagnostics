from rest_framework import viewsets
from .models import TokenQueueItem, DailyCashDrawer
from .serializers import TokenQueueItemSerializer, DailyCashDrawerSerializer

class TokenQueueItemViewSet(viewsets.ModelViewSet):
    queryset = TokenQueueItem.objects.all().order_by('token_number')
    serializer_class = TokenQueueItemSerializer

class DailyCashDrawerViewSet(viewsets.ModelViewSet):
    queryset = DailyCashDrawer.objects.all().order_by('-date')
    serializer_class = DailyCashDrawerSerializer
