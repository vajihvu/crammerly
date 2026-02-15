# Crammerly - Secure Agentic Study Platform

Crammerly is a modern study platform with integrated AI-assisted learning. It is built with a security-first mindset, focusing on both standard web vulnerabilities and AI-specific risks.


## 🚀 Quickstart

### 1. Prerequisites
- **Node.js**: >= 20.0.0 (See `.nvmrc`)
- **MongoDB**: Running locally or Atlas
- **Supabase**: Project credentials for real-time features

### 2. Installation
```bash
# Install dependencies for both frontend and backend
npm install
```

### 3. Environment Setup
- Copy `docs/.env.example` to `backend/.env` and `frontend/.env`.
- Fill in the required secrets (JWT_SECRET, MONGO_URI, etc.).

### 4. Launch
```bash
# Start both frontend and backend in development mode
npm run dev
```

## 📂 Project Structure
- `/frontend`: React + Vite application.
- `/backend`: Node.js + Express API.
- `/docs`: Detailed security, architecture, and API documentation.

## 🛡️ Security & Hygiene
- **Environment Validation**: Enforced at runtime via Zod. Weak secrets will prevent startup.
- **Rate Limiting**: Applied to all API routes with extra strictness on auth endpoints.
- **CI/CD**: Automated linting and testing via GitHub Actions.
- **Containerization**: Docker and Docker Compose support included for deterministic deployments.

## 📜 Community & License
- **[License](LICENSE)**: MIT
- **[Contributing](CONTRIBUTING.md)**: Guidelines for contributors.
- **[Code of Conduct](CODE_OF_CONDUCT.md)**: Community standards.
- **[Tracked Issues](docs/ISSUES.md)**: Project backlog and future tasks.

---
For detailed documentation on authentication flows, API contracts, and security audits, please refer to the **[docs/](docs/)** directory.
