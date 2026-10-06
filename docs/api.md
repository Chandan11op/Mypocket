# API Specification - My Pocket Backend

Base URL: `/api`

## 1. Authentication Endpoints (`/api/auth`)

| Method | Endpoint | Auth Required | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | No | Registers new user account (validates Turnstile, mobile, username, email, DOB, password). |
| `POST` | `/api/auth/login` | No | Direct login: Validates mobile number + password and issues session and tokens. |
| `POST` | `/api/auth/refresh` | No (Uses Refresh Token) | Rotates refresh token and issues a new access token. |
| `POST` | `/api/auth/logout` | No (Uses Refresh Token) | Revokes current device session and clears auth cookies. |
| `POST` | `/api/auth/logout-all` | **Yes (`requireAuth`)** | Revokes all active sessions across all devices for current user. |
| `GET` | `/api/auth/me` | **Yes (`requireAuth`)** | Retrieves safe profile of current authenticated user. |
| `POST` | `/api/auth/forgot-password` | No | Generates cryptographically secure password reset token without revealing account existence. |
| `POST` | `/api/auth/reset-password` | No | Resets password using single-use reset token and revokes active sessions. |

---

## 2. Transactions & Accounting Endpoints (`/api/transactions`)

| Method | Endpoint | Auth Required | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/transactions` | **Yes (`requireAuth`)** | Creates a new income/expense transaction and auto-resolves counterparty person. |
| `GET` | `/api/transactions` | **Yes (`requireAuth`)** | Retrieves paginated and filtered list of user's transactions. |
| `GET` | `/api/transactions/summary`| **Yes (`requireAuth`)** | Returns dashboard summary (Total Income, Total Expense, Current Balance, Monthly Trends). |
| `GET` | `/api/transactions/statement`| **Yes (`requireAuth`)** | Bank-statement view with deterministic chronological running balances. |
| `GET` | `/api/transactions/export` | **Yes (`requireAuth`)** | Generates and downloads statement as `.xlsx` Excel file. |
| `GET` | `/api/transactions/:id` | **Yes (`requireAuth`)** | Retrieves single transaction detail (strict user ownership check). |
| `PUT` | `/api/transactions/:id` | **Yes (`requireAuth`)** | Updates existing transaction and resolves person counterparty. |
| `DELETE`| `/api/transactions/:id` | **Yes (`requireAuth`)** | Deletes user's transaction. |

---

## 3. Person & Autocomplete Endpoints (`/api/persons`)

| Method | Endpoint | Auth Required | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/persons` | **Yes (`requireAuth`)** | Returns all persons associated with current user. |
| `GET` | `/api/persons/search?q=rah`| **Yes (`requireAuth`)** | Autocomplete search for counterparties belonging to current user. |

---

## 4. Ledger Endpoints (`/api/ledger`)

| Method | Endpoint | Auth Required | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/ledger` | **Yes (`requireAuth`)** | Aggregated balances for all persons (Total Received, Total Paid, Net Balance). |
| `GET` | `/api/ledger/:personId` | **Yes (`requireAuth`)** | Detailed chronological statement and running net balance for a specific person. |

---

## 5. AI Financial Assistant Endpoints (`/api/ai`)

All AI assistant endpoints require an authenticated user session (`requireAuth` via Bearer access token).

| Method | Endpoint | Auth Required | Rate Limit | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/ai/chat` | **Yes (`requireAuth`)** | 20 req / 15 min | Processes a user financial question using enriched compact financial telemetry and returns bounded advisory guidance. |
| `GET` | `/api/ai/history` | **Yes (`requireAuth`)** | Standard | Retrieves the authenticated user's recent AI chat conversation history (up to 50 turns). |
| `DELETE`| `/api/ai/history` | **Yes (`requireAuth`)** | Standard | Clears the authenticated user's entire chat history. Does not affect financial records. |

### `POST /api/ai/chat`

**Rate Limit**: 20 requests per 15 minutes per authenticated user/IP.

**Request Body**:
```json
{
  "message": "Where am I spending the most money this month?"
}
```

**Constraints**:
- `message` is required, non-empty, string, and max 500 characters.

**Success Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Based on your My Pocket records, your highest spending category this month is Apartment Rent (₹15,000), followed by Groceries (₹6,500). Your current net balance stands at ₹43,000.",
  "data": {
    "reply": "Based on your My Pocket records, your highest spending category this month is Apartment Rent (₹15,000), followed by Groceries (₹6,500). Your current net balance stands at ₹43,000."
  }
}
```

**Error Responses**:
- `400 Bad Request`: Empty message or exceeds 500 characters.
- `401 Unauthorized`: Missing or invalid JWT access token.
- `429 Too Many Requests`: Exceeded 20 requests within the 15-minute window.
- `503 Service Unavailable`: `AI_API_KEY` is not configured on the server (`code: "AI_NOT_CONFIGURED"`).
- `504 Gateway Timeout`: AI provider network timeout (>15 seconds).

---

### `GET /api/ai/history`

**Success Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "history": [
      {
        "id": "6700c9e782613cb9e0d1921a",
        "role": "user",
        "message": "What is my current balance?",
        "created_at": "2026-10-05T06:45:00.000Z"
      },
      {
        "id": "6700c9e782613cb9e0d1921b",
        "role": "assistant",
        "message": "Your current total balance is ₹43,000 across 3 transactions.",
        "created_at": "2026-10-05T06:45:01.000Z"
      }
    ],
    "total": 2
  }
}
```

---

### `DELETE /api/ai/history`

**Success Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Chat history cleared successfully."
}
```

---

## 6. Profile Endpoints (`/api/profile`)

All profile endpoints require an authenticated user session (`requireAuth` via Bearer access token). All data mutations and queries are strictly scoped to the authenticated `req.userId`.

| Method | Endpoint | Auth Required | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/profile` | **Yes (`requireAuth`)** | Retrieves safe profile information of the authenticated user. Never exposes passwords, password hashes, sessions, or secrets. |
| `PUT` | `/api/profile` | **Yes (`requireAuth`)** | Updates mutable profile fields (`full_name`, `username`, `email`, `date_of_birth`, `profile_photo`). Validates unique constraints. `mobile_number` is immutable. |
| `PUT` | `/api/profile/password` | **Yes (`requireAuth`)** | Changes password by verifying `currentPassword`, hashing `newPassword`, and invalidating all other active refresh sessions. |

### `GET /api/profile`

**Success Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "profile": {
      "id": "6700c9e782613cb9e0d1921a",
      "mobile_number": "9876543210",
      "username": "johndoe",
      "email": "john@example.com",
      "full_name": "John Doe",
      "date_of_birth": "1995-05-15T00:00:00.000Z",
      "profile_photo": "https://example.com/avatar.jpg",
      "created_at": "2026-10-01T10:00:00.000Z",
      "updated_at": "2026-10-05T07:00:00.000Z"
    }
  }
}
```

### `PUT /api/profile`

**Request Body**:
```json
{
  "full_name": "John Doe Updated",
  "username": "john_doe_99",
  "email": "john.updated@example.com",
  "date_of_birth": "1995-05-15"
}
```

### `PUT /api/profile/password`

**Request Body**:
```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword123!",
  "confirmPassword": "NewPassword123!"
}
```

---

## 7. Settings Endpoints (`/api/settings`)

User settings persist preferences across Web and future Android clients. Documents are automatically provisioned with defaults on first retrieval.

| Method | Endpoint | Auth Required | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/settings` | **Yes (`requireAuth`)** | Retrieves the authenticated user's settings. Returns sensible defaults (`theme: system`, `currency: INR`, `date_format: DD/MM/YYYY`) if unconfigured. |
| `PUT` | `/api/settings` | **Yes (`requireAuth`)** | Updates user preferences (`theme`, `currency`, `date_format`, `theme_color`, `appearance`). |

### `GET /api/settings`

**Success Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "settings": {
      "theme": "system",
      "currency": "INR",
      "date_format": "DD/MM/YYYY",
      "theme_color": "blue",
      "appearance": {
        "compact_mode": false
      },
      "updated_at": "2026-10-05T07:15:00.000Z"
    }
  }
}
```

### `PUT /api/settings`

**Request Body**:
```json
{
  "theme": "dark",
  "currency": "USD",
  "date_format": "YYYY-MM-DD",
  "theme_color": "emerald"
}
```

