const mongoose = require('mongoose');
const {
  getLedgerSummary,
  getPersonLedgerDetail,
} = require('../services/accountingService');

/**
 * GET /api/ledger
 * Returns ledger overview across all persons for the current user
 */
const getLedger = async (req, res, next) => {
  try {
    const userId = req.userId;
    const ledger = await getLedgerSummary(userId);

    res.status(200).json({
      success: true,
      data: {
        ledger,
        total_persons: ledger.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/ledger/:personId
 * Returns chronological ledger detail for an individual counterparty
 */
const getPersonLedger = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { personId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(personId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid person ID format',
      });
    }

    const ledgerDetail = await getPersonLedgerDetail(userId, personId);
    if (!ledgerDetail) {
      return res.status(404).json({
        success: false,
        message: 'Person account not found or access denied',
      });
    }

    res.status(200).json({
      success: true,
      data: ledgerDetail,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLedger,
  getPersonLedger,
};
