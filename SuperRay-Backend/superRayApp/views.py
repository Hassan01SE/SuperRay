import base64
import io
import logging

from dj_rest_auth.registration.views import SocialLoginView
from PIL import Image
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.serializers import ValidationError
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from .adapters import VerifiedGoogleOAuth2Adapter
from .functions import InferenceError, InferenceUnavailable, NotMedicalImage, generate_report, historic_chat
from .models import CustomUser, Report
from .serializers import (
    MyTokenObtainPairSerializer,
    ProfileSerializer,
    ProfileUpdateSerializer,
    RegisterSerializer,
    ReportSerializer,
    open_validated_image,
)

logger = logging.getLogger(__name__)

MAX_CHAT_PROMPT_LENGTH = 2000


class InferenceAnonThrottle(AnonRateThrottle):
    scope = "inference_anon"


class InferenceUserThrottle(UserRateThrottle):
    scope = "inference_user"


def inference_unavailable_response():
    return Response(
        {"error": "The AI inference service is currently unavailable.", "code": "inference_unavailable"},
        status=status.HTTP_503_SERVICE_UNAVAILABLE,
    )


def inference_error_response():
    return Response(
        {"error": "The AI inference service returned an unexpected response.", "code": "inference_error"},
        status=status.HTTP_502_BAD_GATEWAY,
    )


class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer


class RegisterView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer


class LogoutView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            RefreshToken(request.data.get("refresh_token")).blacklist()
        except TokenError:
            return Response({"error": "Invalid refresh token."}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"message": "Successfully logged out."}, status=status.HTTP_205_RESET_CONTENT)


@api_view(["GET"])
def getProfile(request):
    return Response(ProfileSerializer(request.user, context={"request": request}).data)


@api_view(["PUT"])
def updateProfile(request):
    serializer = ProfileUpdateSerializer(request.user, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(ProfileSerializer(request.user, context={"request": request}).data)


@api_view(["GET"])
def getReports(request):
    reports = Report.objects.filter(user=request.user).order_by("-date")
    return Response(ReportSerializer(reports, many=True, context={"request": request}).data)


@api_view(["GET"])
def getSingleReport(request, report_id):
    try:
        report = Report.objects.get(id=report_id, user=request.user)
    except Report.DoesNotExist:
        return Response({"error": "Report not found"}, status=status.HTTP_404_NOT_FOUND)
    return Response(ReportSerializer(report, context={"request": request}).data)


@api_view(["POST"])
def createReport(request):
    serializer = ReportSerializer(data=request.data, context={"request": request})
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([InferenceAnonThrottle, InferenceUserThrottle])
def SuperResolutionAPI(request):
    upload = request.FILES.get("image")
    if not upload:
        return Response({"error": "Image file is required."}, status=status.HTTP_400_BAD_REQUEST)
    try:
        image = open_validated_image(upload)
    except ValidationError as exc:
        return Response({"error": exc.detail[0]}, status=status.HTTP_400_BAD_REQUEST)

    try:
        result = generate_report(image)
    except NotMedicalImage:
        return Response(
            {"error": "Only medical images are supported.", "code": "not_medical_image"},
            status=status.HTTP_403_FORBIDDEN,
        )
    except InferenceUnavailable:
        return inference_unavailable_response()
    except InferenceError:
        logger.exception("Super-resolution inference failed")
        return inference_error_response()

    buffer = io.BytesIO()
    result["upscaled_image"].convert("RGB").save(buffer, format="JPEG")
    return Response(
        {
            "image": base64.b64encode(buffer.getvalue()).decode("utf-8"),
            "xreport": result["report"],
            "domain": result["domain"],
        }
    )


@api_view(["POST"])
@throttle_classes([InferenceUserThrottle])
def chatres(request):
    prompt = (request.data.get("prompt") or "").strip()
    if not prompt:
        return Response({"error": "A prompt is required."}, status=status.HTTP_400_BAD_REQUEST)
    if len(prompt) > MAX_CHAT_PROMPT_LENGTH:
        return Response({"error": "The prompt is too long."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        report = Report.objects.get(id=int(request.data.get("report_id")), user=request.user)
    except (TypeError, ValueError, Report.DoesNotExist):
        return Response({"error": "Report not found"}, status=status.HTTP_404_NOT_FOUND)

    # the image only goes with the first message (ack_client=0)
    first_message = str(request.data.get("ack_client", "0")) != "1"
    image = None
    if first_message and report.image:
        try:
            with report.image.open("rb") as stored:
                image = Image.open(io.BytesIO(stored.read())).convert("RGB")
        except OSError:
            logger.exception("Could not read image for report %s", report.id)
            return Response({"error": "The report image could not be loaded."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    try:
        answer = historic_chat(image, prompt, report.diagnose)
    except InferenceUnavailable:
        return inference_unavailable_response()
    except InferenceError:
        logger.exception("Chat inference failed")
        return inference_error_response()

    return Response({"response": answer, "ack": 1 if first_message else 0}, status=status.HTTP_200_OK)


class GoogleLogin(SocialLoginView):
    adapter_class = VerifiedGoogleOAuth2Adapter

    def get_response(self):
        original_response = super().get_response()
        user = self.user
        refresh = RefreshToken.for_user(user)
        original_response.data.update(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": {"pk": user.pk, "username": user.username, "email": user.email},
            }
        )
        return original_response
