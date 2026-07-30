from rest_framework import viewsets
from .models import PathologistReview, CriticalAlert
from .serializers import PathologistReviewSerializer, CriticalAlertSerializer

class PathologistReviewViewSet(viewsets.ModelViewSet):
    queryset = PathologistReview.objects.all().order_by('-reviewed_at')
    serializer_class = PathologistReviewSerializer

class CriticalAlertViewSet(viewsets.ModelViewSet):
    queryset = CriticalAlert.objects.all().order_by('-notified_at')
    serializer_class = CriticalAlertSerializer
