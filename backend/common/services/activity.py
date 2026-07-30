from common.models import ActivityLog

AUDIT_ACTIONS = (
    "login", "logout", "patient_registration", "appointment_created", "appointment_updated", "appointment_status_updated", "appointment_cancelled", "appointment_completed", "billing_created", "billing_updated", "invoice_finalized", "payment_completed", "payment_refunded", "report_generated", "report_approved", "inventory_created", "inventory_updated", "inventory_deleted", "inventory_used", "system_settings_updated",
)

def log_activity(*, actor=None, action, entity=None, metadata=None):
    return ActivityLog.objects.create(actor=actor, action=action, entity_type=entity.__class__.__name__ if entity else "", entity_id=str(getattr(entity, "pk", "")), metadata=metadata or {})
