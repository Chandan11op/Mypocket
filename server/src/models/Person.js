const mongoose = require('mongoose');

const personSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Person name is required'],
      trim: true,
      maxlength: [100, 'Person name cannot exceed 100 characters'],
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

// Compound Unique Index: Ensure person name is unique per user (case-insensitive collation or unique pair)
personSchema.index({ user_id: 1, name: 1 }, { unique: true });

const Person = mongoose.model('Person', personSchema);

module.exports = Person;
