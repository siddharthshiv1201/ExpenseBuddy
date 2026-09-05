from django.http import FileResponse
from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

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


class DateReceiptListView(generics.ListAPIView):
    serializer_class = ReceiptSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        date_value = self.request.query_params.get("date")

        if not date_value:
            return Receipt.objects.none()

        try:
            from datetime import date

            selected_date = date.fromisoformat(date_value)
        except ValueError:
            return Receipt.objects.none()

        return Receipt.objects.filter(
            expense__user=self.request.user,
            expense__expense_date=selected_date,
        ).order_by("-uploaded_at")


class DateReceiptDownloadView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        import io
        import zipfile
        from datetime import date
        from urllib.request import urlopen

        date_value = request.query_params.get("date")

        if not date_value:
            return Response(
                {"detail": "date is required. Use YYYY-MM-DD."},
                status=400,
            )

        try:
            selected_date = date.fromisoformat(date_value)
        except ValueError:
            return Response(
                {"detail": "date must be in YYYY-MM-DD format."},
                status=400,
            )

        receipts = Receipt.objects.filter(
            expense__user=request.user,
            expense__expense_date=selected_date,
        ).order_by("uploaded_at")

        if not receipts.exists():
            return Response(
                {"detail": "No receipts found for this date."},
                status=404,
            )

        zip_buffer = io.BytesIO()

        with zipfile.ZipFile(
            zip_buffer,
            "w",
            zipfile.ZIP_DEFLATED,
        ) as zip_file:
            for index, receipt in enumerate(receipts, start=1):
                try:
                    with urlopen(
                        receipt.file.url,
                        timeout=30,
                    ) as response:
                        file_data = response.read()

                except Exception as exc:
                    return Response(
                        {
                            "detail": (
                                f"Failed to download receipt "
                                f"'{receipt.original_filename}': {exc}"
                            )
                        },
                        status=502,
                    )

                filename = (
                    receipt.original_filename
                    or f"receipt_{index}"
                )

                zip_file.writestr(
                    filename,
                    file_data,
                )

        zip_buffer.seek(0)

        response = FileResponse(
            zip_buffer,
            as_attachment=True,
            filename=f"receipts_{selected_date.isoformat()}.zip",
            content_type="application/zip",
        )

        return response