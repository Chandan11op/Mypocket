# System Architecture - My Pocket

## 1. Overview
My Pocket is a full-stack personal finance and ledger accounting application designed for cross-platform operations across Web and Android clients, supported by a shared Node.js/Express backend and MongoDB.

```
┌─────────────────────────┐       ┌─────────────────────────┐
│ React + Vite (Web)      │       │ Android App (Kotlin)    │
│ (HTTP-only cookie auth) │       │ (Bearer Token auth)     │
└────────────┬────────────┘       └────────────┬────────────┘
             │                                 │
             │      HTTPS / JSON REST API      │
             └────────────────┬────────────────┘
                              ▼
       ┌──────────────────────────────────────────────┐
       │ Node.js + Express Server (/server)           │
       │ - requireAuth Middleware (Bearer / Cookie)   │
       │ - Multi-Device Session Management            │
       │ - Accounting & Running Balance Engine        │
       │ - Person Counterparty Ledger Aggregations    │
       │ - Deterministic Statement Chronology         │
       │ - Native XLSX Excel Report Generator         │
       │ - Turnstile & Centralized Rate/Error Limits  │
       └──────────────────────┬───────────────────────┘
                              ▼
       ┌──────────────────────────────────────────────┐
       │ MongoDB Database                             │
       │ - users (Bcrypt, select: false)              │
       │ - sessions (Hashed Refresh Token, TTL)       │
       │ - passwordresettokens (Hashed Token, TTL 15m)│
       │ - transactions (Compound Idx: user_id, date) │
       │ - persons (Compound Unique: user_id, name)   │
       │ - user_settings (Preferences)                │
       │ - chat_history (Scoped AI Logs)              │
       └──────────────────────────────────────────────┘
```

## 2. Balance & Accounting Semantics
- **Balance Formula**:
  $$\text{Current Balance} = \text{Total Income} - \text{Total Expense}$$
- **Income**: Money received by user (increases overall balance, increases counterparty received balance).
- **Expense**: Money paid by user (decreases overall balance, increases counterparty paid balance).
- **Running Balance**:
  $$\text{Running Balance}_i = \text{Running Balance}_{i-1} + \text{Income}_i - \text{Expense}_i$$
  Calculated deterministically using chronological order: `date ASC` $\rightarrow$ `created_at ASC` $\rightarrow$ `_id ASC`.
- **Person Ledger**:
  $$\text{Net Balance (Person)} = \text{Total Received} - \text{Total Paid}$$

## 3. Strict User Isolation
- Every document is indexed and queried strictly by `req.userId` resolved by `requireAuth` middleware from verified JWT credentials.
- `req.body.user_id` or query parameters can never override or access resources belonging to another user.
