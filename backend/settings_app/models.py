from django.db import models


class SystemSettings(models.Model):
    laboratory_name = models.CharField(max_length=255, default="Lifeline Diagnostics")
    laboratory_address = models.TextField(blank=True)
    laboratory_phone = models.CharField(max_length=30, blank=True)
    laboratory_email = models.EmailField(blank=True)
    logo_url = models.URLField(blank=True)
    primary_color = models.CharField(max_length=20, default="#1F4E79")
    email_from_name = models.CharField(max_length=100, blank=True)
    email_reply_to = models.EmailField(blank=True)
    tax_name = models.CharField(max_length=50, default="Tax")
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    timezone = models.CharField(max_length=50, default="Asia/Kolkata")
    currency = models.CharField(max_length=3, default="INR")
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "System settings"
