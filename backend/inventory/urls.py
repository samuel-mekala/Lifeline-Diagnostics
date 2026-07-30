from django.urls import path
from inventory.views import InventoryDashboardAPIView, InventoryDetailAPIView, InventoryListAPIView, InventoryUsageAPIView

urlpatterns = [path("", InventoryListAPIView.as_view()), path("dashboard/", InventoryDashboardAPIView.as_view()), path("<int:item_id>/", InventoryDetailAPIView.as_view()), path("<int:item_id>/usage/", InventoryUsageAPIView.as_view())]
