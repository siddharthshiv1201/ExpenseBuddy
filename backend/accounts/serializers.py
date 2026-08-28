from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from rest_framework import serializers

from .models import Profile, User


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = [
            "first_name",
            "last_name",
            "phone",
            "fax",
            "designation",
            "department",
            "state",
            "headquarters",
            "reporting_to",
            "joining_date",
            "profile_photo",
            "address",
        ]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        min_length=8,
    )

    profile = ProfileSerializer()

    class Meta:
        model = User
        fields = [
            "email",
            "password",
            "profile",
        ]

    def validate_password(self, value):
        validate_password(value)
        return value

    @transaction.atomic
    def create(self, validated_data):
        profile_data = validated_data.pop("profile")

        user = User.objects.create_user(
            email=validated_data["email"],
            password=validated_data["password"],
        )

        Profile.objects.create(
            user=user,
            **profile_data,
        )

        return user


class UserSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)

    profile = ProfileSerializer()

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "is_active",
            "created_at",
            "updated_at",
            "profile",
        ]
        read_only_fields = [
            "id",
            "email",
            "is_active",
            "created_at",
            "updated_at",
        ]

    def update(self, instance, validated_data):
        profile_data = validated_data.pop("profile", None)

        instance = super().update(instance, validated_data)

        if profile_data:
            Profile.objects.update_or_create(
                user=instance,
                defaults=profile_data,
            )

        return instance