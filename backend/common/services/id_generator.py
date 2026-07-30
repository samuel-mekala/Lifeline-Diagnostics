import re
from django.db import IntegrityError, transaction
from django.db.models import Model

from common.models import BusinessIDSequence


def generate_business_id(model: Model, field: str, prefix: str) -> str:
    """
    Generate sequential business IDs like:
    PAT-000001
    VIS-000001
    INV-000001
    REP-000001
    """
    clean_prefix = prefix.rstrip("-")
    sequence_key = f"{model._meta.label_lower}:{field}:{clean_prefix}"

    while True:
        try:
            with transaction.atomic():
                sequence, created = BusinessIDSequence.objects.select_for_update().get_or_create(
                    key=sequence_key,
                )

                # Dynamically calculate exact maximum sequence number in table
                all_existing_ids = model.objects.values_list(field, flat=True)
                max_num = 0
                for item_id in all_existing_ids:
                    if item_id:
                        numbers = re.findall(r'\d+', str(item_id))
                        if numbers:
                            val = int(numbers[-1])
                            if val > max_num:
                                max_num = val

                if created or sequence.next_number <= max_num:
                    sequence.next_number = max_num + 1

                number = sequence.next_number
                sequence.next_number += 1
                sequence.save()

                return f"{clean_prefix}-{number:06d}"
        except IntegrityError:
            # Concurrent retry
            continue
