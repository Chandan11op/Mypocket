const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    type: {
      type: String,
      enum: {
        values: ['income', 'expense'],
        message: '{VALUE} is not a valid transaction type (must be "income" or "expense")',
      },
      required: [true, 'Transaction type is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Transaction amount must be strictly greater than 0'],
      validate: {
        validator: function (val) {
          return !isNaN(val) && val > 0 && isFinite(val);
        },
        message: 'Amount must be a valid positive number',
      },
    },
    purpose: {
      type: String,
      required: [true, 'Purpose/description is required'],
      trim: true,
      maxlength: [200, 'Purpose cannot exceed 200 characters'],
    },
    person_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Person',
      default: null,
    },
    person_name: {
      type: String,
      trim: true,
      default: '',
      maxlength: [100, 'Person name cannot exceed 100 characters'],
    },
    date: {
      type: Date,
      default: Date.now,
      required: [true, 'Transaction date is required'],
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

// High performance compound indexes for user-isolated queries
transactionSchema.index({ user_id: 1, date: -1 });
transactionSchema.index({ user_id: 1, created_at: -1 });
transactionSchema.index({ user_id: 1, type: 1 });
transactionSchema.index({ user_id: 1, person_id: 1, date: -1 });

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
