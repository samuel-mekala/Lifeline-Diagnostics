def generate_business_id(model, field_name, prefix):
    """
    Generate sequential business IDs such as:
    PAT000001
    VIS000001
    REP000001
    """

    latest = (
        model.objects
        .filter(**{f"{field_name}__startswith": prefix})
        .order_by(f"-{field_name}")
        .first()
    )

    if latest:
        latest_id = getattr(latest, field_name)
        number = int(latest_id.replace(prefix, "")) + 1
    else:
        number = 1

    return f"{prefix}{number:06d}"