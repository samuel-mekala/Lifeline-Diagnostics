from django.db import models

class TokenQueueItem(models.Model):
    token_number = models.IntegerField()
    patient_name = models.CharField(max_length=255)
    service_type = models.CharField(max_length=100) # BILLING, SAMPLE_COLLECTION, REPORT_COLLECTION, ENQUIRY
    counter_number = models.IntegerField(default=1)
    status = models.CharField(max_length=50, default='WAITING') # WAITING, CALLING, SERVING, COMPLETED, NO_SHOW
    issued_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Token #{self.token_number} - {self.patient_name} ({self.status})"

class DailyCashDrawer(models.Model):
    clerk_name = models.CharField(max_length=150)
    counter_id = models.CharField(max_length=50)
    opening_cash = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    cash_collected = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    upi_collected = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    card_collected = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    closing_cash = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    is_closed = models.BooleanField(default=False)
    date = models.DateField(auto_now_add=True)

    def __str__(self):
        return f"{self.date} | {self.clerk_name} ({self.counter_id})"
