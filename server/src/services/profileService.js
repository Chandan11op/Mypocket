const bcrypt = require('bcryptjs');
const { User, Session } = require('../models');

/**
 * Service to fetch safe profile info for authenticated user
 * @param {string} userId
 */
const getProfile = async (userId) => {
  const user = await User.findById(userId).select('-password_hash');
  if (!user) {
    const error = new Error('User account not found');
    error.statusCode = 404;
    throw error;
  }
  return user;
};

/**
 * Service to update profile details (full_name, username, email, date_of_birth, profile_photo)
 * @param {string} userId
 * @param {object} updateData
 */
const updateProfile = async (userId, updateData) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User account not found');
    error.statusCode = 404;
    throw error;
  }

  const { full_name, username, email, date_of_birth, profile_photo } = updateData;

  // Validate and check unique username
  if (username !== undefined) {
    const cleanUsername = String(username).trim().toLowerCase();
    if (!cleanUsername || cleanUsername.length < 3 || cleanUsername.length > 30) {
      const error = new Error('Username must be between 3 and 30 characters.');
      error.statusCode = 400;
      throw error;
    }

    if (cleanUsername !== user.username) {
      const existingUser = await User.findOne({ username: cleanUsername, _id: { $ne: userId } });
      if (existingUser) {
        const error = new Error('Username is already taken by another account.');
        error.statusCode = 409;
        throw error;
      }
      user.username = cleanUsername;
    }
  }

  // Validate and check unique email
  if (email !== undefined) {
    const cleanEmail = String(email).trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      const error = new Error('Please provide a valid email address.');
      error.statusCode = 400;
      throw error;
    }

    if (cleanEmail !== user.email) {
      const existingEmail = await User.findOne({ email: cleanEmail, _id: { $ne: userId } });
      if (existingEmail) {
        const error = new Error('Email address is already in use by another account.');
        error.statusCode = 409;
        throw error;
      }
      user.email = cleanEmail;
    }
  }

  // Full Name
  if (full_name !== undefined) {
    const cleanName = String(full_name).trim();
    if (!cleanName || cleanName.length > 100) {
      const error = new Error('Full name is required and cannot exceed 100 characters.');
      error.statusCode = 400;
      throw error;
    }
    user.full_name = cleanName;
  }

  // Date of Birth
  if (date_of_birth !== undefined) {
    const dob = new Date(date_of_birth);
    if (isNaN(dob.getTime())) {
      const error = new Error('Please provide a valid date of birth.');
      error.statusCode = 400;
      throw error;
    }
    user.date_of_birth = dob;
  }

  // Profile photo (URL or safe relative path or base64 data uri under 500KB)
  if (profile_photo !== undefined) {
    if (typeof profile_photo === 'string') {
      const cleanPhoto = profile_photo.trim();
      // Enforce max length constraint
      if (cleanPhoto.length > 500000) {
        const error = new Error('Profile photo payload exceeds maximum size limit.');
        error.statusCode = 400;
        throw error;
      }
      user.profile_photo = cleanPhoto;
    }
  }

  await user.save();
  return user;
};

/**
 * Service to change password
 * Verifies current password, hashes new password with bcrypt, and invalidates all other active sessions
 * @param {string} userId
 * @param {string} currentPassword
 * @param {string} newPassword
 */
const changePassword = async (userId, currentPassword, newPassword) => {
  if (!currentPassword || !newPassword) {
    const error = new Error('Current password and new password are required.');
    error.statusCode = 400;
    throw error;
  }

  if (newPassword.length < 8) {
    const error = new Error('New password must be at least 8 characters long.');
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findById(userId).select('+password_hash');
  if (!user) {
    const error = new Error('User account not found');
    error.statusCode = 404;
    throw error;
  }

  // Verify current password with bcrypt
  const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
  if (!isMatch) {
    const error = new Error('Incorrect current password.');
    error.statusCode = 401;
    throw error;
  }

  // Hash new password
  const salt = await bcrypt.genSalt(10);
  user.password_hash = await bcrypt.hash(newPassword, salt);
  await user.save();

  // Invalidate all active sessions for this user across devices for security
  await Session.deleteMany({ user_id: userId });

  return { message: 'Password updated successfully. All active sessions have been invalidated.' };
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
};
