from rest_framework import serializers
from .models import Branch, LabEquipment

class BranchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Branch
        fields = '__all__'

class LabEquipmentSerializer(serializers.ModelSerializer):
    branch_name = serializers.ReadOnlyField(source='branch.name')

    class Meta:
        model = LabEquipment
        fields = '__all__'
