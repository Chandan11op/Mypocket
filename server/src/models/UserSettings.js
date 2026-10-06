const mongoose = require('mongoose');

const userSettingsSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      unique: true,
      index: true,
    },
    theme: {
      type: String,
      enum: ['dark', 'light', 'system'],
      default: 'system',
    },
    currency: {
      type: String,
      trim: true,
      default: 'INR',
      maxlength: 10,
    },
    appearance: {
      type: String,
      default: 'default',
      trim: true,
    },
    date_format: {
      type: String,
      default: 'DD/MM/YYYY',
      trim: true,
    },
    theme_color: {
      type: String,
      default: 'emerald',
      trim: true,
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

const UserSettings = mongoose.model('UserSettings', userSettingsSchema);

module.exports = UserSettings;
