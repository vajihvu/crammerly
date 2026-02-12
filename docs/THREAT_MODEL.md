# Threat Model - Shabucks Study Platform

## 1. Attack Surface
*   **Public API**: Versioned endpoints under `/api/v1/`.
*   **Authentication**: Login/Register endpoints, JWT-based sessions, Refresh Token cookies.
*   **AI Integration**: Proxying requests to Deepseek (potential for prompt injection or model abuse).
*   **Database**: MongoDB (NoSQL injection, data exposure).
*   **Real-time Features**: Supabase integration.

## 2. Authentication & Authorization Risks
*   **Brute Force**: Attempting to guess passwords on `/auth/login`.
*   **Token Theft**: Stealing JWT access tokens or Refresh Token cookies.
*   **Session Fixation**: Reusing old session IDs.
*   **Insecure Password Storage**: Weak hashing algorithms.

## 3. Data Exposure Risks
*   **Sensitive Information Leakage**: Verbose error messages revealing stack traces or DB structure.
*   **Unauthorized Data Access**: One user accessing another user's todos or records.
*   **Metadata Exposure**: Leaking internal server info in headers.

## 4. Mitigations & Controls
*   **Authentication**:
    *   **Rate Limiting**: Strict limits on auth endpoints (20 per hour).
    *   **Secure Cookies**: Refresh tokens stored in `httpOnly`, `secure`, `sameSite: strict` cookies.
    *   **Token Rotation**: Automatic rotation of refresh tokens to detect reuse.
    *   **Strong Hashing**: Using `bcryptjs` with a cost factor of 12.
    *   **Session Validation**: Normalizing IPs and checking for environment anomalies.
*   **Authorization**:
    *   **Middleware Enforcement**: `protect` middleware ensures `req.user` is populated and valid.
    *   **Scope Isolation**: Every query (Mongo/Supabase) is scoped to the `userId` of the requester.
*   **Input/Output Security**:
    *   **Helmet.js**: Strict security headers (CSP, HSTS, Referrer Policy).
    *   **HPP**: Protection against HTTP Parameter Pollution.
    *   **Zod/Express-Validator**: Strict schema validation on all incoming payloads.
    *   **Logging Refinement**: Automatic redaction of secrets in logs (Winston with regex scrub).
*   **Resiliency**:
    *   **Graceful Shutdown**: Handlers for `SIGTERM`/`SIGINT` to prevent DB corruption.
    *   **Maintenance Jobs**: Background jobs to clean up expired sessions and orphaned data.

## 5. Residual Risks
*   **Zero-Day Exploits**: Vulnerabilities in third-party dependencies (mitigated by Dependabot).
*   **Client-Side Insecurity**: Potential for XSS if frontend sanitization fails (mitigated by CSP).
