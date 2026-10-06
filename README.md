# My Pocket 💰
*Personalized Expense Tracking & Accounting Platform*

A production-grade full-stack personal finance and ledger accounting application supporting both **Web** (React + Vite) and **Android** (Kotlin) clients sharing a secure **Node.js / Express / MongoDB** backend.

---

## 📁 Repository Structure
```
MyPocket/
├── apps/
│   ├── web/          # React + Vite + Tailwind CSS web application
│   │   ├── src/
│   │   │   ├── components/  # Layout, Sidebar, TransactionModal, UI widgets
│   │   │   ├── context/     # AuthContext, ThemeContext
│   │   │   ├── pages/       # Dashboard, Transactions (Statement), Ledger, PersonDetail, Profile, Settings, Auth
│   │   │   ├── services/    # Centralized Axios client & API endpoints
│   │   │   └── utils/       # Formatters (INR ₹, dates, style mergers)
│   │   ├── package.json
│   │   └── vite.config.js
│   │
│   └── mobile/       # Native Android Kotlin application
│
├── server/           # Shared Node.js + Express + MongoDB REST API backend
│   ├── src/
│   │   ├── config/   # Database & Environment configuration
│   │   ├── controllers/ # Auth, Transaction, Person, Ledger controllers
│   │   ├── middleware/  # requireAuth, Rate Limiters, Error Handlers, Validators
│   │   ├── models/      # User, Session, PasswordResetToken, Transaction, Person, UserSettings, ChatHistory
│   │   ├── routes/      # /api/auth, /api/transactions, /api/persons, /api/ledger
│   │   ├── services/    # AccountingService, PersonService, ExportService, Turnstile
│   │   └── utils/       # Token helpers, Validators
│   ├── .env.example
│   ├── test_auth.js
│   ├── test_accounting.js
│   └── server.js
│
├── shared/           # Shared constants, enums, contracts
├── docs/             # Architecture, Database, & API specifications
│   ├── architecture.md
│   ├── database.md
│   └── api.md
└── README.md
```

---

## 🚀 Running the Full Stack

### 1. Start the Backend Server (`server/`)
```bash
cd server
npm install
node test_auth.js        # Run authentication integration tests
node test_accounting.js  # Run accounting & ledger integration tests
npm run dev              # Starts backend on http://localhost:5000
```

### 2. Start the React Web Application (`apps/web/`)
```bash
cd apps/web
npm install
npm run dev              # Starts web client on http://localhost:5173
```

---

## 🌐 Web Application Features
- **Dashboard**: Real-time KPI summary (Current Balance, Total Income, Total Expenses), monthly cash flow trend charts (Recharts), and recent activity list.
- **Transactions & P&L Statement**: Bank-statement layout with running balance, date range filters, transaction type filtering, keyword search, pagination, and backend `.xlsx` Excel download.
- **Counterparty Ledger**: Person overview with total received/paid balances and chronological individual person statements.
- **Quick Record Modal**: Add/edit income and expense records with debounce-assisted autocomplete for counterparty names.
- **Theme & Security**: Light, Dark, and System appearance toggles, INR formatting, and JWT authentication with automatic token refresh.

---

## 📖 Documentation Links
- [System Architecture & Accounting Semantics](file:///c:/Developments/Projects/Mypocket/docs/architecture.md)
- [Database Schema & Models](file:///c:/Developments/Projects/Mypocket/docs/database.md)
- [API Endpoints Specification](file:///c:/Developments/Projects/Mypocket/docs/api.md)
