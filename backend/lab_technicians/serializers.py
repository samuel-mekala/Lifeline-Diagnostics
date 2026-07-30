from rest_framework import serializers
from .models import WorklistBatch, QualityControlRun

class WorklistBatchSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorklistBatch
        fields = '__all__'

class QualityControlRunSerializer(serializers.ModelSerializer):
    class Meta:
        model = QualityControlRun
        fields = '__all__'
