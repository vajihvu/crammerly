# 🚀 Crammerly DevOps & Deployment Guide

This document outlines the architecture, security gates, and deployment procedures for the Crammerly Production Environment.

## 🏗️ Architecture Overview
- **Frontend**: Vite Single Page Application (Served via Vercel/Netlify).
- **Backend**: Node.js 22 (ESM) / Express 5.
- **Micro-services**:
  - **Database**: MongoDB (Persistence).
  - **Cache/Rate Limiting**: Redis (Session & Rate Limit Store).
  - **Observability**: Sentry (Error Tracking & Performance profiling).

---

## 🛡️ CI/CD Quality Gates
The pipeline in `.github/workflows/ci.yml` is **strictly enforced**. A deployment *cannot* occur unless the following gates pass:

1.  **🎨 Linting**: Standard JS/Vite linting.
2.  **🧪 Testing**: Full Jest suite (requires Mongo/Redis service containers).
3.  **🛡️ Security Audit**: 
    - `npm audit`: Fails on high/critical vulnerabilities.
    - `security_guard.js`: Generates SBOM (`bom.json`) and verifies dependency integrity.
4.  **🏗️ Image Build**: Multi-stage Docker build optimized for lean production (Node 22-Alpine).

---

## 🔑 Environment Variables (Production)

| Variable | Description | Security Requirement |
| :--- | :--- | :--- |
| `NODE_ENV` | Must be set to `production` | Enables CSRF & CSP hardening. |
| `PORT` | Backend listen port | Default: `5000`. |
| `MONGO_URI` | Connection string | Do not leave empty; Fail-fast enabled. |
| `REDIS_URL` | Distributed rate limiting store | Required for high-traffic scaling. |
| `JWT_SECRET` | Auth signing key | **MIN 64 CHARS.** High entropy recommended. |
| `CLIENT_URL` | Frontend origins | Comma-separated (e.g., `https://crammerly.app, https://staging.crammerly.app`). |
| `COOKIE_DOMAIN` | Apex domain for cookies | Required for session persistence. |
| `SENTRY_DSN` | Error monitoring | Optional but highly recommended. |
| `DEEPSEEK_API_KEY` | AI Service Key | Protected by internal `aiLimiter` (5 req/hr). |

---

## 🐋 Dockerization & Scaling
The `Dockerfile` implements several security and optimization patterns:
- **Non-Root User**: Runs as `app:app` (UID/GID 1000).
- **Multi-Stage**: Dependencies are resolved in a separate layer to keep the final image < 150MB.
- **Dependency Hoisting**: Correctly handles monorepo structures by copying from root `/app/node_modules`.
- **Health Checks**: Uses `node -e` to verify `/health` endpoint every 30s.

### Deployment Commands
```bash
# Build (Handled by CI)
docker build -t crammerly-backend:latest .

# Run Locally for Verification
docker run -p 5000:5000 \
  -e MONGO_URI="mongodb://host.docker.internal:27017/db" \
  -e JWT_SECRET="your-64-character-long-secret-key-..." \
  -e CLIENT_URL="http://localhost:3000" \
  crammerly-backend:latest
```

---

## 🚑 Troubleshooting & Monitoring

### 🩺 Health Checks
- **Public**: `GET /health` -> Returns `200 OK` (Simple LB check).
- **Internal**: `GET /api/v1/health` -> Returns detailed system metrics (Memory, DB status, Uptime).

### 🪵 Logging
The `logger.js` automatically **REDACTS** sensitive information including:
- Passwords, Tokens, API Keys, and Cookies.
- Logs are strictly JSON in production for ELK/Datadog ingestion.

### 🛡️ Security Alerts
The system logs a `SECURITY ALERT` to stdout/Sentry if:
- A signature/token version mismatch is detected (Possible replay attack).
- A user logs in from a significantly different IP/User-Agent.
- A prompt contains restricted keywords (Injection attempt).

---

**Prepared by Antigravity AI | 2026-02-17**
