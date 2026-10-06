const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Account name is required'],
      trim: true,
      maxlength: [100, 'Account name cannot exceed 100 characters'],
    },
    account_class: {
      type: String,
      enum: {
        values: ['ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE'],
        message: '{VALUE} is not a valid account class',
      },
      required: [true, 'Account class is required'],
    },
    account_type: {
      type: String,
      enum: {
        values: [
          // ASSET
          'BANK', 'CASH', 'WALLET', 'DIGITAL_WALLET', 'INVESTMENT', 'RECEIVABLE', 'OTHER_ASSET',
          // LIABILITY
          'CREDIT_CARD', 'LOAN', 'PAYABLE', 'OTHER_LIABILITY',
          // EQUITY
          'OWNER_EQUITY', 'OPENING_EQUITY', 'RETAINED_EARNINGS', 'OTHER_EQUITY',
          // INCOME
          'SALARY', 'FREELANCE', 'INTEREST', 'DIVIDEND', 'CASHBACK', 'OTHER_INCOME',
          // EXPENSE
          'FOOD', 'TRAVEL', 'RENT', 'BILLS', 'SHOPPING', 'ENTERTAINMENT', 'SUBSCRIPTIONS', 'FEES', 'OTHER_EXPENSE'
        ],
        message: '{VALUE} is not a valid account type',
      },
      required: [true, 'Account type is required'],
    },
    institution_name: {
      type: String,
      trim: true,
      default: '',
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [250, 'Description cannot exceed 250 characters'],
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    is_system_account: {
      type: Boolean,
      default: false,
    },
    opening_balance_meta: {
      amount: { type: Number, default: 0 },
      date: { type: Date, default: Date.now },
    },
    last_reconciled_at: {
      type: Date,
      default: null,
    },
    last_reconciled_balance: {
      type: Number,
      default: null,
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

accountSchema.index({ user_id: 1, name: 1 }, { unique: true });
accountSchema.index({ user_id: 1, account_class: 1 });
accountSchema.index({ user_id: 1, account_type: 1 });

const Account = mongoose.model('Account', accountSchema);

module.exports = Account;
