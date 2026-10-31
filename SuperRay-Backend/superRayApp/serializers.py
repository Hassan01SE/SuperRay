from django.conf import settings
from django.contrib.auth.password_validation import validate_password
from PIL import Image, UnidentifiedImageError
from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import CustomUser, Report

ALLOWED_IMAGE_FORMATS = {"JPEG", "PNG"}
MAX_IMAGE_PIXELS = 50_000_000


def open_validated_image(upload):
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if upload.size > max_bytes:
        raise serializers.ValidationError(f"Image must be {settings.MAX_UPLOAD_SIZE_MB} MB or smaller.")
    try:
        image = Image.open(upload)
        if image.format not in ALLOWED_IMAGE_FORMATS:
            raise serializers.ValidationError("Only JPEG and PNG images are supported.")
        if image.width * image.height > MAX_IMAGE_PIXELS:
            raise serializers.ValidationError("Image dimensions are too large.")
        image.load()
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError) as exc:
        raise serializers.ValidationError("The file is not a valid image.") from exc
    finally:
        upload.seek(0)
    return image.convert("RGB")


class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["username"] = user.username
        token["email"] = user.email
        token["first_name"] = user.first_name
        token["last_name"] = user.last_name
        return token


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)
    email = serializers.EmailField(required=True, validators=[UniqueValidator(queryset=CustomUser.objects.all())])
    phone_number = serializers.RegexField(CustomUser.PHONE_NUMBER_REGEX, max_length=17, required=True)
    sex = serializers.ChoiceField(choices=CustomUser.SEX_CHOICES, required=True)
    first_name = serializers.CharField(required=True)
    last_name = serializers.CharField(required=True)

    class Meta:
        model = CustomUser
        fields = ("username", "email", "password", "password2", "phone_number", "sex", "first_name", "last_name")

    def validate(self, attrs):
        if attrs["password"] != attrs["password2"]:
            raise serializers.ValidationError({"password2": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop("password2")
        password = validated_data.pop("password")
        user = CustomUser(**validated_data)
        user.set_password(password)
        user.save()
        return user


class ReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = ["id", "date", "user", "diagnose", "image", "domain"]
        read_only_fields = ["user"]

    def validate_image(self, upload):
        open_validated_image(upload)
        return upload

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)


class ProfileSerializer(serializers.ModelSerializer):
    reports = ReportSerializer(many=True, read_only=True)

    class Meta:
        model = CustomUser
        fields = ("username", "date_joined", "first_name", "last_name", "email", "phone_number", "sex", "reports")
        read_only_fields = fields


class ProfileUpdateSerializer(serializers.ModelSerializer):
    phone_number = serializers.RegexField(CustomUser.PHONE_NUMBER_REGEX, max_length=17, required=False, allow_blank=True)

    class Meta:
        model = CustomUser
        fields = ("first_name", "last_name", "phone_number", "sex")
