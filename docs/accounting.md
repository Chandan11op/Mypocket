# My Pocket — Double-Entry Personal Accounting System Documentation

## Overview
My Pocket is built on a double-entry financial position engine designed to track net worth, cash flow, asset/liability structures, and profit & loss accurately.

---

## 1. Chart of Accounts & Classifications
Every user has an isolated Chart of Accounts divided into five fundamental classes:

- **ASSET**: Owned resources of economic value (`BANK`, `CASH`, `WALLET`, `DIGITAL_WALLET`, `INVESTMENT`, `RECEIVABLE`, `OTHER_ASSET`).
- **LIABILITY**: Amounts owed to external parties (`CREDIT_CARD`, `LOAN`, `PAYABLE`, `OTHER_LIABILITY`).
- **EQUITY**: Capital position (`OWNER_EQUITY`).
- **INCOME**: Revenue streams (`SALARY`, `OTHER_INCOME`).
- **EXPENSE**: Outflows for consumption (`FOOD`, `TRAVEL`, `BILLS`, `SHOPPING`, `OTHER_EXPENSE`).

---

## 2. Double-Entry Accounting Principles
- Every financial event is posted as an immutable `JournalEntry` containing at least two balanced `JournalLine`s.
- Invariant: Total Debits = Total Credits.
- Normal Balances:
  - **ASSET & EXPENSE**: Increased via Debit (+), Decreased via Credit (-).
  - **LIABILITY, EQUITY & INCOME**: Increased via Credit (+), Decreased via Debit (-).

---

## 3. Business Transaction Types
Frontend and business consumers interact through clean transaction abstractions mapped directly to double-entry journal entries:

1. **INCOME**: Debit Asset, Credit Income.
2. **EXPENSE**: Debit Expense, Credit Asset.
3. **TRANSFER**: Debit Target Asset/Liability, Credit Source Asset/Liability. (Does NOT affect P&L or Net Worth).
4. **INVESTMENT**: Debit Investment Asset, Credit Source Bank/Cash Asset. (Does NOT affect P&L or Net Worth).
5. **BORROW**: Debit Target Asset, Credit Liability. (Does NOT affect Net Worth).
6. **REPAYMENT**: Debit Liability, Credit Payment Asset. (Does NOT affect Net Worth).
7. **LEND**: Debit Receivable Asset, Credit Cash/Bank Asset. (Does NOT affect Net Worth).
8. **RECEIVABLE_PAYMENT**: Debit Cash/Bank Asset, Credit Receivable Asset. (Does NOT affect Net Worth).
9. **ADJUSTMENT**: Balanced multi-line explicit adjustment entry.

---

## 4. Financial Position & Statements

### Balance Sheet
Satisfies the fundamental accounting equation:
TOTAL ASSETS = TOTAL LIABILITIES + TOTAL EQUITY
NET WORTH = TOTAL ASSETS - TOTAL LIABILITIES

- **Opening Balances**: Captured via `OWNER_EQUITY` during account setup.
- Retained net profit from P&L contributes directly to equity.

### Profit & Loss (P&L)
NET PROFIT = TOTAL INCOME - TOTAL EXPENSES
- Strictly excludes transfers, investments, loan principal, lending, and receivable repayments.
- Supports date boundary filtering (`?from=YYYY-MM-DD&to=YYYY-MM-DD`).

### Cash Flow Statement
Categorizes cash movement into:
1. **Operating Cash Flow**: Income received and expenses paid.
2. **Investing Cash Flow**: Outflows into investments.
3. **Financing Cash Flow**: Borrowing inflows, loan repayments, and lending/receivable flows.
4. **Internal Transfers**: Account transfers (tracked separately so as not to artificially inflate cash movement).

---

## 5. Account Statement & Deterministic Running Balance
`GET /api/accounts/:id/transactions` provides account statements with a deterministic running balance.
- **Ordering**: Sorted deterministically by `date ASC, created_at ASC, _id ASC`.
- Supports pagination while maintaining exact balance sequence starting from opening balance.

---

## 6. Reconciliation & Explicit Adjustment Workflow
- **Reconciliation Audit (`ReconciliationLog`)**: Compares calculated book balance against actual statement balance.
  - Variance = Actual Balance - Calculated Balance.
  - Status: `RECONCILED` if variance is zero; `UNRECONCILED` otherwise.
  - **Non-Mutating Principle**: Reconciliation NEVER silently alters account balances or auto-posts adjustments.
- **Explicit Adjustment**: Differences are resolved only when the user explicitly posts a missing `EXPENSE`, `INCOME`, or `ADJUSTMENT` transaction.

---

## 7. Date Boundary Correctness & Security
- `from` and `to` date parameters are inclusive calendar date ranges (`$gte` and `$lte`).
- **Security Scoping**:
  - Authenticated `req.userId` is strictly enforced on all queries.
  - Cross-user accounts, counterparties, or transactions yield `404 NOT FOUND` or `403 FORBIDDEN`.
  - Immutable posted journal entries preserve complete auditability.

---

## 8. Fundamental Accounting Invariants
1. Assets = Liabilities + Equity holds after every posted journal entry.
2. Net worth changes ONLY when an income or expense entry occurs.
3. Account transfers, investments, and loan principal movements NEVER alter Net Worth or enter P&L.
