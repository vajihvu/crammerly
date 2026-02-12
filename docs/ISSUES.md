# Project Backlog & Tracked Issues

This file tracks the "TODO" items and future hardening tasks identified in the documentation, as recommended for security and hygiene.

## 🛡️ Security Hardening (from AUTH_FLOW.md)
- [x] **Supabase Custom JWT**: Update backend to sign JWTs using Supabase's `JWT_SECRET` so RLS `auth.uid()` works natively.
- [x] **Refresh Token Rotation**: Implement a rotation strategy to reduce "forever" login risks.
- [x] **Audit Logging Enhancement**: Map every write to a `security_events` log for better auditing.

## 📡 API Enhancements (from API_CONTRACT.md)
- [x] **Full Swagger Coverage**: Ensure all endpoints (including AI and Records) are fully documented in Swagger.
- [ ] **Versioning V2 Planning**: Define requirements for breaking changes in next major release.

## 🚀 DevOps & DX
- [x] **Static Hosting Optimization**: Ensure `public/vite.svg` and other assets are correctly handled in the CI/CD pipeline for static hosting.
- [x] **Automated SBOM**: Integrate automated SBOM generation into the build pipeline.

---
*Last Updated: February 11, 2026*
