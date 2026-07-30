from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PatientFamilyMemberViewSet, HealthTrendRecordViewSet

router = DefaultRouter()
router.register(r'family-members', PatientFamilyMemberViewSet, basename='family-member')
router.register(r'trends', HealthTrendRecordViewSet, basename='health-trend')

urlpatterns = [
    path('', include(router.urls)),
]
