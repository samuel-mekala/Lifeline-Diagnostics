from django.db import transaction

from patients.models import Patient, PatientAddress


class AddressService:
    @staticmethod
    def list(*, patient_id):
        return PatientAddress.objects.filter(patient__patient_id=patient_id)

    @staticmethod
    def get(*, address_id):
        return PatientAddress.objects.select_related("patient").get(id=address_id)

    @staticmethod
    @transaction.atomic
    def create(*, patient_id, label, address, is_default=False):
        # Serializing mutations through the patient row keeps the read/modify/write
        # sequence correct even when the patient has no address rows yet.
        patient = Patient.objects.select_for_update().get(patient_id=patient_id)
        if is_default or not patient.addresses.exists():
            patient.addresses.update(is_default=False)
            is_default = True
        return PatientAddress.objects.create(
            patient=patient,
            label=label,
            address=address,
            is_default=is_default,
        )

    @staticmethod
    @transaction.atomic
    def update(*, address, **data):
        Patient.objects.select_for_update().get(pk=address.patient_id)
        address = PatientAddress.objects.select_for_update().get(pk=address.pk)
        if data.get("is_default") is False and address.is_default:
            raise ValueError("A patient's default address cannot be unset directly.")
        if data.get("is_default"):
            address.patient.addresses.exclude(id=address.id).update(is_default=False)
        for field, value in data.items():
            setattr(address, field, value)
        address.save(update_fields=[*data.keys()])
        return address

    @staticmethod
    @transaction.atomic
    def delete(*, address):
        Patient.objects.select_for_update().get(pk=address.patient_id)
        address = PatientAddress.objects.select_for_update().get(pk=address.pk)
        patient_id = address.patient_id
        was_default = address.is_default
        address.delete()
        if was_default:
            replacement = (
                PatientAddress.objects.select_for_update()
                .filter(patient_id=patient_id)
                .order_by("-created_at")
                .first()
            )
            if replacement is not None:
                replacement.is_default = True
                replacement.save(update_fields=["is_default"])
