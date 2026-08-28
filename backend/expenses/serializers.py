from rest_framework import serializers

from .models import Expense


class ExpenseSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)

    user = serializers.CharField(
        source="user.email",
        read_only=True,
    )

    class Meta:
        model = Expense
        fields = [
            "id",
            "user",
            "expense_date",
            "category",
            "from_location",
            "to_location",
            "distance_km",
            "mode_of_conveyance",
            "departure_time",
            "arrival_time",
            "fare",
            "stay",
            "food",
            "da",
            "miscellaneous_1",
            "miscellaneous_2",
            "description",
            "remarks",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "user",
            "created_at",
            "updated_at",
        ]