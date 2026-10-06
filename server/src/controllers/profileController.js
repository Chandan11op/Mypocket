const profileService = require('../services/profileService');

/**
 * GET /api/profile
 * Retrieves safe profile of authenticated user
 */
const getProfile = async (req, res, next) => {
  try {
    const user = await profileService.getProfile(req.userId);
    res.status(200).json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/profile
 * Updates authenticated user's profile details
 */
const updateProfile = async (req, res, next) => {
  try {
    const { full_name, username, email, date_of_birth, profile_photo } = req.body;
    const updatedUser = await profileService.updateProfile(req.userId, {
      full_name,
      username,
      email,
      date_of_birth,
      profile_photo,
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: {
        user: updatedUser,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/profile/password
 * Changes password and invalidates active sessions
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password and confirmation password do not match.',
      });
    }

    const result = await profileService.changePassword(
      req.userId,
      currentPassword,
      newPassword
    );

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
};
