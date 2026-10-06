const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    refresh_token_hash: {
      type: String,
      required: [true, 'Refresh token hash is required'],
      index: true,
    },
    device_type: {
      type: String,
      enum: ['web', 'android', 'ios', 'unknown'],
      default: 'unknown',
    },
    device_name: {
      type: String,
      default: 'Unknown Device',
      trim: true,
      maxlength: 100,
    },
    ip_address: {
      type: String,
      default: '',
    },
    user_agent: {
      type: String,
      default: '',
    },
    expires_at: {
      type: Date,
      required: [true, 'Session expiration date is required'],
      index: { expires: 0 }, // TTL index to auto-delete expired sessions
    },
    revoked_at: {
      type: Date,
      default: null,
    },
    last_used_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
    toJSON: {
      transform: (doc, ret) => {
        delete ret.refresh_token_hash;
        delete ret.__v;
        return ret;
      },
    },
  }
);

sessionSchema.index({ user_id: 1, revoked_at: 1 });

const Session = mongoose.model('Session', sessionSchema);

module.exports = Session;
