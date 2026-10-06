const mongoose = require('mongoose');
const { Transaction, Person } = require('../models');
const { resolvePersonForUser } = require('../services/personService');
const {
  getFinancialSummary,
  getMonthlyTrends,
  getStatementWithRunningBalance,
} = require('../services/accountingService');
const { generateStatementExcel } = require('../services/exportService');

/**
 * POST /api/transactions
 * Creates a new transaction with automatic counterparty person resolution
 */
const createTransaction = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { type, amount, purpose, person_name, date } = req.body;

    // Resolve or create person counterparty if provided
    let personId = null;
    let resolvedPersonName = '';

    if (person_name && String(person_name).trim()) {
      const personResult = await resolvePersonForUser(userId, person_name);
      if (personResult) {
        personId = personResult.personId;
        resolvedPersonName = personResult.personName;
      }
    }

    const transaction = await Transaction.create({
      user_id: userId,
      type: type.toLowerCase(),
      amount: Math.round(Number(amount) * 100) / 100,
      purpose: purpose.trim(),
      person_id: personId,
      person_name: resolvedPersonName,
      date: date ? new Date(date) : new Date(),
    });

    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      data: {
        transaction,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/transactions
 * Retrieves paginated, filtered list of user's transactions
 */
const getTransactions = async (req, res, next) => {
  try {
    const userId = req.userId;
    const {
      page = 1,
      limit = 20,
      type,
      person_id,
      date_from,
      date_to,
      search,
      sort_by = 'date',
      sort_order = 'desc',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    // Build user-scoped query
    const query = { user_id: new mongoose.Types.ObjectId(userId) };

    if (type && ['income', 'expense'].includes(type.toLowerCase())) {
      query.type = type.toLowerCase();
    }

    if (person_id && mongoose.Types.ObjectId.isValid(person_id)) {
      query.person_id = new mongoose.Types.ObjectId(person_id);
    }

    if (date_from || date_to) {
      query.date = {};
      if (date_from && !isNaN(Date.parse(date_from))) {
        query.date.$gte = new Date(date_from);
      }
      if (date_to && !isNaN(Date.parse(date_to))) {
        query.date.$lte = new Date(date_to);
      }
    }

    if (search && String(search).trim()) {
      const term = String(search).trim();
      query.$or = [
        { purpose: { $regex: term, $options: 'i' } },
        { person_name: { $regex: term, $options: 'i' } },
      ];
    }

    const sortOption = {};
    const direction = sort_order === 'asc' ? 1 : -1;
    sortOption[sort_by] = direction;
    if (sort_by !== 'created_at') {
      sortOption.created_at = direction;
    }

    const [transactions, total] = await Promise.all([
      Transaction.find(query).sort(sortOption).skip(skip).limit(limitNum).lean(),
      Transaction.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        transactions,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum) || 1,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/transactions/:id
 * Retrieves single transaction detail (strict user ownership verification)
 */
const getTransactionById = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid transaction ID format',
      });
    }

    const transaction = await Transaction.findOne({
      _id: id,
      user_id: userId,
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found or access denied',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        transaction,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/transactions/:id
 * Updates existing transaction (strict ownership check, resolves person)
 */
const updateTransaction = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { type, amount, purpose, person_name, date } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid transaction ID format',
      });
    }

    const transaction = await Transaction.findOne({
      _id: id,
      user_id: userId,
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found or access denied',
      });
    }

    if (type) transaction.type = type.toLowerCase();
    if (amount !== undefined) transaction.amount = Math.round(Number(amount) * 100) / 100;
    if (purpose) transaction.purpose = purpose.trim();
    if (date) transaction.date = new Date(date);

    // If person_name is provided or cleared
    if (person_name !== undefined) {
      if (String(person_name).trim()) {
        const personResult = await resolvePersonForUser(userId, person_name);
        if (personResult) {
          transaction.person_id = personResult.personId;
          transaction.person_name = personResult.personName;
        }
      } else {
        transaction.person_id = null;
        transaction.person_name = '';
      }
    }

    await transaction.save();

    res.status(200).json({
      success: true,
      message: 'Transaction updated successfully',
      data: {
        transaction,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/transactions/:id
 * Deletes user's transaction with strict ownership check
 */
const deleteTransaction = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid transaction ID format',
      });
    }

    const result = await Transaction.findOneAndDelete({
      _id: id,
      user_id: userId,
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found or access denied',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Transaction deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/transactions/summary
 * Dashboard financial overview (Total Income, Total Expense, Net Balance, Monthly trends)
 */
const getSummary = async (req, res, next) => {
  try {
    const userId = req.userId;
    const [summary, monthlyTrends] = await Promise.all([
      getFinancialSummary(userId),
      getMonthlyTrends(userId, 6),
    ]);

    res.status(200).json({
      success: true,
      data: {
        ...summary,
        monthly_trends: monthlyTrends,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/transactions/statement
 * Chronological bank-statement view with deterministic running balances
 */
const getStatement = async (req, res, next) => {
  try {
    const userId = req.userId;
    const filters = {
      type: req.query.type,
      person_id: req.query.person_id,
      person_name: req.query.person_name,
      date_from: req.query.date_from,
      date_to: req.query.date_to,
      search: req.query.search,
    };

    const statement = await getStatementWithRunningBalance(userId, filters);

    res.status(200).json({
      success: true,
      data: {
        statement,
        total_entries: statement.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/transactions/export
 * Generates and downloads statement as .xlsx Excel workbook
 */
const exportStatement = async (req, res, next) => {
  try {
    const userId = req.userId;
    const user = req.user;
    const filters = {
      type: req.query.type,
      person_id: req.query.person_id,
      person_name: req.query.person_name,
      date_from: req.query.date_from,
      date_to: req.query.date_to,
      search: req.query.search,
    };

    const statementEntries = await getStatementWithRunningBalance(userId, filters);
    const excelBuffer = generateStatementExcel(statementEntries, {
      username: user.username,
      full_name: user.full_name,
    });

    const timestamp = new Date().toISOString().substring(0, 10);
    const filename = `MyPocket_Statement_${timestamp}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(excelBuffer);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  getSummary,
  getStatement,
  exportStatement,
};
