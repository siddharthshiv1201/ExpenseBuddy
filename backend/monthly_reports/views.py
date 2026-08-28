from pathlib import Path

from django.http import FileResponse
from rest_framework import permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .services import generate_monthly_expense_report


class MonthlyExpenseReportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        month = request.query_params.get("month")

        if not month:
            return Response(
                {"detail": "month is required. Use YYYY-MM."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            year, month_number = map(int, month.split("-"))

            if not 1 <= month_number <= 12:
                raise ValueError

        except ValueError:
            return Response(
                {"detail": "month must be in YYYY-MM format."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            file_path = generate_monthly_expense_report(
                request.user,
                year,
                month_number,
            )
        except Exception as exc:
            return Response(
                {"detail": str(exc)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        filename = (
            f"expense_report_"
            f"{request.user.email}_"
            f"{year}_{month_number:02d}.xlsx"
        )

        response = FileResponse(
            open(file_path, "rb"),
            as_attachment=True,
            filename=filename,
            content_type=(
                "application/vnd.openxmlformats-officedocument."
                "spreadsheetml.sheet"
            ),
        )

        return response