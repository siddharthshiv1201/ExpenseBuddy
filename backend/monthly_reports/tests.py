from decimal import Decimal

from django.contrib.auth import get_user_model
from accounts.models import Profile
from django.test import TestCase
from openpyxl import load_workbook

from expenses.models import Expense
from .services import generate_monthly_expense_report


User = get_user_model()


class MonthlyReportTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="employee@example.com",
            password="TestPassword123!",
        )

        # The profile is required by the report generator.
        Profile.objects.create(
            user=self.user,
            first_name="Test",
            last_name="Employee",
            designation="Employee",
            state="Delhi",
            headquarters="New Delhi",
        )

    def test_multiple_expenses_same_date_are_consolidated(self):
        Expense.objects.create(
            user=self.user,
            expense_date="2026-08-25",
            category="TRAVEL",
            description="Flight",
            from_location="Delhi",
            to_location="Mumbai",
            mode_of_conveyance="Flight",
            fare=Decimal("5500.00"),
        )

        Expense.objects.create(
            user=self.user,
            expense_date="2026-08-25",
            category="MEALS",
            description="Lunch",
            food=Decimal("800.00"),
        )

        Expense.objects.create(
            user=self.user,
            expense_date="2026-08-25",
            category="TRANSPORT",
            description="Uber",
            from_location="Mumbai",
            to_location="Hotel",
            mode_of_conveyance="Uber",
            fare=Decimal("300.00"),
        )

        path = generate_monthly_expense_report(
            self.user,
            2026,
            8,
        )

        workbook = load_workbook(
            path,
            data_only=False,
        )
        worksheet = workbook.active

        # All three expenses must appear as ONE row.
        self.assertEqual(
            worksheet["A14"].value.strftime("%Y-%m-%d"),
            "2026-08-25",
        )

        self.assertEqual(
            worksheet["H14"].value,
            Decimal("5800.00"),
        )

        self.assertEqual(
            worksheet["J14"].value,
            Decimal("800.00"),
        )

        # The next row must be empty.
        self.assertIsNone(
            worksheet["A15"].value,
        )

    def test_report_contains_employee_information(self):
        path = generate_monthly_expense_report(
            self.user,
            2026,
            8,
        )

        workbook = load_workbook(
            path,
            data_only=False,
        )
        worksheet = workbook.active

        self.assertEqual(
            worksheet["C8"].value,
            "Test Employee",
        )

        self.assertEqual(
            worksheet["E8"].value,
            "Employee",
        )

        self.assertEqual(
            worksheet["I8"].value,
            "Delhi",
        )

        self.assertEqual(
            worksheet["C9"].value,
            "New Delhi",
        )

        self.assertEqual(
            worksheet["D9"].value,
            "Month :- 2026-08",
        )

    def test_report_date_is_in_date_column(self):
        Expense.objects.create(
            user=self.user,
            expense_date="2026-08-25",
            category="TRAVEL",
            description="Flight",
            fare=Decimal("5500.00"),
        )

        path = generate_monthly_expense_report(
            self.user,
            2026,
            8,
        )

        workbook = load_workbook(
            path,
            data_only=False,
        )
        worksheet = workbook.active

        self.assertEqual(
            worksheet["A14"].value.strftime("%Y-%m-%d"),
            "2026-08-25",
        )

        self.assertEqual(
            worksheet["A14"].number_format,
            "DD-MMM",
        )

        self.assertIsNone(
            worksheet["M9"].value,
        )