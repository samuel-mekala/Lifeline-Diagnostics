from rest_framework import serializers
from .models import TokenQueueItem, DailyCashDrawer

class TokenQueueItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = TokenQueueItem
        fields = '__all__'

class DailyCashDrawerSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyCashDrawer
        fields = '__all__'
