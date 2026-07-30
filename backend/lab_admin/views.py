from rest_framework import viewsets
from .models import SystemConfiguration, AccessControlPolicy
from .serializers import SystemConfigurationSerializer, AccessControlPolicySerializer

class SystemConfigurationViewSet(viewsets.ModelViewSet):
    queryset = SystemConfiguration.objects.all()
    serializer_class = SystemConfigurationSerializer

class AccessControlPolicyViewSet(viewsets.ModelViewSet):
    queryset = AccessControlPolicy.objects.all()
    serializer_class = AccessControlPolicySerializer
