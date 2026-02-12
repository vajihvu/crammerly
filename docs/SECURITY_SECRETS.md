# Security & Secret Management Policy

This document defines how Crammerly manages credentials, API keys, and internal secrets to ensure zero-exposure and high rotation readiness.

## 🛡️ Core Rules
1. **Zero Logging**: No raw secrets (passwords, tokens, API keys) must ever appear in application logs or crash reports.
2. **Environment Only**: Secrets are never hardcoded. They are injected via validated environment variables.
3. **No Secrets in Frontend**: API keys meant for the backend (e.g., DeepSeek, Mongo URI) must never be prefixed with `VITE_` or included in the frontend build.
4. **Encryption at Rest**: Sensitive user data (passwords) is hashed using `bcrypt` (10+ rounds).

## 🔑 Secret Inventory

| Secret Name | Purpose | Severity | Rotation Window |
| :--- | :--- | :--- | :--- |
| `JWT_SECRET` | Signing authentication tokens | **CRITICAL** | 90 Days |
| `MONGO_URI` | Database access credentials | **HIGH** | On infrastructure change |
| `DEEPSEEK_API_KEY` | External AI service access | **MEDIUM** | 180 Days or if leaked |

## 🔄 Rotation Procedures

### 1. Rotating JWT_SECRET (Zero Downtime)
*Note: Rotating the JWT_SECRET will invalidate all existing access tokens immediately. Users will need to use their refresh tokens to get new ones.*

1. Generate a new 32+ character random string.
2. Update the environment variable on the server.
3. Restart the service (Graceful restart recommended).
4. Monitor logs for `AUTH_INVALID` spikes.

### 2. Rotating API Keys
1. Revoke the old key in the provider dashboard (e.g., DeepSeek console).
2. Generate a new key.
3. Update the backend `.env` file.
4. The system will auto-validate the new key on the next startup.

## 🔎 Accidental Logging Prevention
We use a centralized `errorHandler` and `auditMiddleware` that scrubs the following fields:
- `password`
- `refreshToken`
- `token`
- `authorization`
- `API_KEY`
- `SECRET`
