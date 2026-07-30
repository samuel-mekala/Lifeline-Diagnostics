from rest_framework import serializers

class TopItemSerializer(serializers.Serializer):
    item_id = serializers.CharField(); item_name = serializers.CharField(); count = serializers.IntegerField(); revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
class ProductivitySerializer(serializers.Serializer):
    collected_by__full_name = serializers.CharField(); samples_collected = serializers.IntegerField()
class AnalyticsOverviewSerializer(serializers.Serializer):
    total_revenue = serializers.DecimalField(max_digits=12, decimal_places=2); daily_revenue = serializers.DecimalField(max_digits=12, decimal_places=2); monthly_revenue = serializers.DecimalField(max_digits=12, decimal_places=2); yearly_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_patients = serializers.IntegerField(); new_patients = serializers.IntegerField(); total_appointments = serializers.IntegerField(); pending_appointments = serializers.IntegerField(); samples = serializers.IntegerField(); reports = serializers.IntegerField()
    top_tests = TopItemSerializer(many=True); top_packages = TopItemSerializer(many=True); employee_productivity = ProductivitySerializer(many=True)
