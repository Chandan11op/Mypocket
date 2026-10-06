# Database Schema & Data Models - MongoDB

## Collections

### 1. `users`
Represents registered users.
- `_id`: ObjectId
- `mobile_number`: String (Unique, Indexed)
- `username`: String (Unique, Indexed)
- `email`: String (Unique, Indexed, Lowercase)
- `full_name`: String
- `date_of_birth`: Date
- `password_hash`: String (Bcrypt, select: false)
- `profile_photo`: String (URL or default placeholder)
- `google_id`: String (Optional, Sparse Indexed for future compatibility)
- `is_verified`: Boolean (Default: true)
- `created_at`: Date
- `updated_at`: Date

### 2. `sessions`
Multi-device session records and refresh tokens.
- `_id`: ObjectId
- `user_id`: ObjectId (Indexed -> users._id, Required)
- `refresh_token_hash`: String (SHA-256 hash, Indexed)
- `device_type`: String (`'web' | 'android' | 'ios' | 'unknown'`)
- `device_name`: String
- `ip_address`: String
- `user_agent`: String
- `expires_at`: Date (TTL Indexed -> auto deleted on expiration)
- `revoked_at`: Date (Null if active)
- `last_used_at`: Date
- `created_at`: Date
- `updated_at`: Date

### 3. `passwordresettokens`
Single-use secure password reset tokens.
- `_id`: ObjectId
- `user_id`: ObjectId (Indexed -> users._id, Required)
- `token_hash`: String (SHA-256 hash, Unique, Indexed)
- `is_used`: Boolean (Default: false)
- `expires_at`: Date (TTL Indexed -> auto deleted after 15 minutes)
- `created_at`: Date
- `updated_at`: Date

### 4. `transactions`
Primary financial ledger entries.
- `_id`: ObjectId
- `user_id`: ObjectId (Indexed -> users._id, Required)
- `type`: String (Enum: `['income', 'expense']`, Required)
- `amount`: Number (Required, Min: 0.01)
- `purpose`: String (Required, Trimmed)
- `person_id`: ObjectId (Ref -> persons._id, Optional)
- `person_name`: String (Trimmed, Optional)
- `date`: Date (Default: Date.now, Indexed)
- `created_at`: Date
- `updated_at`: Date

**Indexes:**
- `{ user_id: 1, date: -1 }`
- `{ user_id: 1, person_id: 1, date: -1 }`
- `{ user_id: 1, type: 1 }`

### 5. `persons`
User-scoped ledger counterparties.
- `_id`: ObjectId
- `user_id`: ObjectId (Indexed -> users._id, Required)
- `name`: String (Required, Trimmed)
- `created_at`: Date
- `updated_at`: Date

**Compound Unique Index:**
- `{ user_id: 1, name: 1 }` (Ensures unique person name per user)

### 6. `user_settings`
User preferences and appearance settings.
- `_id`: ObjectId
- `user_id`: ObjectId (Unique, Indexed -> users._id)
- `theme`: String (`'dark' | 'light' | 'system'`, Default: `'system'`)
- `currency`: String (Default: `'INR'`)
- `appearance`: String (Default: `'default'`)
- `date_format`: String (Default: `'DD/MM/YYYY'`)
- `theme_color`: String (Default: `'emerald'`)
- `updated_at`: Date

### 7. `chat_history`
Scoped AI financial assistant dialog logs.
- `_id`: ObjectId
- `user_id`: ObjectId (Indexed -> users._id)
- `role`: String (`'user' | 'assistant'`)
- `message`: String
- `created_at`: Date
