from common.services.id_generator import generate_business_id

from .models import Visit


class VisitService:
    @staticmethod
    def create_visit(**kwargs):
        kwargs["visit_id"] = generate_business_id(
            model=Visit,
            field="visit_id",
            prefix="VIS",
        )

        return Visit.objects.create(**kwargs)