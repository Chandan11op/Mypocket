const mongoose = require('mongoose');

const passwordResetTokenSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    token_hash: {
      type: String,
      required: [true, 'Token hash is required'],
      unique: true,
      index: true,
    },
    is_used: {
      type: Boolean,
      default: false,
    },
    expires_at: {
      type: Date,
      required: [true, 'Expiration date is required'],
      index: { expires: 0 }, // TTL index: auto-deletes document when expires_at is reached
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
    toJSON: {
      transform: (doc, ret) => {
        delete ret.token_hash;
        delete ret.__v;
        return ret;
      },
    },
  }
);

const PasswordResetToken = mongoose.model('PasswordResetToken', passwordResetTokenSchema);

module.exports = PasswordResetToken;
