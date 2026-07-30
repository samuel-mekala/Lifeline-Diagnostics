from rest_framework import serializers


class ResultStatusCountsSerializer(serializers.Serializer):
    draft = serializers.IntegerField()
    submitted = serializers.IntegerField()
    approved = serializers.IntegerField()
    rejected = serializers.IntegerField()


class InvoiceCountsSerializer(serializers.Serializer):
    total = serializers.IntegerField()
    pending = serializers.IntegerField()
    paid = serializers.IntegerField()


class DashboardSummarySerializer(serializers.Serializer):
    total_patients = serializers.IntegerField()
    today_patients = serializers.IntegerField()
    total_visits = serializers.IntegerField()
    today_visits = serializers.IntegerField()
    results = ResultStatusCountsSerializer()
    invoices = InvoiceCountsSerializer()
    today_revenue = serializers.DecimalField(max_digits=10, decimal_places=2)


class RecentItemSerializer(serializers.Serializer):
    type = serializers.ChoiceField(choices=("patient", "report", "invoice"))
    identifier = serializers.CharField()
    title = serializers.CharField()
    status = serializers.CharField(allow_null=True)
    timestamp = serializers.DateTimeField()


class PendingResultSerializer(serializers.Serializer):
    result_id = serializers.CharField()
    patient_name = serializers.CharField()
    test_name = serializers.CharField()
    status = serializers.CharField()
    created_at = serializers.DateTimeField()


class PendingInvoiceSerializer(serializers.Serializer):
    invoice_id = serializers.CharField()
    patient_name = serializers.CharField()
    status = serializers.CharField()
    balance_due = serializers.DecimalField(max_digits=10, decimal_places=2)
    created_at = serializers.DateTimeField()


class DashboardPendingSerializer(serializers.Serializer):
    draft_results = PendingResultSerializer(many=True)
    submitted_results = PendingResultSerializer(many=True)
    pending_invoices = PendingInvoiceSerializer(many=True)


class DashboardStatisticsSerializer(serializers.Serializer):
    patients_this_month = serializers.IntegerField()
    visits_this_month = serializers.IntegerField()
    reports_generated_this_month = serializers.IntegerField()
    revenue_this_month = serializers.DecimalField(max_digits=10, decimal_places=2)
