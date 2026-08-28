
from pathlib import Path
from tempfile import NamedTemporaryFile

from django.conf import settings
from openpyxl import load_workbook


TEMPLATE_PATH = (
    Path(settings.BASE_DIR)
    / "templates"
    / "excel"
    / "expense_report_template.xlsx"
)


def generate_monthly_expense_report(user, year, month):
    workbook = load_workbook(TEMPLATE_PATH)
    worksheet = workbook.active

    profile = user.profile

    # -----------------------------
    # Employee / report information
    # -----------------------------
    worksheet["D7"] = profile.reporting_to
    worksheet["I7"] = profile.designation

    worksheet["C8"] = f"{profile.first_name} {profile.last_name}"
    worksheet["E8"] = profile.designation
    worksheet["I8"] = profile.state

    worksheet["C9"] = profile.headquarters
    worksheet["D9"] = f"Month :- {year}-{month:02d}"
    worksheet["M9"] = None

    # -----------------------------
    # Expense rows
    # -----------------------------
    expenses = user.expenses.filter(
        expense_date__year=year,
        expense_date__month=month,
    ).order_by("expense_date", "created_at")

    start_row = 14
    end_row = 44
    max_rows = end_row - start_row + 1

    # Clear existing sample data from the template.
    for row in range(start_row, end_row + 1):
        for column in range(1, 16):
            worksheet.cell(row=row, column=column).value = None

    # -----------------------------------------
    # Consolidate multiple expenses by date
    # -----------------------------------------
    expenses_by_date = {}

    for expense in expenses:
        expenses_by_date.setdefault(
            expense.expense_date,
            [],
        ).append(expense)

    for row_number, (expense_date, daily_expenses) in enumerate(
        list(expenses_by_date.items())[:max_rows],
        start=start_row,
    ):
        # -----------------------------------------
        # Date
        # -----------------------------------------
        date_cell = worksheet.cell(
            row=row_number,
            column=1,
        )
        date_cell.value = expense_date
        date_cell.number_format = "DD-MMM"

        # -----------------------------------------
        # Combine descriptive information
        # -----------------------------------------
        from_locations = []
        to_locations = []
        modes = []
        remarks = []

        for expense in daily_expenses:
            if expense.from_location:
                from_locations.append(expense.from_location)

            if expense.to_location:
                to_locations.append(expense.to_location)

            if expense.mode_of_conveyance:
                modes.append(expense.mode_of_conveyance)

            if expense.remarks:
                remarks.append(expense.remarks)

        worksheet.cell(
            row=row_number,
            column=2,
        ).value = " / ".join(dict.fromkeys(from_locations))

        worksheet.cell(
            row=row_number,
            column=3,
        ).value = " / ".join(dict.fromkeys(to_locations))

        worksheet.cell(
            row=row_number,
            column=5,
        ).value = " / ".join(dict.fromkeys(modes))

        worksheet.cell(
            row=row_number,
            column=13,
        ).value = " ; ".join(dict.fromkeys(remarks))

        # -----------------------------------------
        # Combine financial amounts for the day
        # -----------------------------------------
        worksheet.cell(
            row=row_number,
            column=8,
        ).value = sum(
            (expense.fare or 0)
            for expense in daily_expenses
        )

        worksheet.cell(
            row=row_number,
            column=9,
        ).value = sum(
            (expense.stay or 0)
            for expense in daily_expenses
        )

        worksheet.cell(
            row=row_number,
            column=10,
        ).value = sum(
            (expense.food or 0)
            for expense in daily_expenses
        )

        worksheet.cell(
            row=row_number,
            column=11,
        ).value = sum(
            (expense.da or 0)
            for expense in daily_expenses
        )

        # -----------------------------------------
        # Miscellaneous details
        # -----------------------------------------
        worksheet.cell(
            row=row_number,
            column=14,
        ).value = sum(
            (expense.miscellaneous_1 or 0)
            for expense in daily_expenses
        )

        worksheet.cell(
            row=row_number,
            column=15,
        ).value = sum(
            (expense.miscellaneous_2 or 0)
            for expense in daily_expenses
        )

        worksheet.cell(
            row=row_number,
            column=12,
        ).value = f"=N{row_number}+O{row_number}"

        # -----------------------------------------
        # Distance
        # -----------------------------------------
        distances = [
            expense.distance_km
            for expense in daily_expenses
            if expense.distance_km
        ]

        if distances:
            worksheet.cell(
                row=row_number,
                column=4,
            ).value = sum(distances)

        # -----------------------------------------
        # Times
        # -----------------------------------------
        departure_times = [
            expense.departure_time
            for expense in daily_expenses
            if expense.departure_time
        ]

        arrival_times = [
            expense.arrival_time
            for expense in daily_expenses
            if expense.arrival_time
        ]

        if departure_times:
            worksheet.cell(
                row=row_number,
                column=6,
            ).value = min(departure_times)

        if arrival_times:
            worksheet.cell(
                row=row_number,
                column=7,
            ).value = max(arrival_times)
    # -----------------------------
    # Totals
    # -----------------------------
    worksheet["H45"] = "=SUM(H14:H44)"
    worksheet["I45"] = "=SUM(I14:I44)"
    worksheet["J45"] = "=SUM(J14:J44)"
    worksheet["K45"] = "=SUM(K14:K44)"
    worksheet["L45"] = "=SUM(L14:L44)"

    worksheet["C47"] = "=H45+I45+J45+K45+L45"

    # -----------------------------
    # # Employee contact information
    # # -----------------------------
    # worksheet["F49"] = profile.phone
    # worksheet["F50"] = profile.mobile
    # worksheet["F51"] = profile.fax
    # worksheet["F52"] = user.email
    # worksheet["F53"] = "=F49+F52"

    # -----------------------------
    # Save generated workbook
    # -----------------------------
    temporary_file = NamedTemporaryFile(
        suffix=".xlsx",
        delete=False,
    )
    temporary_file.close()

    workbook.save(temporary_file.name)

    return temporary_file.name