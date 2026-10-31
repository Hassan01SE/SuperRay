import base64
import io
import logging

import requests
from django.conf import settings
from PIL import Image

logger = logging.getLogger(__name__)


class InferenceUnavailable(Exception):
    pass


class InferenceError(Exception):
    pass


class NotMedicalImage(Exception):
    pass


def _encode_image(image):
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    return base64.b64encode(buffer.getvalue()).decode("utf-8")


def _post(payload):
    url = settings.INFERENCE_SERVICE_URL
    if not url:
        raise InferenceUnavailable("INFERENCE_SERVICE_URL is not configured.")
    try:
        return requests.post(url, json=payload, timeout=settings.INFERENCE_TIMEOUT_SECONDS)
    except requests.exceptions.RequestException as exc:
        logger.warning("Inference service request failed: %s", type(exc).__name__)
        raise InferenceUnavailable("The inference service could not be reached.") from exc


def _json(response):
    try:
        return response.json()
    except ValueError as exc:
        raise InferenceError("The inference service returned invalid JSON.") from exc


def generate_report(image):
    response = _post({"image": _encode_image(image), "options": "ganllm"})

    # 400 means the image is not a medical image
    if response.status_code == 400:
        raise NotMedicalImage()
    if response.status_code != 200:
        logger.warning("Inference service returned HTTP %s", response.status_code)
        raise InferenceError(f"The inference service returned HTTP {response.status_code}.")

    data = _json(response)
    try:
        upscaled_image = Image.open(io.BytesIO(base64.b64decode(data["upscaled_image"])))
        result = {
            "domain": data["domain"],
            "report": data["response"],
            "upscaled_image": upscaled_image,
        }
    except (KeyError, TypeError, ValueError, OSError) as exc:
        raise InferenceError("The inference service response was incomplete.") from exc

    if result["domain"] == "chest":
        result["differential_diagnosis"] = data.get("diff_diag")
    return result


def historic_chat(image, prompt, report):
    payload = {
        "image": _encode_image(image) if image is not None else None,
        "options": "historic",
        "new": image is not None,
        "report": report,
        "prompt": prompt,
    }
    response = _post(payload)
    if response.status_code != 200:
        logger.warning("Inference chat returned HTTP %s", response.status_code)
        raise InferenceError(f"The inference service returned HTTP {response.status_code}.")

    answer = _json(response).get("response")
    if not answer:
        raise InferenceError("The inference service returned an empty answer.")
    return answer
