# Production Deployment Plan - Crammerly

## 🎯 Target Platforms
*   **Backend**: Render or Railway (Best for Node/Express + MongoDB Atlas).
*   **Database**: MongoDB Atlas (Managed DB with backups and security).
*   **Frontend**: Vercel (Optimized for Vite/React and static assets).

## 🛠️ Infrastructure Requirements
1.  **Environment Separation**: Use `.env.production` for production-specific secrets.
2.  **Managed Database**: Migration from local MongoDB to MongoDB Atlas.
3.  **Secrets Management**: Store secrets in the platform's Dashboard, NEVER in source control.

## 🚀 Step-by-Step Deployment (Render/Railway example)

### 1. Database Setup
*   Create a FREE project on [MongoDB Atlas](https://www.mongodb.com/atlas).
*   Whitelist `0.0.0.0/0` (or use peering if supported) for the deployment IPs.
*   Copy the `SRV` Connection String.

### 2. Backend Deployment
*   Connect the Repository to Render/Railway.
*   Set **Build Command**: `npm install`
*   Set **Start Command**: `npm start`
*   Configure the following ENV variables on the platform:
    *   `NODE_ENV=production`
    *   `PORT=10000` (Render default)
    *   `MONGO_URI=your_atlas_connection_string`
    *   `JWT_SECRET=generate_a_long_32char_random_string`
    *   `CLIENT_URL=https://your-frontend-domain.com`
    *   `DEEPSEEK_API_KEY=your_key`

### 3. Frontend Deployment
*   Connect to Vercel.
*   Set **Build Command**: `npm run build`
*   Set **Output Directory**: `dist`
*   Configure ENV variables:
    *   `VITE_API_URL=https://your-backend-url.onrender.com/api/v1`
    *   `VITE_SUPABASE_URL=...`
    *   `VITE_SUPABASE_ANON_KEY=...`

---

# 📋 Ready-to-Deploy Checklist

### 🔓 Security & Code
- [ ] **Strict CORS**: `app.js` origin whitelist points to final frontend URL.
- [ ] **Secrets Scanned**: No real secrets in `scripts/`, `tests/`, or `config/`.
- [ ] **Zod Validation**: All routes have schemas in `backend/schemas/`.
- [ ] **Logger Redaction**: Winston is configured to scrub sensitive fields.
- [ ] **Graceful Shutdown**: SIGTERM/SIGINT handlers verified in `index.js`.

### 🧪 Infrastructure
- [ ] **Database Indexes**: Compound indexes created for `Records` and `Todos`.
- [ ] **Health Checks**: `/health` and `/api/v1/health` are reachable.
- [ ] **Rate Limiting**: Applied to all production routes to prevent DoS.
- [ ] **Audit Logging**: Successful and failed auth events are logged to DB.

### 🚀 Launch Readiness
- [ ] **Environment Sync**: `npm run env:sync` run and verified.
- [ ] **Build Check**: `npm run build` passes locally for both tiers.
- [ ] **Test Coverage**: Critical auth and CRUD tests pass (`npm test`).
- [ ] **Documentation**: `README.md` and `docs/` are up to date.
