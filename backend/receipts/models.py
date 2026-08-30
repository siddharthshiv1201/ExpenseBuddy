from django.db import models
from cloudinary_storage.storage import MediaCloudinaryStorage


class Receipt(models.Model):
    expense = models.ForeignKey(
        "expenses.Expense",
        on_delete=models.CASCADE,
        related_name="receipts",
    )

    file = models.FileField(
        upload_to="receipts/%Y/%m/",
        storage=MediaCloudinaryStorage(),
    )

    original_filename = models.CharField(
        max_length=255,
    )

    uploaded_at = models.DateTimeField(
        auto_now_add=True,
    )

    def __str__(self):
        return self.original_filename