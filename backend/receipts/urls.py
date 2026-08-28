from django.urls import path

from .views import (
    ExpenseReceiptListView,
    ReceiptCreateView,
    ReceiptDetailView,
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
        "<str:pk>/",
        ReceiptDetailView.as_view(),
        name="receipt-detail",
    ),
]