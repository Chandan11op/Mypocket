const express = require('express');
const router = express.Router();
const accountingController = require('../controllers/accountingController');
const requireAuth = require('../middleware/requireAuth');

// All endpoints require verified user authentication
router.use(requireAuth);

// Accounts CRUD
router.post('/accounts', accountingController.createAccount);
router.get('/accounts', accountingController.getAccounts);
router.get('/accounts/:id', accountingController.getAccountById);
router.put('/accounts/:id', accountingController.updateAccount);
router.delete('/accounts/:id', accountingController.deleteAccount);
router.get('/accounts/:id/transactions', accountingController.getAccountTransactions);

// Accounting Transactions
router.post('/accounting/transactions', accountingController.createAccountingTransaction);
router.post('/accounting/transactions/:id/reverse', accountingController.reverseAccountingTransaction);
router.delete('/accounting/transactions/:id', accountingController.deleteAccountingTransaction);

// Statements & Financial Position
router.get('/financial-position', accountingController.getFinancialPosition);
router.get('/statements/balance-sheet', accountingController.getBalanceSheet);
router.get('/statements/profit-loss', accountingController.getProfitAndLoss);
router.get('/statements/cash-flow', accountingController.getCashFlow);

// Reconciliation
router.post('/reconciliation/:accountId', accountingController.reconcileAccount);
router.get('/reconciliation/:accountId', accountingController.getReconciliationHistory);

module.exports = router;
