from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CollectionTaskViewSet

router = DefaultRouter()
router.register(r'tasks', CollectionTaskViewSet, basename='phlebotomist-task')

urlpatterns = [
    path('', include(router.urls)),
]
