from rest_framework import viewsets
from .models import PatientFamilyMember, HealthTrendRecord
from .serializers import PatientFamilyMemberSerializer, HealthTrendRecordSerializer

class PatientFamilyMemberViewSet(viewsets.ModelViewSet):
    queryset = PatientFamilyMember.objects.all()
    serializer_class = PatientFamilyMemberSerializer

class HealthTrendRecordViewSet(viewsets.ModelViewSet):
    queryset = HealthTrendRecord.objects.all().order_by('-recorded_date')
    serializer_class = HealthTrendRecordSerializer
