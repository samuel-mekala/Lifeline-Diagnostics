from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SystemConfigurationViewSet, AccessControlPolicyViewSet

router = DefaultRouter()
router.register(r'configs', SystemConfigurationViewSet, basename='sys-config')
router.register(r'permissions', AccessControlPolicyViewSet, basename='permission')

urlpatterns = [
    path('', include(router.urls)),
]
