# Plan de pruebas – Autenticación GMI QMS
**Entorno:** https://qms.gmiberia.com

---

## Autenticación local

| # | Descripción | URL / Acción |
|---|-------------|--------------|
| 1 | Login correcto | `GET https://qms.gmiberia.com/login` → formulario → credenciales válidas → redirige a `/home` |
| 2 | Password incorrecta | `GET https://qms.gmiberia.com/login` → formulario → password errónea → mensaje de error, sin cookie |
| 3 | Email no existe | `GET https://qms.gmiberia.com/login` → formulario → email desconocido → mensaje de error |
| 4 | Logout | Botón logout en la app → `POST https://qms.gmiberia.com/auth/logout` → cookie borrada → redirige a `/login` |
| 5 | Acceso sin sesión | `GET https://qms.gmiberia.com/` → redirige a `/login` |

---

## Autenticación SAML (OneLogin)

| # | Descripción | URL / Acción |
|---|-------------|--------------|
| 6 | Inicio flujo SAML | `GET https://qms.gmiberia.com/auth/login` → redirige a `https://gmspain.onelogin.com/...` |
| 7 | Login SAML con usuario en BD | OneLogin → credenciales válidas + usuario en `user_access` con tenant → redirige a `/home` con sesión activa |
| 8 | Login SAML con usuario **sin** `user_access` | OneLogin → credenciales válidas + email **no** en BD → `403 No tienes acceso a esta aplicación` |
| 9 | Login SAML con usuario sin tenant | OneLogin → credenciales válidas + usuario en BD **sin** fila en `user_tenants` → `403 Sin acceso asignado a ninguna entidad` |
| 10 | Logout tras sesión SAML | Botón logout → `POST https://qms.gmiberia.com/auth/logout` → cookie borrada → redirige a `/login` |

---

## Casos mixtos

| # | Descripción | URL / Acción |
|---|-------------|--------------|
| 11 | Mismo email en local y SAML | `https://qms.gmiberia.com/login` (local) y `https://qms.gmiberia.com/auth/login` (SAML) → ambos establecen sesión válida para el mismo usuario |
| 12 | Metadatos SP | `GET https://qms.gmiberia.com/auth/saml/metadata` → respuesta XML con entity ID `https://qms.gmiberia.com` y ACS URL `https://qms.gmiberia.com/auth/saml/callback` |

---

## Endpoints de referencia

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/login` | GET | Página de login local |
| `/auth/local/login` | POST | Validación email + password |
| `/auth/login` | GET | Inicio flujo SAML → redirect a OneLogin |
| `/auth/saml/callback` | POST | ACS – recibe SAMLResponse de OneLogin |
| `/auth/saml/metadata` | GET | Metadatos SP en XML |
| `/auth/logout` | POST | Cierra sesión (borra cookie) |
| `/auth/me` | GET | Devuelve datos del usuario autenticado |
