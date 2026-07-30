from decimal import Decimal

from django.db.models import Count, Sum
from django.utils import timezone

from billing.models import InvoiceItem, Payment
from laboratory.models import Sample
from patients.models import Patient
from reports.models import Report
from visits.models import Appointment


class AnalyticsService:
    @staticmethod
    def overview():
        today = timezone.localdate()
        month_start = today.replace(day=1)
        year_start = today.replace(month=1, day=1)
        paid = Payment.objects.filter(status=Payment.Status.SUCCESS)
        revenue = lambda query: query.aggregate(total=Sum("amount"))["total"] or Decimal("0.00")
        return {
            "total_revenue": revenue(paid), "daily_revenue": revenue(paid.filter(paid_at__date=today)), "monthly_revenue": revenue(paid.filter(paid_at__date__gte=month_start)), "yearly_revenue": revenue(paid.filter(paid_at__date__gte=year_start)),
            "total_patients": Patient.objects.count(), "new_patients": Patient.objects.filter(registered_on__date__gte=month_start).count(),
            "total_appointments": Appointment.objects.count(), "pending_appointments": Appointment.objects.filter(status__in=[Appointment.Status.BOOKED, Appointment.Status.ACCEPTED]).count(),
            "samples": Sample.objects.count(), "reports": Report.objects.filter(status=Report.Status.GENERATED).count(),
            "top_tests": list(InvoiceItem.objects.filter(item_type=InvoiceItem.ItemType.TEST).values("item_id", "item_name").annotate(count=Count("id"), revenue=Sum("line_total")).order_by("-count")[:5]),
            "top_packages": list(InvoiceItem.objects.filter(item_type=InvoiceItem.ItemType.PACKAGE).values("item_id", "item_name").annotate(count=Count("id"), revenue=Sum("line_total")).order_by("-count")[:5]),
            "employee_productivity": list(Sample.objects.exclude(collected_by=None).values("collected_by__full_name").annotate(samples_collected=Count("id")).order_by("-samples_collected")[:10]),
        }
