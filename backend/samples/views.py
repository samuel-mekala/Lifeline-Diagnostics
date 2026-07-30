from rest_framework import viewsets
from .models import Sample
from .serializers import SampleSerializer

class SampleViewSet(viewsets.ModelViewSet):
    queryset = Sample.objects.all().order_by('-collected_at')
    serializer_class = SampleSerializer
