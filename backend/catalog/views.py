from rest_framework import viewsets
from .models import TestCategory, TestItem
from .serializers import TestCategorySerializer, TestItemSerializer

class TestCategoryViewSet(viewsets.ModelViewSet):
    queryset = TestCategory.objects.all()
    serializer_class = TestCategorySerializer

class TestItemViewSet(viewsets.ModelViewSet):
    queryset = TestItem.objects.all()
    serializer_class = TestItemSerializer
