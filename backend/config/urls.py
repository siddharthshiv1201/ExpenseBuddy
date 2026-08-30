from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path("admin/", admin.site.urls),

    path("api/auth/", include("accounts.urls")),

    path(
        "api/auth/token/",
        TokenObtainPairView.as_view(),
        name="token-obtain",
    ),

    path(
        "api/auth/refresh/",
        TokenRefreshView.as_view(),
        name="token-refresh",
    ),

    path("api/receipts/", include("receipts.urls")),
    path("api/expenses/", include("expenses.urls")),
    path("api/reports/", include("monthly_reports.urls")),
]

urlpatterns += static(
    settings.MEDIA_URL,
    document_root=settings.MEDIA_ROOT,
)