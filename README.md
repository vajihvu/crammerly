# ☕ Crammerly

A real-time collaborative study platform where students create virtual study rooms, join live sessions, chat, video call, and track progress together — built for focus and accountability.

## ✨ Features

| Category | Details |
|---|---|
| **Study Rooms** | Create public/private rooms with up to 80 concurrent members |
| **Real-Time Chat** | Instant messaging with read receipts via WebSockets |
| **Video Calls** | Peer-to-peer video/audio calls using WebRTC |
| **Focus Timer** | Built-in Pomodoro-style focus sessions with stats tracking |
| **Social** | Friend system with requests, suggestions, and DMs |
| **Notebooks** | Personal journal entries and study notes |
| **Todo Lists** | Task management integrated into your study flow |
| **AI Chatbot** | AI-assisted learning companion |
| **Admin Console** | User management, bug report triage, and moderation tools |

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS, Socket.io Client |
| **Backend** | Node.js, Express, MongoDB (Mongoose), Socket.io |
| **Auth** | JWT (Access + Refresh tokens), Google OAuth 2.0 |
| **Real-Time** | Socket.io (WebSockets), WebRTC (video/audio) |
| **Background Jobs** | BullMQ + Redis |
| **Deployment** | Vercel (frontend), Render (backend), Docker |
| **CI/CD** | GitHub Actions (lint, test, Trivy scan, deploy) |

## 🚀 Getting Started

### Prerequisites
- **Node.js** >= 20 (see `.nvmrc`)
- **MongoDB** (local or Atlas)
- **Redis** (optional, for rate limiting and background jobs)

### Installation
```bash
# Clone the repo
git clone https://github.com/your-username/shabucks.git
cd shabucks

# Install all dependencies (frontend + backend)
npm install
```

### Environment Setup
```bash
# Copy the example env files
cp .env.example backend/.env
cp .env.example frontend/.env
```

Fill in the required secrets: `JWT_SECRET`, `MONGO_URI`, `GOOGLE_CLIENT_ID`, etc.

### Development
```bash
# Start both frontend and backend concurrently
npm run dev
```

- **Frontend**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000/api/v1`

## 📂 Project Structure

```
shabucks/
├── frontend/          # React + Vite SPA
│   ├── src/
│   │   ├── api/       # Axios API clients
│   │   ├── components/# UI components & modals
│   │   ├── context/   # Auth, UI, VideoCall providers
│   │   ├── hooks/     # Custom React hooks
│   │   ├── pages/     # Route-level pages
│   │   └── utils/     # Socket, storage, helpers
│   └── ...
├── backend/           # Express REST API + WebSocket server
│   ├── controllers/   # Route handlers
│   ├── middleware/     # Auth, rate limiting, validation
│   ├── models/        # Mongoose schemas
│   ├── routes/        # API route definitions
│   ├── utils/         # Logger, cache, socket, queue
│   └── workers/       # BullMQ background jobs
├── docs/              # Architecture & security docs
├── infrastructure/    # Docker, CI/CD configs
└── scripts/           # Admin utilities
```

## 🛡️ Security

- **Authentication**: JWT access/refresh token rotation with `tokenVersion` invalidation
- **Rate Limiting**: Per-endpoint limiters (login, refresh, room actions, AI) via `express-rate-limit` + Redis
- **Input Validation**: Zod schemas on every endpoint
- **CSRF Protection**: Double-submit cookie pattern
- **Room Codes**: Crypto-secure random hex generation (`crypto.randomBytes`)
- **Concurrency**: Atomic MongoDB operations for room capacity enforcement
- **CI/CD**: Automated Trivy container scanning and ESLint linting

## 📜 License

This project is licensed under the [MIT License](LICENSE).

---

<p align="center">Built with lots of caffeine ☕</p>
