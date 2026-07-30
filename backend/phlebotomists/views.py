from rest_framework import viewsets
from .models import CollectionTask
from .serializers import CollectionTaskSerializer

class CollectionTaskViewSet(viewsets.ModelViewSet):
    queryset = CollectionTask.objects.all().order_by('-created_at')
    serializer_class = CollectionTaskSerializer
