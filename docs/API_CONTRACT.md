# API Contract & Versioning Policy

## 📌 Versioning Strategy
- **Current Version**: `v1` (Prefix: `/api/v1`)
- **Format**: RESTful JSON API
- **Breaking Changes**: Requires a major version increment (e.g., `v1` -> `v2`).

## 🛠️ Breaking Change Policy
A change is considered **breaking** if it:
1. Removes a field from a response.
2. Changes the data type of a field.
3. Changes the status code of a successful request.
4. Adds a new required field to a request body.

## 📡 Core Endpoints (v1)

### Authentication (`/auth`)
| Method | Path | Description | Protected |
| :--- | :--- | :--- | :--- |
| `POST` | `/register` | Register new user | No |
| `POST` | `/login` | Authenticate & get tokens | No |
| `POST` | `/refresh` | Rotate refresh token | Yes (Cookie) |
| `POST` | `/logout` | Revoke session | Yes (Cookie) |
| `GET` | `/profile` | Get current user profile | Yes (JWT) |

### Todos (`/todos`)
| Method | Path | Description | Protected |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Fetch all user todos | Yes |
| `POST` | `/` | Create new todo | Yes |
| `PUT` | `/:id` | Toggle completion | Yes |
| `DELETE` | `/:id` | Remove todo | Yes |

### Documentation
| Method | Path | Description | Protected |
| :--- | :--- | :--- | :--- |
| `GET` | `/api-docs` | Interactive Swagger Documentation | No |

## 📦 Global Response Format
All responses must follow this structure:

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "ISO_TIMESTAMP",
    "requestId": "uuid-v4-string",
    "version": "v1",
    "path": "/api/v1/..."
  }
}
```

On Error:
```json
{
  "success": false,
  "error": {
    "code": "AUTH_INVALID",
    "message": "Invalid email or password",
    "details": [ ... ]
  },
  "meta": {
    "timestamp": "...",
    "requestId": "...",
    "path": "..."
  }
}
```
