const mongoose = require('mongoose');

const journalLineSchema = new mongoose.Schema({
  account_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: [true, 'Line account_id is required'],
  },
  debit: {
    type: Number,
    required: true,
    min: [0, 'Debit cannot be negative'],
    default: 0,
  },
  credit: {
    type: Number,
    required: true,
    min: [0, 'Credit cannot be negative'],
    default: 0,
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
});

const journalEntrySchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    date: {
      type: Date,
      default: Date.now,
      required: [true, 'Entry date is required'],
    },
    transaction_type: {
      type: String,
      enum: {
        values: [
          'INCOME', 'EXPENSE', 'TRANSFER', 'INVESTMENT',
          'BORROW', 'REPAYMENT', 'LEND', 'RECEIVABLE_PAYMENT',
          'OPENING_BALANCE', 'ADJUSTMENT', 'REVERSAL'
        ],
        message: '{VALUE} is not a valid transaction type',
      },
      required: [true, 'Transaction type is required'],
    },
    status: {
      type: String,
      enum: {
        values: ['DRAFT', 'POSTED', 'REVERSED'],
        message: '{VALUE} is not a valid status',
      },
      default: 'POSTED',
      required: true,
    },
    description: {
      type: String,
      required: [true, 'Entry description is required'],
      trim: true,
      maxlength: [250, 'Description cannot exceed 250 characters'],
    },
    person_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Person',
      default: null,
    },
    reference_transaction_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
      default: null,
    },
    reversed_by_entry_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JournalEntry',
      default: null,
    },
    reverses_entry_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JournalEntry',
      default: null,
    },
    is_legacy: {
      type: Boolean,
      default: false,
    },
    lines: {
      type: [journalLineSchema],
      validate: {
        validator: function (lines) {
          if (!lines || lines.length < 2) return false;
          let totalDebit = 0;
          let totalCredit = 0;
          for (const line of lines) {
            if (line.debit > 0 && line.credit > 0) return false;
            totalDebit += Math.round(line.debit * 100);
            totalCredit += Math.round(line.credit * 100);
          }
          return totalDebit === totalCredit;
        },
        message: 'Journal entry lines must be balanced: total debits must equal total credits.',
      },
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
    toJSON: {
      transform: (doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

journalEntrySchema.index({ user_id: 1, date: -1 });
journalEntrySchema.index({ user_id: 1, status: 1 });
journalEntrySchema.index({ user_id: 1, transaction_type: 1 });

const JournalEntry = mongoose.model('JournalEntry', journalEntrySchema);

module.exports = JournalEntry;
