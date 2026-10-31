import jwt
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Error

GOOGLE_CERTS_URL = "https://www.googleapis.com/oauth2/v3/certs"
GOOGLE_ISSUERS = ("https://accounts.google.com", "accounts.google.com")

_jwks_client = jwt.PyJWKClient(GOOGLE_CERTS_URL, cache_keys=True)


class VerifiedGoogleOAuth2Adapter(GoogleOAuth2Adapter):
    # allauth 0.52 skips the signature check, which is unsafe when the id_token comes from the client

    def complete_login(self, request, app, token, response, **kwargs):
        id_token = response.get("id_token") if isinstance(response, dict) else None
        if not id_token:
            raise OAuth2Error("Missing id_token")
        try:
            signing_key = _jwks_client.get_signing_key_from_jwt(id_token)
            identity_data = jwt.decode(
                id_token,
                signing_key.key,
                algorithms=["RS256"],
                audience=app.client_id,
                options={"require": ["exp", "iss", "aud", "sub"]},
            )
        except jwt.PyJWTError as exc:
            raise OAuth2Error("Invalid id_token") from exc
        if identity_data["iss"] not in GOOGLE_ISSUERS:
            raise OAuth2Error("Invalid id_token issuer")
        return self.get_provider().sociallogin_from_response(request, identity_data)
