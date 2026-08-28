from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Profile, User


class AccountAPITests(APITestCase):
    def setUp(self):
        self.register_url = "/api/auth/register/"
        self.login_url = "/api/auth/login/"
        self.me_url = "/api/auth/me/"
        self.refresh_url = "/api/auth/refresh/"

        self.user_data = {
            "email": "employee@example.com",
            "password": "TestPassword123!",
            "profile": {
                "first_name": "Test",
                "last_name": "Employee",
                "phone": "9876543210",
                "fax": "0111234567",
                "designation": "Employee",
                "department": "Sales",
                "state": "Delhi",
                "headquarters": "New Delhi",
                "reporting_to": "Sales Manager",
            },
        }

    def test_register_user_with_profile(self):
        response = self.client.post(
            self.register_url,
            self.user_data,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        user = User.objects.get(
            email="employee@example.com",
        )

        self.assertTrue(
            Profile.objects.filter(
                user=user,
            ).exists()
        )

        profile = user.profile

        self.assertEqual(
            profile.first_name,
            "Test",
        )

        self.assertEqual(
            profile.phone,
            "9876543210",
        )

    def test_login_returns_access_and_refresh_tokens(self):
        User.objects.create_user(
            email=self.user_data["email"],
            password=self.user_data["password"],
        )

        response = self.client.post(
            self.login_url,
            {
                "email": self.user_data["email"],
                "password": self.user_data["password"],
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertIn(
            "access",
            response.data,
        )

        self.assertIn(
            "refresh",
            response.data,
        )

        self.assertIn(
            "user",
            response.data,
        )

    def test_invalid_login_is_rejected(self):
        User.objects.create_user(
            email=self.user_data["email"],
            password=self.user_data["password"],
        )

        response = self.client.post(
            self.login_url,
            {
                "email": self.user_data["email"],
                "password": "WrongPassword123!",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_me_requires_authentication(self):
        response = self.client.get(
            self.me_url,
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_me_returns_current_user_and_profile(self):
        user = User.objects.create_user(
            email=self.user_data["email"],
            password=self.user_data["password"],
        )

        Profile.objects.create(
            user=user,
            first_name="Test",
            last_name="Employee",
            phone="9876543210",
            fax="0111234567",
            designation="Employee",
            department="Sales",
            state="Delhi",
            headquarters="New Delhi",
            reporting_to="Sales Manager",
        )

        self.client.force_authenticate(
            user=user,
        )

        response = self.client.get(
            self.me_url,
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data["email"],
            "employee@example.com",
        )

        self.assertEqual(
            response.data["profile"]["phone"],
            "9876543210",
        )

        self.assertEqual(
            response.data["profile"]["fax"],
            "0111234567",
        )

    def test_refresh_token_returns_new_access_token(self):
        User.objects.create_user(
            email=self.user_data["email"],
            password=self.user_data["password"],
        )

        login_response = self.client.post(
            self.login_url,
            {
                "email": self.user_data["email"],
                "password": self.user_data["password"],
            },
            format="json",
        )

        self.assertEqual(
            login_response.status_code,
            status.HTTP_200_OK,
        )

        refresh_token = login_response.data["refresh"]

        response = self.client.post(
            self.refresh_url,
            {
                "refresh": refresh_token,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertIn(
            "access",
            response.data,
        )

    def test_registration_requires_valid_password(self):
        data = {
            "email": "employee@example.com",
            "password": "123",
            "profile": {
                "first_name": "Test",
                "last_name": "Employee",
            },
        }

        response = self.client.post(
            self.register_url,
            data,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )