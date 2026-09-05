from django.urls import path

from .views import (
    ExpenseReceiptListView,
    ReceiptCreateView,
    ReceiptDetailView,
    DateReceiptListView,
    DateReceiptDownloadView,
)


urlpatterns = [
    path(
        "",
        ReceiptCreateView.as_view(),
        name="receipt-create",
    ),
    path(
        "expense/<str:expense_id>/",
        ExpenseReceiptListView.as_view(),
        name="expense-receipts",
    ),
    path(
        "date/",
        DateReceiptListView.as_view(),
        name="date-receipts",
    ),
    path(
        "date/download/",
        DateReceiptDownloadView.as_view(),
        name="date-receipt-download",
    ),
    path(
        "<str:pk>/",
        ReceiptDetailView.as_view(),
        name="receipt-detail",
    ),
]
