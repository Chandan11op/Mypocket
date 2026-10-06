const mongoose = require('mongoose');

const reconciliationLogSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    account_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      required: [true, 'Account ID is required'],
      index: true,
    },
    as_of: {
      type: Date,
      default: Date.now,
      required: true,
    },
    calculated_balance: {
      type: Number,
      required: true,
    },
    actual_balance: {
      type: Number,
      required: true,
    },
    variance: {
      type: Number,
      required: true,
    },
    is_reconciled: {
      type: Boolean,
      default: false,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

reconciliationLogSchema.index({ user_id: 1, account_id: 1, created_at: -1 });

const ReconciliationLog = mongoose.model('ReconciliationLog', reconciliationLogSchema);

module.exports = ReconciliationLog;
