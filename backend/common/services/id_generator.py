from django.db import IntegrityError, transaction
from django.db.models import Model

from common.models import BusinessIDSequence


def generate_business_id(model: Model, field: str, prefix: str) -> str:
    """
    Generate sequential business IDs like:
    PAT000001
    VIS000001
    REP000001
    """

    sequence_key = f"{model._meta.label_lower}:{field}:{prefix}"
    while True:
        try:
            with transaction.atomic():
                sequence, created = BusinessIDSequence.objects.select_for_update().get_or_create(
                    key=sequence_key,
                )
                if created:
                    last_record = model.objects.filter(
                        **{f"{field}__startswith": prefix}
                    ).order_by(f"-{field}").first()
                    if last_record is not None:
                        last_id = getattr(last_record, field)
                        sequence.next_number = int(last_id.replace(prefix, "")) + 1
                number = sequence.next_number
                sequence.next_number += 1
                sequence.save(update_fields=["next_number"])
                return f"{prefix}{number:06d}"
        except IntegrityError:
            # A concurrent first allocation created the sequence row; retry and lock it.
            continue
