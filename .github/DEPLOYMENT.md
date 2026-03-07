# Deployment Runbook

## Normal Deploy Flow

Merging a PR into `main` → triggers `CI / CD` workflow → after mandatory reviewer approval → deploys to production.

---

## Disaster Recovery Plan (#10)

### Scenario 1 — Container crash / bad deploy
```bash
# Check which image is running
docker ps

# Roll back using the Rollback workflow (Actions tab) or manually:
docker pull ghcr.io/<org>/crammerly:<previous-tag>
# Update IMAGE_TAG in your host env and restart:
docker-compose up -d --no-deps app
```

### Scenario 2 — Database corruption / data loss
```bash
# List available backups
ls /backups/*.tar.gz

# Restore latest backup
LATEST=$(ls -t /backups/*.tar.gz | head -1)
tar -xzf "$LATEST" -C /tmp/restore
mongorestore --uri="$MONGO_URI" --drop /tmp/restore/<date-folder>

# Verify
mongosh "$MONGO_URI" --eval "db.users.countDocuments()"
```

### Scenario 3 — Full infrastructure failure
1. Provision a new server with Docker + Docker Compose
2. Restore `/etc/letsencrypt` certs from backup or re-run certbot
3. Restore `/backups` volume from off-site backup (S3 / B2)
4. Copy `.env.production` from password manager
5. `docker-compose up -d`
6. Run smoke tests: `PRODUCTION_URL=<url> node backend/scripts/production_smoke_test.js`

### RTO / RPO targets
| Target | Value |
|--------|-------|
| Recovery Time Objective (RTO) | < 1 hour |
| Recovery Point Objective (RPO) | < 24 hours (daily backup cadence) |

---

## Incident Response (#24)

### Severity levels
| Level | Definition | Response time |
|-------|-----------|---------------|
| **P0 — Critical** | Production down, data loss, security breach | Immediately |
| **P1 — High** | Major feature broken, significant degradation | < 1 hour |
| **P2 — Medium** | Non-critical feature broken, performance issue | < 4 hours |
| **P3 — Low** | Minor bug, cosmetic issue | Next business day |

### Contacts (fill in before go-live)
| Role | Name | Email | Slack handle |
|------|------|-------|-------------|
| On-call Engineer | _your name_ | _your@email.com_ | _@handle_ |
| Backup Engineer | — | — | — |
| Domain / DNS admin | — | — | — |
| Hosting platform support | Render/Railway | support@render.com | — |
| MongoDB Atlas support | Atlas | — | https://support.mongodb.com |

### Incident response steps
1. **Detect** — Slack alert from CI/CD or UptimeRobot alert fires
2. **Acknowledge** — Reply in Slack within 5 min for P0/P1
3. **Assess** — Check `/health`, Sentry errors, container logs (`docker logs app`)
4. **Contain** — Enable maintenance mode (`FEATURE_MAINTENANCE_MODE=true` + redeploy) if needed
5. **Fix** — Rollback or hotfix deploy via `rollback.yml` workflow
6. **Verify** — Run smoke tests. Confirm `/health` returns `status: OK`
7. **Post-mortem** — Write a brief incident report: what happened, why, what was fixed, what prevents recurrence

---


To roll back production to a previous version:

1. Go to **Actions** → **Rollback Production** → **Run workflow**
2. Enter the **image tag** to roll back to (e.g. `main-abc1234`)
3. Enter a **reason** (recorded in release notes and Slack)
4. Click **Run workflow** — the approval gate will fire, requiring a reviewer

### Finding a valid image tag

```bash
# List recent GHCR image tags
docker manifest inspect ghcr.io/<org>/<repo>:<tag>

# Or browse: https://github.com/<org>/<repo>/pkgs/container/<repo>
```

Tags follow the pattern: `main-<short-sha>` (e.g. `main-a1b2c3d`)  
Each production deploy also creates a GitHub Release tag: `v<run_number>-<sha>`

### Emergency rollback (skipping CI)

If the workflow itself is broken, SSH to your server and pull the previous tag manually:

```bash
docker pull ghcr.io/<org>/crammerly:<previous-tag>
# Update IMAGE_TAG in your .env and restart:
docker-compose up -d
```

## Required GitHub Setup

| Setting | Where | What to do |
|---------|-------|-----------|
| Protected branch | Settings → Branches → `main` | Require PR + passing CI checks |
| Protected branch | Settings → Branches → `staging` | Require passing CI |
| Production environment | Settings → Environments → `production` | Add yourself as required reviewer |
| Staging environment | Settings → Environments → `staging` | No reviewer needed |

## Required Secrets (Settings → Secrets → Actions)

| Secret | Description |
|--------|-------------|
| `MONGO_URI` | Production MongoDB connection string |
| `JWT_SECRET` | ≥ 32 char random string |
| `JWT_REFRESH_SECRET` | ≥ 32 char random string |
| `SMTP_HOST` | Email host (e.g. `smtp.resend.com`) |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password |
| `REDIS_URL` | Redis connection URL |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `SENTRY_DSN` | Sentry DSN for error tracking |
| `STAGING_URL` | e.g. `https://staging.crammerly.io` |
| `PRODUCTION_URL` | e.g. `https://api.crammerly.io` |
| `SLACK_WEBHOOK_URL` | Slack Incoming Webhook URL for deploy notifications |
| `RENDER_STAGING_DEPLOY_HOOK` | Render deploy hook URL for staging |
| `RENDER_PRODUCTION_DEPLOY_HOOK` | Render deploy hook URL for production |
