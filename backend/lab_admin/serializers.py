from rest_framework import serializers
from .models import SystemConfiguration, AccessControlPolicy

class SystemConfigurationSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemConfiguration
        fields = '__all__'

class AccessControlPolicySerializer(serializers.ModelSerializer):
    class Meta:
        model = AccessControlPolicy
        fields = '__all__'
