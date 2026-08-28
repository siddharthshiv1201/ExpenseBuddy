from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied

from expenses.models import Expense
from .models import Receipt
from .serializers import ReceiptSerializer


class ReceiptCreateView(generics.CreateAPIView):
    serializer_class = ReceiptSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        expense = serializer.validated_data["expense"]

        if expense.user_id != self.request.user.id:
            raise PermissionDenied(
                "You can only upload receipts for your own expenses."
            )

        serializer.save()


class ExpenseReceiptListView(generics.ListAPIView):
    serializer_class = ReceiptSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        expense_id = self.kwargs["expense_id"]

        return Receipt.objects.filter(
            expense_id=expense_id,
            expense__user=self.request.user,
        ).order_by("-uploaded_at")


class ReceiptDetailView(generics.RetrieveDestroyAPIView):
    serializer_class = ReceiptSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Receipt.objects.filter(
            expense__user=self.request.user,
        )