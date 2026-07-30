from django.contrib import admin

from common.services.id_generator import generate_business_id
# Register your models here.

class BusinessIDAdmin(admin.ModelAdmin):
    business_id_field = None
    business_id_prefix = None

    def save_model(self, request, obj, form, change):
        if (
            self.business_id_field
            and self.business_id_prefix
            and not getattr(obj, self.business_id_field)
        ):
            setattr(
                obj,
                self.business_id_field,
                generate_business_id(
                    model=obj.__class__,
                    field=self.business_id_field,
                    prefix=self.business_id_prefix,
                ),
            )

        super().save_model(request, obj, form, change)
