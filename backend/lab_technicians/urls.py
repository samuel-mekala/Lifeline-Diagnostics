from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import WorklistBatchViewSet, QualityControlRunViewSet

router = DefaultRouter()
router.register(r'batches', WorklistBatchViewSet, basename='worklist-batch')
router.register(r'qc-runs', QualityControlRunViewSet, basename='qc-run')

urlpatterns = [
    path('', include(router.urls)),
]
