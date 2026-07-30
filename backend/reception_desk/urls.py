from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TokenQueueItemViewSet, DailyCashDrawerViewSet

router = DefaultRouter()
router.register(r'tokens', TokenQueueItemViewSet, basename='token-queue')
router.register(r'cash-drawers', DailyCashDrawerViewSet, basename='cash-drawer')

urlpatterns = [
    path('', include(router.urls)),
]
