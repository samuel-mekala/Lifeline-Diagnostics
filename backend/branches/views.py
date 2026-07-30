from rest_framework import viewsets
from .models import Branch, LabEquipment
from .serializers import BranchSerializer, LabEquipmentSerializer

class BranchViewSet(viewsets.ModelViewSet):
    queryset = Branch.objects.all().order_by('-created_at')
    serializer_class = BranchSerializer

class LabEquipmentViewSet(viewsets.ModelViewSet):
    queryset = LabEquipment.objects.all()
    serializer_class = LabEquipmentSerializer
