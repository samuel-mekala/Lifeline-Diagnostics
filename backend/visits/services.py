from django.db import transaction
from django.db.models import Q

from common.services.id_generator import generate_business_id
from visits.models import Visit


class VisitService:

    @staticmethod
    def get_visit(*, visit_id):
        return Visit.objects.get(visit_id=visit_id)

    @staticmethod
    def list_visits(*, filters):
        search = filters.get("search") or filters.get("q", "")
        visits = Visit.objects.select_related("patient")
        if search:
            visits = visits.filter(
                Q(visit_id__icontains=search)
                | Q(patient__patient_id__icontains=search)
                | Q(patient__full_name__icontains=search)
            )
        if patient_id := filters.get("patient_id"):
            visits = visits.filter(patient__patient_id=patient_id)
        if status := filters.get("status"):
            visits = visits.filter(status=status)
        if entry_mode := filters.get("entry_mode"):
            visits = visits.filter(entry_mode=entry_mode)
        if created_from := filters.get("created_from"):
            visits = visits.filter(created_at__date__gte=created_from)
        if created_to := filters.get("created_to"):
            visits = visits.filter(created_at__date__lte=created_to)
        return visits.order_by(filters["ordering"])

    @staticmethod
    @transaction.atomic
    def create_visit(
        *,
        patient,
        entry_mode=Visit.EntryMode.WALK_IN,
        remarks="",
    ):
        return Visit.objects.create(
            visit_id=generate_business_id(
                model=Visit,
                field="visit_id",
                prefix="VIS",
            ),
            patient=patient,
            entry_mode=entry_mode,
            remarks=remarks,
        )

    @staticmethod
    @transaction.atomic
    def update_visit(
        *,
        visit,
        **data,
    ):
        for field, value in data.items():
            setattr(visit, field, value)

        visit.save()

        return visit

    @staticmethod
    @transaction.atomic
    def update_status(
        *,
        visit,
        status,
    ):
        if visit.status in {"COMPLETED", "CANCELLED"} and visit.status != status:
            raise ValueError("Completed or cancelled visits cannot change status.")
        visit.status = status
        visit.save(update_fields=["status"])

        return visit
