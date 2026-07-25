from django.db.models import Model


def generate_business_id(model: Model, field: str, prefix: str) -> str:
    """
    Generate sequential business IDs like:
    PAT000001
    VIS000001
    INV000001
    """

    last_record = model.objects.order_by(f"-{field}").first()

    if not last_record:
        return f"{prefix}000001"

    last_id = getattr(last_record, field)

    last_number = int(last_id.replace(prefix, ""))

    return f"{prefix}{last_number + 1:06d}"