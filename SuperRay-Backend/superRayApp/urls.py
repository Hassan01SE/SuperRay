from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    GoogleLogin,
    LogoutView,
    MyTokenObtainPairView,
    RegisterView,
    SuperResolutionAPI,
    chatres,
    createReport,
    getProfile,
    getReports,
    getSingleReport,
    updateProfile,
)

urlpatterns = [
    path("token/", MyTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("register/", RegisterView.as_view(), name="auth_register"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("google/", GoogleLogin.as_view(), name="google_login"),
    path("profile/", getProfile, name="profile"),
    path("profile/update/", updateProfile, name="update-profile"),
    path("reports", getReports, name="fetch reports"),
    path("reports/<int:report_id>/", getSingleReport, name="get-single-report"),
    path("save-report", createReport, name="create report"),
    path("super-resolution/", SuperResolutionAPI, name="Super Resolution Api"),
    path("chat/", chatres, name="chat"),
]
