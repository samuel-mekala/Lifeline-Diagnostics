from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PathologistReviewViewSet, CriticalAlertViewSet

router = DefaultRouter()
router.register(r'reviews', PathologistReviewViewSet, basename='pathologist-review')
router.register(r'alerts', CriticalAlertViewSet, basename='critical-alert')

urlpatterns = [
    path('', include(router.urls)),
]
