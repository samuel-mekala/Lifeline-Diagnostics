from rest_framework import serializers
from .models import TestCategory, TestItem

class TestCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = TestCategory
        fields = '__all__'

class TestItemSerializer(serializers.ModelSerializer):
    category_name = serializers.ReadOnlyField(source='category.name')

    class Meta:
        model = TestItem
        fields = '__all__'
