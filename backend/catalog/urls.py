from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TestCategoryViewSet, TestItemViewSet

router = DefaultRouter()
router.register(r'categories', TestCategoryViewSet, basename='category')
router.register(r'tests', TestItemViewSet, basename='test-item')

urlpatterns = [
    path('', include(router.urls)),
]
