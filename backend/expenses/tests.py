from decimal import Decimal

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Expense


User = get_user_model()


class ExpenseAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="employee1@example.com",
            password="TestPassword123!",
        )

        self.other_user = User.objects.create_user(
            email="employee2@example.com",
            password="TestPassword123!",
        )

        self.client.force_authenticate(user=self.user)

        self.expense = Expense.objects.create(
            user=self.user,
            expense_date="2026-08-25",
            category="TRAVEL",
            description="Flight to Mumbai",
            from_location="Delhi",
            to_location="Mumbai",
            distance_km=1400,
            mode_of_conveyance="Flight",
            fare=Decimal("5500.00"),
            stay=Decimal("0.00"),
            food=Decimal("0.00"),
            da=Decimal("0.00"),
            miscellaneous_1=Decimal("0.00"),
            miscellaneous_2=Decimal("0.00"),
        )

    def test_list_only_returns_current_users_expenses(self):
        Expense.objects.create(
            user=self.other_user,
            expense_date="2026-08-25",
            category="TRAVEL",
            description="Other employee expense",
            fare=Decimal("1000.00"),
        )

        response = self.client.get("/api/expenses/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(
            response.data[0]["id"],
            str(self.expense.id),
        )

    def test_create_expense(self):
        data = {
            "expense_date": "2026-08-25",
            "category": "TRAVEL",
            "description": "Uber to hotel",
            "from_location": "Mumbai Airport",
            "to_location": "Hotel",
            "mode_of_conveyance": "Uber",
            "fare": "300.00",
            "stay": "0.00",
            "food": "0.00",
            "da": "0.00",
            "miscellaneous_1": "0.00",
            "miscellaneous_2": "0.00",
        }

        response = self.client.post(
            "/api/expenses/",
            data,
            format="json",
        )

        
        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        expense = Expense.objects.get(
            id=response.data["id"],
        )

        self.assertEqual(
            expense.user,
            self.user,
        )
        self.assertEqual(
            expense.fare,
            Decimal("300.00"),
        )

    def test_update_expense(self):
        response = self.client.patch(
            f"/api/expenses/{self.expense.id}/",
            {
                "remarks": "Updated receipt details",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.expense.refresh_from_db()

        self.assertEqual(
            self.expense.remarks,
            "Updated receipt details",
        )

    def test_delete_expense(self):
        response = self.client.delete(
            f"/api/expenses/{self.expense.id}/",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_204_NO_CONTENT,
        )

        self.assertFalse(
            Expense.objects.filter(
                id=self.expense.id,
            ).exists()
        )

    def test_cannot_access_another_users_expense(self):
        other_expense = Expense.objects.create(
            user=self.other_user,
            expense_date="2026-08-25",
            category="TRAVEL",
            description="Private expense",
            fare=Decimal("999.00"),
        )

        response = self.client.get(
            f"/api/expenses/{other_expense.id}/",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )

    def test_cannot_delete_another_users_expense(self):
        other_expense = Expense.objects.create(
            user=self.other_user,
            expense_date="2026-08-25",
            category="TRAVEL",
            description="Private expense",
            fare=Decimal("999.00"),
        )

        response = self.client.delete(
            f"/api/expenses/{other_expense.id}/",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )

        self.assertTrue(
            Expense.objects.filter(
                id=other_expense.id,
            ).exists()
        )