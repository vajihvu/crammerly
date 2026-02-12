# Data Retention & Lifecycle Policy

This document outlines how Shabucks handles data lifetimes, automated cleanup, and deletion rules.

## 🕒 Automated Lifecycle Rules (TTL)

We use MongoDB TTL (Time-To-Live) indexes to ensure sensitive or transient data does not persist indefinitely.

| Data Type | Retention Period | Mechanism | Reason |
| :--- | :--- | :--- | :--- |
| **Active Sessions** | 7 Days | `expiresAt` Index | Security hygiene & storage optimization. |
| **Audit Logs** | 90 Days | `createdAt` Index | Compliance & incident investigation window. |
| **Refresh Tokens** | Matches Session | Part of Session | Prevent orphaned tokens. |

## 🗑️ Deletion Rules

### 1. Soft-Delete (Logical Deletion)
We prefer soft-deletion for primary user entities to prevent accidental data loss and maintain relational integrity.

- **Users**: Setting `isActive: false`. User data remains but login is blocked. Associated sessions are hard-deleted.
- **Records/Todos**: Currently hard-deleted upon user request. (Future: Add `isDeleted` flag for 30-day recovery window).

### 2. Hard-Delete (Physical Deletion)
- **Sessions**: Hard-deleted automatically via TTL when expired or when a user explicitly logs out.
- **Revoked Tokens**: Hard-deleted via TTL.

## 🛡️ Privacy Compliance (GDPR/CCPA Readiness)
- Users can request full account deactivation.
- All sessions are immediately invalidated upon password change or account deactivation.
- Audit logs contain non-PII data where possible (e.g., hashed identifiers or generic event types).
