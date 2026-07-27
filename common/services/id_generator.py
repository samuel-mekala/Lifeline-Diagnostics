from django.db.models import Model


def generate_business_id(model: Model, field: str, prefix: str) -> str:
    """
    Generate sequential business IDs like:
    PAT000001
    VIS000001
    REP000001
    """

    last_record = (
        model.objects
        .filter(**{f"{field}__startswith": prefix})
        .order_by(f"-{field}")
        .first()
    )

    if last_record is None:
        return f"{prefix}000001"

    last_id = getattr(last_record, field)
    last_number = int(last_id.replace(prefix, ""))

    return f"{prefix}{last_number + 1:06d}"