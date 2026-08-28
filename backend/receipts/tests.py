from decimal import Decimal
from io import BytesIO

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from rest_framework.test import APITestCase

from expenses.models import Expense
from .models import Receipt


User = get_user_model()


class ReceiptAPITests(APITestCase):
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
            fare=Decimal("5500.00"),
        )

        self.other_expense = Expense.objects.create(
            user=self.other_user,
            expense_date="2026-08-25",
            category="TRAVEL",
            description="Other employee expense",
            fare=Decimal("1000.00"),
        )

    def create_test_file(self, name="receipt.jpg"):
        return SimpleUploadedFile(
            name,
            b"fake jpeg receipt content",
            content_type="image/jpeg",
        )

    def test_upload_receipt(self):
        response = self.client.post(
            "/api/receipts/",
            {
                "expense": str(self.expense.id),
                "file": self.create_test_file(),
            },
            format="multipart",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        receipt = Receipt.objects.get(
            expense=self.expense,
        )

        self.assertEqual(
            receipt.original_filename,
            "receipt.jpg",
        )

    def test_list_receipts_for_own_expense(self):
        Receipt.objects.create(
            expense=self.expense,
            file=self.create_test_file(),
            original_filename="receipt.jpg",
        )

        response = self.client.get(
            f"/api/receipts/expense/{self.expense.id}/",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            len(response.data),
            1,
        )

    def test_cannot_list_another_users_receipts(self):
        Receipt.objects.create(
            expense=self.other_expense,
            file=self.create_test_file(),
            original_filename="private.jpg",
        )

        response = self.client.get(
            f"/api/receipts/expense/{self.other_expense.id}/",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            len(response.data),
            0,
        )

    def test_cannot_upload_receipt_for_another_users_expense(self):
        response = self.client.post(
            "/api/receipts/",
            {
                "expense": str(self.other_expense.id),
                "file": self.create_test_file(),
            },
            format="multipart",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

        self.assertFalse(
            Receipt.objects.filter(
                expense=self.other_expense,
            ).exists()
        )

    def test_delete_own_receipt(self):
        receipt = Receipt.objects.create(
            expense=self.expense,
            file=self.create_test_file(),
            original_filename="receipt.jpg",
        )

        response = self.client.delete(
            f"/api/receipts/{receipt.id}/",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_204_NO_CONTENT,
        )

        self.assertFalse(
            Receipt.objects.filter(
                id=receipt.id,
            ).exists()
        )

    def test_cannot_delete_another_users_receipt(self):
        receipt = Receipt.objects.create(
            expense=self.other_expense,
            file=self.create_test_file(),
            original_filename="private.jpg",
        )

        response = self.client.delete(
            f"/api/receipts/{receipt.id}/",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )

        self.assertTrue(
            Receipt.objects.filter(
                id=receipt.id,
            ).exists()
        )

    def test_rejects_invalid_file_type(self):
        invalid_file = SimpleUploadedFile(
            "receipt.txt",
            b"not a receipt",
            content_type="text/plain",
        )

        response = self.client.post(
            "/api/receipts/",
            {
                "expense": str(self.expense.id),
                "file": invalid_file,
            },
            format="multipart",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.assertFalse(
            Receipt.objects.filter(
                expense=self.expense,
            ).exists()
        )