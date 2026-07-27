from django.db import transaction

from common.services.id_generator import generate_business_id
from visits.models import Visit


class VisitService:

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
        visit.status = status
        visit.save(update_fields=["status"])

        return visit
