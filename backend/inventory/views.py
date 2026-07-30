from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import InventoryPermission
from inventory.models import InventoryItem
from inventory.serializers import InventoryItemSerializer, StockUsageCreateSerializer, StockUsageSerializer
from inventory.services import InventoryService


class InventoryListAPIView(APIView):
    permission_classes = [InventoryPermission]
    def get(self, request): return Response(InventoryItemSerializer(InventoryService.list_items(), many=True).data)
    def post(self, request):
        serializer = InventoryItemSerializer(data=request.data); serializer.is_valid(raise_exception=True)
        item = InventoryService.create_item(actor=request.user, **serializer.validated_data)
        return Response(InventoryItemSerializer(item).data, status=status.HTTP_201_CREATED)


class InventoryDetailAPIView(APIView):
    permission_classes = [InventoryPermission]
    def patch(self, request, item_id):
        try:
            item = InventoryService.get_item(item_id=item_id)
        except InventoryItem.DoesNotExist:
            return Response({"error": "Inventory item not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = InventoryItemSerializer(item, data=request.data, partial=True); serializer.is_valid(raise_exception=True)
        item = InventoryService.update_item(item_id=item_id, actor=request.user, **serializer.validated_data)
        return Response(InventoryItemSerializer(item).data)
    def delete(self, request, item_id):
        try:
            InventoryService.delete_item(item_id=item_id, actor=request.user)
        except InventoryItem.DoesNotExist:
            return Response({"error": "Inventory item not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)


class InventoryUsageAPIView(APIView):
    permission_classes = [InventoryPermission]
    def post(self, request, item_id):
        serializer = StockUsageCreateSerializer(data=request.data); serializer.is_valid(raise_exception=True)
        try: usage = InventoryService.record_usage(item_id=item_id, user=request.user, **serializer.validated_data)
        except InventoryItem.DoesNotExist:
            return Response({"error": "Inventory item not found."}, status=status.HTTP_404_NOT_FOUND)
        except ValueError as exc: return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(StockUsageSerializer(usage).data, status=status.HTTP_201_CREATED)


class InventoryDashboardAPIView(APIView):
    permission_classes = [InventoryPermission]
    def get(self, request): return Response(InventoryService.dashboard())
