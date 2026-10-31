import io
import os
import shutil
import subprocess
import sys
import tempfile
import time
from pathlib import Path
from unittest import mock

import jwt
import requests
from cryptography.hazmat.primitives.asymmetric import rsa
from django.core.cache import cache
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from django.urls import reverse
from PIL import Image
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken
from allauth.socialaccount.providers.oauth2.client import OAuth2Error

from . import functions
from .adapters import VerifiedGoogleOAuth2Adapter
from .functions import InferenceError, InferenceUnavailable, NotMedicalImage
from .models import CustomUser, Report

TEST_MEDIA_ROOT = tempfile.mkdtemp(prefix="superray-test-media-")


def image_upload(name="scan.png", fmt="PNG", size=(64, 64)):
    buffer = io.BytesIO()
    Image.new("RGB", size, color=(120, 120, 120)).save(buffer, format=fmt)
    return SimpleUploadedFile(name, buffer.getvalue(), content_type=f"image/{fmt.lower()}")


def make_user(username, **extra):
    return CustomUser.objects.create_user(
        username=username, email=f"{username}@example.com", password="Str0ng-pass-123", **extra
    )


@override_settings(
    MEDIA_ROOT=TEST_MEDIA_ROOT,
    STORAGES={
        "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
        "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"},
    },
)
class AuthenticatedTestCase(APITestCase):
    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        shutil.rmtree(TEST_MEDIA_ROOT, ignore_errors=True)

    def setUp(self):
        cache.clear()
        self.user = make_user("alice", phone_number="+923001234567", sex="F")
        self.other = make_user("mallory")

    def authenticate(self, user):
        token = RefreshToken.for_user(user).access_token
        self.client.credentials(HTTP_AUTHORIZATION=f"JWT {token}")

    def create_report(self, user, diagnose="Sample findings", domain="chest"):
        return Report.objects.create(user=user, diagnose=diagnose, domain=domain, image=image_upload())


class AccountTests(AuthenticatedTestCase):
    def test_register(self):
        data = {
            "username": "newuser",
            "email": "newuser@example.com",
            "password": "An0ther-pass-456",
            "password2": "An0ther-pass-456",
            "phone_number": "+923331112222",
            "sex": "O",
            "first_name": "New",
            "last_name": "User",
        }
        response = self.client.post(reverse("auth_register"), data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertNotIn("password", response.data)
        self.assertTrue(CustomUser.objects.get(username="newuser").check_password("An0ther-pass-456"))

    def test_register_rejects_mismatched_passwords_and_bad_phone(self):
        data = {
            "username": "x",
            "email": "x@example.com",
            "password": "An0ther-pass-456",
            "password2": "different-456",
            "phone_number": "not-a-phone",
            "sex": "M",
            "first_name": "X",
            "last_name": "Y",
        }
        response = self.client.post(reverse("auth_register"), data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("phone_number", response.data)

    def test_login_returns_token_pair_with_profile_claims(self):
        response = self.client.post(
            reverse("token_obtain_pair"), {"username": "alice", "password": "Str0ng-pass-123"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        claims = jwt.decode(response.data["access"], options={"verify_signature": False})
        self.assertEqual(claims["username"], "alice")
        self.assertIn("refresh", response.data)

    def test_login_rejects_wrong_password(self):
        response = self.client.post(reverse("token_obtain_pair"), {"username": "alice", "password": "nope"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_logout_blacklists_refresh_token(self):
        refresh = str(RefreshToken.for_user(self.user))
        response = self.client.post(reverse("logout"), {"refresh_token": refresh}, format="json")
        self.assertEqual(response.status_code, status.HTTP_205_RESET_CONTENT)
        response = self.client.post(reverse("token_refresh"), {"refresh": refresh}, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_logout_rejects_invalid_token(self):
        response = self.client.post(reverse("logout"), {"refresh_token": "garbage"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class ProfileTests(AuthenticatedTestCase):
    def test_profile_requires_authentication(self):
        self.assertEqual(self.client.get(reverse("profile")).status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_profile(self):
        self.authenticate(self.user)
        response = self.client.get(reverse("profile"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], "alice")

    def test_update_profile_cannot_change_identity_fields(self):
        self.authenticate(self.user)
        response = self.client.put(
            reverse("update-profile"),
            {"first_name": "Updated", "username": "admin", "email": "admin@example.com"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, "Updated")
        self.assertEqual(self.user.username, "alice")
        self.assertEqual(self.user.email, "alice@example.com")

    def test_update_profile_returns_400_for_invalid_data(self):
        self.authenticate(self.user)
        response = self.client.put(reverse("update-profile"), {"phone_number": "abc"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class ReportTests(AuthenticatedTestCase):
    def test_reports_require_authentication(self):
        self.assertEqual(self.client.get(reverse("fetch reports")).status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_only_returns_own_reports_with_absolute_image_urls(self):
        own = self.create_report(self.user)
        self.create_report(self.other)
        self.authenticate(self.user)
        response = self.client.get(reverse("fetch reports"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual([r["id"] for r in response.data], [own.id])
        self.assertTrue(response.data[0]["image"].startswith("http://testserver/media/reports/images/"))

    def test_cannot_read_another_users_report(self):
        report = self.create_report(self.other)
        self.authenticate(self.user)
        response = self.client.get(reverse("get-single-report", args=[report.id]))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_create_report(self):
        self.authenticate(self.user)
        response = self.client.post(
            reverse("create report"),
            {"diagnose": "Findings text", "domain": "chest", "image": image_upload("image.jpg", "JPEG")},
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Report.objects.get(id=response.data["id"]).user, self.user)

    def test_create_report_rejects_non_image(self):
        self.authenticate(self.user)
        fake = SimpleUploadedFile("scan.png", b"not an image", content_type="image/png")
        response = self.client.post(
            reverse("create report"), {"diagnose": "x", "domain": "chest", "image": fake}, format="multipart"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_report_rejects_unsupported_format(self):
        self.authenticate(self.user)
        response = self.client.post(
            reverse("create report"),
            {"diagnose": "x", "domain": "chest", "image": image_upload("scan.gif", "GIF")},
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class SuperResolutionTests(AuthenticatedTestCase):
    url = reverse("Super Resolution Api")

    def post_image(self, upload=None):
        return self.client.post(self.url, {"image": upload or image_upload()}, format="multipart")

    def test_missing_image(self):
        self.assertEqual(self.client.post(self.url, {}, format="multipart").status_code, status.HTTP_400_BAD_REQUEST)

    @override_settings(INFERENCE_SERVICE_URL="")
    def test_returns_503_when_inference_not_configured(self):
        response = self.post_image()
        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        self.assertEqual(response.data["code"], "inference_unavailable")

    @override_settings(MAX_UPLOAD_SIZE_MB=0)
    def test_rejects_oversized_upload(self):
        response = self.post_image()
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_success_for_anonymous_user(self):
        result = {"domain": "chest", "report": "Model text", "upscaled_image": Image.new("RGB", (128, 128))}
        with mock.patch("superRayApp.views.generate_report", return_value=result):
            response = self.post_image()
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["domain"], "chest")
        self.assertEqual(response.data["xreport"], "Model text")
        self.assertTrue(response.data["image"])

    def test_non_medical_image(self):
        with mock.patch("superRayApp.views.generate_report", side_effect=NotMedicalImage):
            response = self.post_image()
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data["code"], "not_medical_image")

    def test_upstream_error_is_not_leaked(self):
        with mock.patch("superRayApp.views.generate_report", side_effect=InferenceError("secret detail")):
            response = self.post_image()
        self.assertEqual(response.status_code, status.HTTP_502_BAD_GATEWAY)
        self.assertNotIn("secret detail", str(response.data))

    def test_anonymous_requests_are_throttled(self):
        with mock.patch("superRayApp.views.generate_report", side_effect=InferenceUnavailable):
            codes = [self.post_image().status_code for _ in range(11)]
        self.assertEqual(codes[-1], status.HTTP_429_TOO_MANY_REQUESTS)


class ChatTests(AuthenticatedTestCase):
    url = reverse("chat")

    def test_requires_authentication(self):
        report = self.create_report(self.user)
        response = self.client.post(self.url, {"report_id": report.id, "prompt": "hi"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_cannot_chat_about_another_users_report(self):
        report = self.create_report(self.other)
        self.authenticate(self.user)
        with mock.patch("superRayApp.views.historic_chat") as chat:
            response = self.client.post(self.url, {"report_id": report.id, "prompt": "hi"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        chat.assert_not_called()

    def test_first_message_sends_image_and_stored_report(self):
        report = self.create_report(self.user, diagnose="Stored findings")
        self.authenticate(self.user)
        with mock.patch("superRayApp.views.historic_chat", return_value="Answer") as chat:
            response = self.client.post(
                self.url, {"report_id": report.id, "prompt": "Is it serious?", "ack_client": 0}, format="json"
            )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {"response": "Answer", "ack": 1})
        image, prompt, report_text = chat.call_args.args
        self.assertIsNotNone(image)
        self.assertEqual(report_text, "Stored findings")

    def test_follow_up_message_omits_image(self):
        report = self.create_report(self.user)
        self.authenticate(self.user)
        with mock.patch("superRayApp.views.historic_chat", return_value="Answer") as chat:
            response = self.client.post(
                self.url, {"report_id": report.id, "prompt": "And then?", "ack_client": 1}, format="json"
            )
        self.assertEqual(response.data["ack"], 0)
        self.assertIsNone(chat.call_args.args[0])

    def test_rejects_empty_prompt(self):
        report = self.create_report(self.user)
        self.authenticate(self.user)
        response = self.client.post(self.url, {"report_id": report.id, "prompt": " "}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    @override_settings(INFERENCE_SERVICE_URL="")
    def test_returns_503_when_inference_not_configured(self):
        report = self.create_report(self.user)
        self.authenticate(self.user)
        response = self.client.post(self.url, {"report_id": report.id, "prompt": "hi"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)


@override_settings(INFERENCE_SERVICE_URL="https://inference.example.test/process_json")
class InferenceClientTests(TestCase):
    def fake_response(self, status_code, payload=None):
        response = mock.Mock(status_code=status_code)
        response.json.return_value = payload
        return response

    def test_connection_failure(self):
        with mock.patch.object(functions.requests, "post", side_effect=requests.ConnectionError):
            with self.assertRaises(InferenceUnavailable):
                functions.generate_report(Image.new("RGB", (8, 8)))

    def test_http_400_means_not_medical(self):
        with mock.patch.object(functions.requests, "post", return_value=self.fake_response(400)):
            with self.assertRaises(NotMedicalImage):
                functions.generate_report(Image.new("RGB", (8, 8)))

    def test_incomplete_payload(self):
        with mock.patch.object(functions.requests, "post", return_value=self.fake_response(200, {"domain": "chest"})):
            with self.assertRaises(InferenceError):
                functions.generate_report(Image.new("RGB", (8, 8)))

    def test_request_uses_timeout(self):
        with mock.patch.object(functions.requests, "post", side_effect=requests.Timeout) as post:
            with self.assertRaises(InferenceUnavailable):
                functions.historic_chat(None, "hi", "report")
        self.assertIn("timeout", post.call_args.kwargs)


class GoogleIdTokenTests(TestCase):
    client_id = "test-client.apps.googleusercontent.com"

    def setUp(self):
        self.private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
        self.adapter = VerifiedGoogleOAuth2Adapter.__new__(VerifiedGoogleOAuth2Adapter)
        self.app = mock.Mock(client_id=self.client_id)
        signing_key = mock.Mock(key=self.private_key.public_key())
        patcher = mock.patch("superRayApp.adapters._jwks_client")
        self.jwks = patcher.start()
        self.jwks.get_signing_key_from_jwt.return_value = signing_key
        self.addCleanup(patcher.stop)

    def claims(self, **overrides):
        claims = {
            "iss": "https://accounts.google.com",
            "aud": self.client_id,
            "sub": "1234567890",
            "email": "alice@example.com",
            "exp": int(time.time()) + 300,
        }
        claims.update(overrides)
        return claims

    def complete(self, token):
        with mock.patch.object(VerifiedGoogleOAuth2Adapter, "get_provider") as provider:
            provider.return_value.sociallogin_from_response.return_value = "login"
            return self.adapter.complete_login(None, self.app, None, {"id_token": token})

    def test_accepts_token_signed_by_google_key(self):
        token = jwt.encode(self.claims(), self.private_key, algorithm="RS256")
        self.assertEqual(self.complete(token), "login")

    def test_rejects_unsigned_token(self):
        token = jwt.encode(self.claims(), None, algorithm="none")
        with self.assertRaises(OAuth2Error):
            self.complete(token)

    def test_rejects_token_signed_with_other_key(self):
        other_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
        token = jwt.encode(self.claims(), other_key, algorithm="RS256")
        with self.assertRaises(OAuth2Error):
            self.complete(token)

    def test_rejects_wrong_audience_and_issuer(self):
        for claims in (self.claims(aud="someone-else"), self.claims(iss="https://evil.example")):
            token = jwt.encode(claims, self.private_key, algorithm="RS256")
            with self.assertRaises(OAuth2Error):
                self.complete(token)


class SettingsTests(TestCase):
    def test_production_requires_secret_key(self):
        # empty values also override a local .env
        env = {**os.environ, "DJANGO_SECRET_KEY": "", "DJANGO_DEBUG": "false"}
        result = subprocess.run(
            [sys.executable, "-c", "import superray.settings"],
            cwd=Path(__file__).resolve().parent.parent,
            env=env,
            capture_output=True,
            text=True,
        )
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("DJANGO_SECRET_KEY", result.stderr)
