# Authentication & Trust Flow: Crammerly

This document defines the security architecture and trust boundaries for the Crammerly project.

## 🔐 Hybrid Auth Architecture
Crammerly uses a **Custom Identity Provider (Backend)** combined with **Supabase RLS** for data protection.

### 1. Identity Management (Primary)
- **Store**: MongoDB (`users` collection).
- **Process**: 
  - User submits credentials to `/backend/api/auth`.
  - Backend validates, hashes with `bcrypt`, and issues a JWT.
  - JWT contains `userId`, `email`, and `role`.
- **Token Lifecycle**:
  - **Expiration**: 30 days (Long-lived for study sessions).
  - **Storage**: `localStorage` (userInfo).

### 2. Database Trust Boundaries
#### A. Backend (MongoDB)
- **Data**: User credentials, Personal Records, Todos.
- **Security**: Protected via `protect` middleware that verifies the JWT.
- **Validation**: Incoming requests are validated via Zod + `express-validator`.

#### B. Supabase (PostgreSQL)
- **Data**: Rooms, Messages, Profiles, Friends.
- **Security**: **Row Level Security (RLS)**.
- **Trust Bridge**: 
  - Currently, frontend uses the `anon` key.
  - *Goal*: Backend issues a Supabase-compatible JWT or uses Service Role for secure sync.
  - *Current Enforcement*: SQL constraints and Frontend Zod validation.

## 🛡️ Row Level Security (RLS) Policy Summary

| Table | Policy | Logic |
| :--- | :--- | :--- |
| `profiles` | `Public Read` | Everyone can see handles. |
| `profiles` | `Owner Update` | Only user with matching ID can edit. |
| `rooms` | `Public Read` | Public rooms visible to all. |
| `rooms` | `Owner Full` | Creator has full CRUD. |
| `messages` | `Room Access` | If you have the room code, you can read/write. |
| `friendships`| `Involved Only` | Only requester/recipient can see the relationship. |

## 🚀 Future Security Hardening
1. **Supabase Custom JWT**: Update backend to sign JWTs using Supabase's `JWT_SECRET` so RLS `auth.uid()` works natively.
2. **Refresh Tokens**: Implement a rotation strategy to reduce "forever" login risks.
3. **Audit Logging**: Map every write to a `security_events` log.

*Last Updated: February 2, 2026*
