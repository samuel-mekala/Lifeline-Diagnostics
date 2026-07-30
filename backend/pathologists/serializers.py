from rest_framework import serializers
from .models import PathologistReview, CriticalAlert

class PathologistReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = PathologistReview
        fields = '__all__'

class CriticalAlertSerializer(serializers.ModelSerializer):
    class Meta:
        model = CriticalAlert
        fields = '__all__'
