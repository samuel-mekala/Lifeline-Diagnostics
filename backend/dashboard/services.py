from decimal import Decimal

from django.db.models import Sum
from django.utils import timezone

from billing.models import Invoice, Payment
from laboratory.models import Result
from patients.models import Patient
from reports.models import Report
from visits.models import Visit


class DashboardService:
    RECENT_ITEM_LIMIT = 10

    @staticmethod
    def get_summary():
        today = timezone.localdate()

        return {
            "total_patients": Patient.objects.count(),
            "today_patients": Patient.objects.filter(registered_on__date=today).count(),
            "total_visits": Visit.objects.count(),
            "today_visits": Visit.objects.filter(created_at__date=today).count(),
            "results": {
                "draft": Result.objects.filter(status=Result.Status.DRAFT).count(),
                "submitted": Result.objects.filter(status=Result.Status.SUBMITTED).count(),
                "approved": Result.objects.filter(status=Result.Status.APPROVED).count(),
                "rejected": Result.objects.filter(status=Result.Status.REJECTED).count(),
            },
            "invoices": {
                "total": Invoice.objects.count(),
                "pending": Invoice.objects.filter(
                    status__in=[
                        Invoice.Status.UNPAID,
                        Invoice.Status.PARTIALLY_PAID,
                    ]
                ).count(),
                "paid": Invoice.objects.filter(status=Invoice.Status.PAID).count(),
            },
            "today_revenue": DashboardService._revenue_for_date(today),
        }

    @staticmethod
    def get_recent_items():
        patients = Patient.objects.order_by("-registered_on")[:DashboardService.RECENT_ITEM_LIMIT]
        reports = (
            Report.objects.filter(
                status=Report.Status.GENERATED,
                generated_at__isnull=False,
            )
            .select_related("visit__patient")
            .order_by("-generated_at")[:DashboardService.RECENT_ITEM_LIMIT]
        )
        invoices = (
            Invoice.objects.select_related("visit__patient")
            .order_by("-created_at")[:DashboardService.RECENT_ITEM_LIMIT]
        )

        items = [
            {
                "type": "patient",
                "identifier": patient.patient_id,
                "title": patient.full_name,
                "status": None,
                "timestamp": patient.registered_on,
            }
            for patient in patients
        ]
        items.extend(
            {
                "type": "report",
                "identifier": report.report_id,
                "title": report.visit.patient.full_name,
                "status": report.status,
                "timestamp": report.generated_at,
            }
            for report in reports
        )
        items.extend(
            {
                "type": "invoice",
                "identifier": invoice.invoice_id,
                "title": invoice.visit.patient.full_name,
                "status": invoice.status,
                "timestamp": invoice.created_at,
            }
            for invoice in invoices
        )

        return sorted(
            items,
            key=lambda item: item["timestamp"],
            reverse=True,
        )[:DashboardService.RECENT_ITEM_LIMIT]

    @staticmethod
    def get_pending_items():
        draft_results = Result.objects.filter(status=Result.Status.DRAFT).select_related(
            "ordered_test__visit__patient",
            "ordered_test__laboratory_test",
        )
        submitted_results = Result.objects.filter(
            status=Result.Status.SUBMITTED
        ).select_related(
            "ordered_test__visit__patient",
            "ordered_test__laboratory_test",
        )
        pending_invoices = Invoice.objects.filter(
            status__in=[
                Invoice.Status.UNPAID,
                Invoice.Status.PARTIALLY_PAID,
            ]
        ).select_related("visit__patient")

        return {
            "draft_results": [
                DashboardService._result_item(result) for result in draft_results
            ],
            "submitted_results": [
                DashboardService._result_item(result) for result in submitted_results
            ],
            "pending_invoices": [
                {
                    "invoice_id": invoice.invoice_id,
                    "patient_name": invoice.visit.patient.full_name,
                    "status": invoice.status,
                    "balance_due": invoice.balance_due,
                    "created_at": invoice.created_at,
                }
                for invoice in pending_invoices
            ],
        }

    @staticmethod
    def get_statistics():
        today = timezone.localdate()
        month_start = today.replace(day=1)

        return {
            "patients_this_month": Patient.objects.filter(
                registered_on__date__gte=month_start
            ).count(),
            "visits_this_month": Visit.objects.filter(
                created_at__date__gte=month_start
            ).count(),
            "reports_generated_this_month": Report.objects.filter(
                status=Report.Status.GENERATED,
                generated_at__date__gte=month_start,
            ).count(),
            "revenue_this_month": DashboardService._revenue_since(month_start),
        }

    @staticmethod
    def _result_item(result):
        return {
            "result_id": result.result_id,
            "patient_name": result.ordered_test.visit.patient.full_name,
            "test_name": result.ordered_test.laboratory_test.name,
            "status": result.status,
            "created_at": result.created_at,
        }

    @staticmethod
    def _revenue_for_date(date):
        return DashboardService._revenue_queryset(
            paid_at__date=date,
        )

    @staticmethod
    def _revenue_since(start_date):
        return DashboardService._revenue_queryset(
            paid_at__date__gte=start_date,
        )

    @staticmethod
    def _revenue_queryset(**filters):
        revenue = Payment.objects.filter(
            status=Payment.Status.SUCCESS,
            **filters,
        ).aggregate(total=Sum("amount"))["total"]
        return revenue or Decimal("0.00")
