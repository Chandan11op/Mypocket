const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    mobile_number: {
      type: String,
      required: [true, 'Mobile number is required'],
      unique: true,
      trim: true,
      index: true,
    },
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
      index: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    full_name: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxlength: [100, 'Full name cannot exceed 100 characters'],
    },
    date_of_birth: {
      type: Date,
      required: [true, 'Date of birth is required'],
    },
    password_hash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false, // Never return password_hash by default from queries
    },
    profile_photo: {
      type: String,
      default: '',
      trim: true,
    },
    google_id: {
      type: String,
      sparse: true,
      index: true,
      default: null,
    },
    is_verified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
    toJSON: {
      transform: (doc, ret) => {
        delete ret.password_hash;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      transform: (doc, ret) => {
        delete ret.password_hash;
        delete ret.__v;
        return ret;
      },
    },
  }
);

const User = mongoose.model('User', userSchema);

module.exports = User;
