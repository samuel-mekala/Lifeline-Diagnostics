from django.urls import path

from billing.views import (
    AddPackageAPIView,
    AddTestAPIView,
    ApplyDiscountAPIView,
    CreateInvoiceAPIView,
    FinalizeInvoiceAPIView,
    RecordPaymentAPIView,
    RefundPaymentAPIView,
    RemoveInvoiceItemAPIView,
)

urlpatterns = [
    path(
        "create/<str:visit_id>/",
        CreateInvoiceAPIView.as_view(),
        name="create-invoice",
    ),
    path(
        "add-test/<str:invoice_id>/",
        AddTestAPIView.as_view(),
        name="add-test",
    ),
    path(
        "add-package/<str:invoice_id>/",
        AddPackageAPIView.as_view(),
        name="add-package",
    ),
    path(
        "remove-item/<uuid:item_id>/",
        RemoveInvoiceItemAPIView.as_view(),
        name="remove-invoice-item",
    ),
    path(
        "apply-discount/<str:invoice_id>/",
        ApplyDiscountAPIView.as_view(),
        name="apply-discount",
    ),
    path(
        "finalize/<str:invoice_id>/",
        FinalizeInvoiceAPIView.as_view(),
        name="finalize-invoice",
    ),
    path(
        "record-payment/<str:invoice_id>/",
        RecordPaymentAPIView.as_view(),
        name="record-payment",
    ),
    path(
        "refund-payment/<str:payment_id>/",
        RefundPaymentAPIView.as_view(),
        name="refund-payment",
    ),
]
