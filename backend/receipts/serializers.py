from rest_framework import serializers

from expenses.models import Expense
from .models import Receipt


class ReceiptSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)

    expense = serializers.PrimaryKeyRelatedField(
        queryset=Expense.objects.all(),
    )

    class Meta:
        model = Receipt
        fields = [
            "id",
            "expense",
            "file",
            "original_filename",
            "uploaded_at",
        ]
        read_only_fields = [
            "id",
            "original_filename",
            "uploaded_at",
        ]

    def to_representation(self, instance):
        data = super().to_representation(instance)

        if instance.expense_id is not None:
            data["expense"] = str(instance.expense_id)

        return data

    def validate_file(self, value):
        allowed_types = {
            "application/pdf",
            "image/jpeg",
            "image/png",
        }

        max_size = 5 * 1024 * 1024

        if value.content_type not in allowed_types:
            raise serializers.ValidationError(
                "Only PDF, JPG, and PNG files are allowed."
            )

        if value.size > max_size:
            raise serializers.ValidationError(
                "Receipt file size cannot exceed 5 MB."
            )

        return value

    def create(self, validated_data):
        uploaded_file = validated_data["file"]

        validated_data["original_filename"] = uploaded_file.name

        return super().create(validated_data)