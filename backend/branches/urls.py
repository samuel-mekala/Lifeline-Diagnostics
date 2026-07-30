from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BranchViewSet, LabEquipmentViewSet

router = DefaultRouter()
router.register(r'centers', BranchViewSet, basename='branch')
router.register(r'equipment', LabEquipmentViewSet, basename='equipment')

urlpatterns = [
    path('', include(router.urls)),
]
