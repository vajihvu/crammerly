# Error Taxonomy & Codes

This document defines standard error codes to prevent ambiguity between the frontend and backend.

## 🔴 System Errors (5xx)
| Code | Meaning | User Message |
| :--- | :--- | :--- |
| `SYS_INTERNAL` | Database or code crash | We're having some trouble on our end. Please try later. |
| `SYS_UNAVAILABLE` | Service down | System is temporarily offline for maintenance. |

## 🟠 Auth & Access Errors (401, 403)
| Code | Meaning | User Message |
| :--- | :--- | :--- |
| `AUTH_EXPIRED` | JWT expired | Your session has expired. Please log in again. |
| `AUTH_INVALID` | Bad credentials | Incorrect email or password. |
| `AUTH_REVOKED` | Session killed | This session is no longer active. |
| `FORBIDDEN_OWNERSHIP` | Trying to edit someone else's data | You don't have permission to modify this. |

## 🟡 Client Errors (400, 422)
| Code | Meaning | User Message |
| :--- | :--- | :--- |
| `VAL_SCHEMA_FAIL` | Zod/Validation failed | Please check your input and try again. |
| `VAL_MALFORMED_JSON` | Body too complex or broken | Request could not be processed. |
| `LIMIT_RATE_EXCEEDED` | Too many requests | You're moving a bit too fast! Please wait a moment. |
| `LIMIT_SIZE_EXCEEDED` | Payload too large | Data sent exceeds allowed limits. |

## 🔵 Resource Errors (404)
| Code | Meaning | User Message |
| :--- | :--- | :--- |
| `RES_NOT_FOUND` | Entry missing | We couldn't find what you were looking for. |
| `RES_DUPLICATE` | Unique constraint fail | That already exists (e.g. Email taken). |
