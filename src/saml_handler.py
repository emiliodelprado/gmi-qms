import urllib.parse
"""
SAML 2.0 authentication via OneLogin (python3-saml).

Environment variables required:
  ONELOGIN_SP_ENTITY_ID      – e.g. https://app.gmiberia.com
  ONELOGIN_SP_ACS_URL        – e.g. https://app.gmiberia.com/auth/saml/callback
  ONELOGIN_IDP_ENTITY_ID     – copied from OneLogin app XML
  ONELOGIN_IDP_SSO_URL       – copied from OneLogin app XML
  ONELOGIN_IDP_CERT          – PEM cert (single line, no headers)
  SESSION_SECRET             – random 32-char string for signing session tokens
"""
import os, json, hmac, hashlib, base64, time
from fastapi import Request, HTTPException
from onelogin.saml2.auth import OneLogin_Saml2_Auth
from onelogin.saml2.settings import OneLogin_Saml2_Settings

SESSION_SECRET = os.environ.get("SESSION_SECRET", "change-me-in-production")


def _saml_settings() -> dict:
    return {
        "strict": False,
        "debug": True,
        "sp": {
            "entityId": os.environ["ONELOGIN_SP_ENTITY_ID"],
            "assertionConsumerService": {
                "url": os.environ["ONELOGIN_SP_ACS_URL"],
                "binding": "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST",
            },
            "NameIDFormat": "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress",
        },
        "idp": {
            "entityId": os.environ["ONELOGIN_IDP_ENTITY_ID"],
            "singleSignOnService": {
                "url": os.environ["ONELOGIN_IDP_SSO_URL"],
                "binding": "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect",
            },
            "x509cert": os.environ["ONELOGIN_IDP_CERT"],
        },
    }


def _prepare_request(request: Request, body: bytes) -> dict:
    """Convert FastAPI request into the dict python3-saml expects."""
    return {
        "https": "on" if request.url.scheme == "https" else "off",
        "http_host": request.headers.get("host", ""),
        "server_port": request.url.port or (443 if request.url.scheme == "https" else 80),
        "script_name": "/auth/login",
        "get_data": dict(request.query_params),
        "post_data": dict(urllib.parse.parse_qsl(body.decode("utf-8"))),
    }


async def process_saml_response(request: Request) -> str:
    """Validate SAMLResponse and return a signed session token."""
    body = await request.body()
    req  = _prepare_request(request, body)
    auth = OneLogin_Saml2_Auth(req, _saml_settings())
    auth.process_response()

    errors = auth.get_errors()
    if errors:
        raise HTTPException(status_code=401, detail=f"SAML error: {errors} — reason: {auth.get_last_error_reason()}")

    if not auth.is_authenticated():
        raise HTTPException(status_code=401, detail="SAML authentication failed")

    attributes = auth.get_attributes()
    user_data  = {
        "user_id": auth.get_nameid(),
        "email":   auth.get_nameid(),
        "name":    ((_attr(attributes, ["displayName"]) + " " + _attr(attributes, ["lastName"])).strip()),
        "roles":   attributes.get("roles", attributes.get("memberOf", [])),
        "exp":     int(time.time()) + 28800,  # 8 h
    }
    return _sign_token(user_data)


def _attr(attrs: dict, keys: list, default: str = "") -> str:
    for k in keys:
        v = attrs.get(k)
        if v:
            return v[0] if isinstance(v, list) else v
    return default


def _sign_token(payload: dict) -> str:
    data    = base64.b64encode(json.dumps(payload).encode()).decode()
    sig     = hmac.new(SESSION_SECRET.encode(), data.encode(), hashlib.sha256).hexdigest()
    return f"{data}.{sig}"


def verify_session_token(token: str) -> dict:
    try:
        data, sig = token.rsplit(".", 1)
        expected  = hmac.new(SESSION_SECRET.encode(), data.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(sig, expected):
            raise ValueError("Bad signature")
        payload = json.loads(base64.b64decode(data).decode())
        if payload["exp"] < time.time():
            raise ValueError("Token expired")
        return payload
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid session: {e}")


def get_sp_metadata() -> str:
    settings = OneLogin_Saml2_Settings(_saml_settings(), sp_validation_only=True)
    return settings.get_sp_metadata()


def get_saml_auth(request: Request) -> OneLogin_Saml2_Auth:
    """Crea instancia de auth SAML para iniciar el flujo de login."""
    req = {
        "https": "on",
        "http_host": request.headers.get("host", "app.gmiberia.com"),
        "server_port": 443,
        "script_name": "/auth/login",
        "get_data": dict(request.query_params),
        "post_data": {},
    }
    return OneLogin_Saml2_Auth(req, _saml_settings())
