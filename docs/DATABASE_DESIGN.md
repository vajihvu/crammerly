# Database Design: Crammer (Shabucks)

This document outlines the authoritative schema for Crammerly. The application uses a **Hybrid Multi-Database Architecture** to optimize for both high-concurrency real-time features and robust record management.

## 🗄️ Architecture Overview
- **Supabase (PostgreSQL)**: Primary store for Real-time collaboration, Rooms, Social graph, and Profiles.
- **Backend (MongoDB)**: Primary store for User Authentication, Personal Records, and To-Do items.

---

## 🔵 Relational Schema (Supabase / Postgres)
*Status: Enforced via SQL Migrations in `/supabase/migrations/`*

### 1. `profiles`
| Column | Type | Notes |
| :--- | :--- | :--- |
| `id` | uuid | PK (references auth.users) |
| `full_name` | text | Display name |
| `username` | text | Unique handle |
| `tag` | text | Discriminator |
| `bio` | text | Biography |
| `interests` | text[] | Study topics |
| `skills` | text[] | Skills |
| `social_links`| jsonb | GitHub/LinkedIn URLs |
| `banner_color`| text | Hex code |

### 2. `rooms`
| Column | Type | Notes |
| :--- | :--- | :--- |
| `id` | uuid | PK |
| `code` | text | Unique 6-char code |
| `name` | text | Room name |
| `topic` | text | Category |
| `task` | text | Current goal |
| `privacy` | text | Public/Private |
| `creator_id` | uuid | FK -> profiles.id |

### 3. `messages`
| Column | Type | Notes |
| :--- | :--- | :--- |
| `id` | uuid | PK |
| `room_id` | uuid | FK -> rooms.id |
| `sender_id` | uuid | FK -> profiles.id |
| `content` | text | Message text |
| `type` | text | text/file/sticker |

---

## 🟢 Document Schema (MongoDB / Mongoose)
*Status: Enforced via Mongoose Schemas in `/backend/models/`*

### 4. `users`
| Field | Type | Notes |
| :--- | :--- | :--- |
| `_id` | ObjectId | PK |
| `email` | String | Unique, Validated |
| `password` | String | Bcrypt Hashed |
| `name` | String | Display Name |

### 5. `todos`
| Field | Type | Notes |
| :--- | :--- | :--- |
| `user_id` | String | Index |
| `text` | String | Required |
| `completed`| Boolean| Default: false |

### 6. `records`
| Field | Type | Notes |
| :--- | :--- | :--- |
| `user` | ObjectId | FK -> users._id |
| `title` | String | Required |
| `content` | String | Required |

---

## 📈 Versioning & Migrations
- **Supabase**: Versioned SQL files in `supabase/migrations/`. 
- **Backend**: Schema enforced at the application level via Mongoose and `express-validator`.
- **Sync**: A `version` table in Postgres tracks the current migration state.

*Last Updated: February 2026*
