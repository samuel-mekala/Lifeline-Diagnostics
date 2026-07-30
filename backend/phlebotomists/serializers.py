from rest_framework import serializers
from .models import CollectionTask

class CollectionTaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = CollectionTask
        fields = '__all__'
