from django.urls import path

from .views import MonthlyExpenseReportView


urlpatterns = [
    path(
        "monthly/",
        MonthlyExpenseReportView.as_view(),
        name="monthly-expense-report",
    ),
]