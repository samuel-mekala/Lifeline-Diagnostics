from rest_framework import serializers
from .models import PatientFamilyMember, HealthTrendRecord

class PatientFamilyMemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = PatientFamilyMember
        fields = '__all__'

class HealthTrendRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = HealthTrendRecord
        fields = '__all__'
