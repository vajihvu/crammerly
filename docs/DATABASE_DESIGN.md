# Database Design: Crammer (Crammerly)

This document outlines the authoritative schema for Crammerly. The application uses a **Consolidated MongoDB Architecture** to optimize for both real-time collaboration features and robust record management.

## 🗄️ Architecture Overview
- **Backend (MongoDB)**: Central store for all application data, including:
    - User Authentication & Profiles
    - Real-time Collaboration (Rooms)
    - Social Graph (Friends & Messages)
    - Personal Records & To-Do items

---

## 🟢 Document Schema (MongoDB / Mongoose)
*Status: Enforced via Mongoose Schemas in `/backend/models/`*

### 1. `users`
| Field | Type | Notes |
| :--- | :--- | :--- |
| `_id` | ObjectId | PK |
| `email` | String | Unique, Validated |
| `password` | String | Bcrypt Hashed |
| `name` | String | Display Name |
| `username` | String | Unique Handle |
| `tag` | String | Discriminator |
| `bio` | String | Biography |
| `interests` | [String] | Study topics |
| `skills` | [String] | Skills |
| `socialLinks` | Object | GitHub/LinkedIn URLs |
| `bannerColor` | String | Hex code |

### 2. `rooms`
| Field | Type | Notes |
| :--- | :--- | :--- |
| `_id` | ObjectId | PK |
| `code` | String | Unique 6-char code |
| `name` | String | Room name |
| `topic` | String | Category |
| `task` | String | Current goal |
| `privacy` | String | Public/Private |
| `creator` | ObjectId | FK -> users._id |
| `members` | [Array] | Current participants |

### 3. `messages`
| Field | Type | Notes |
| :--- | :--- | :--- |
| `_id` | ObjectId | PK |
| `room` | ObjectId | FK -> rooms._id |
| `sender` | ObjectId| FK -> users._id |
| `content` | String | Message text |
| `type` | String | text/file/sticker |

### 4. `todos`
| Field | Type | Notes |
| :--- | :--- | :--- |
| `user` | ObjectId | FK -> users._id |
| `text` | String | Required |
| `completed`| Boolean| Default: false |

### 5. `records`
| Field | Type | Notes |
| :--- | :--- | :--- |
| `user` | ObjectId | FK -> users._id |
| `title` | String | Required |
| `content` | String | Required |

---

## 📈 Versioning & Migrations
- **Backend**: Schema enforced at the application level via Mongoose and `express-validator`.
- **Consistency**: Real-time updates are synchronized via Socket.io events and confirmed against the MongoDB store.

*Last Updated: February 2026*
