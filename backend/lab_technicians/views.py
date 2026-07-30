from rest_framework import viewsets
from .models import WorklistBatch, QualityControlRun
from .serializers import WorklistBatchSerializer, QualityControlRunSerializer

class WorklistBatchViewSet(viewsets.ModelViewSet):
    queryset = WorklistBatch.objects.all().order_by('-created_at')
    serializer_class = WorklistBatchSerializer

class QualityControlRunViewSet(viewsets.ModelViewSet):
    queryset = QualityControlRun.objects.all().order_by('-performed_at')
    serializer_class = QualityControlRunSerializer
