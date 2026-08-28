from django.conf import settings
from django.db import models


class Expense(models.Model):
    class Category(models.TextChoices):
        TRAVEL = "TRAVEL", "Travel"
        MEALS = "MEALS", "Meals"
        ACCOMMODATION = "ACCOMMODATION", "Accommodation"
        OFFICE = "OFFICE", "Office"
        TRANSPORT = "TRANSPORT", "Transport"
        OTHER = "OTHER", "Other"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="expenses",
    )

    expense_date = models.DateField()

    category = models.CharField(
        max_length=30,
        choices=Category.choices,
    )

    from_location = models.CharField(
        max_length=150,
        blank=True,
    )

    to_location = models.CharField(
        max_length=150,
        blank=True,
    )

    distance_km = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
    )

    mode_of_conveyance = models.CharField(
        max_length=100,
        blank=True,
    )

    departure_time = models.TimeField(
        null=True,
        blank=True,
    )

    arrival_time = models.TimeField(
        null=True,
        blank=True,
    )

    fare = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
    )

    stay = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
    )

    food = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
    )

    da = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
    )

    miscellaneous_1 = models.DecimalField(
    max_digits=12,
    decimal_places=2,
    default=0,
)

    miscellaneous_2 = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
    )

    description = models.TextField(
        blank=True,
    )

    remarks = models.TextField(
        blank=True,
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-expense_date", "-created_at"]

    def __str__(self):
        return f"{self.user.email} - {self.expense_date} - {self.category}"