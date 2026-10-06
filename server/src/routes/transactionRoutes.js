const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const requireAuth = require('../middleware/requireAuth');
const validate = require('../middleware/validate');
const { validateTransaction } = require('../utils/validators');

// All transaction endpoints require verified authentication
router.use(requireAuth);

// Summary & Aggregations
router.get('/summary', transactionController.getSummary);
router.get('/statement', transactionController.getStatement);
router.get('/export', transactionController.exportStatement);

// CRUD
router.post('/', validate(validateTransaction), transactionController.createTransaction);
router.get('/', transactionController.getTransactions);
router.get('/:id', transactionController.getTransactionById);
router.put('/:id', validate(validateTransaction), transactionController.updateTransaction);
router.delete('/:id', transactionController.deleteTransaction);

module.exports = router;
