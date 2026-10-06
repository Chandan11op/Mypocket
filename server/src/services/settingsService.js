const { UserSettings } = require('../models');

/**
 * Default settings configuration
 */
const DEFAULT_SETTINGS = {
  theme: 'system',
  currency: 'INR',
  appearance: 'default',
  date_format: 'DD/MM/YYYY',
  theme_color: 'emerald',
};

/**
 * Retrieves settings for a user. If not yet present, auto-creates default document.
 * @param {string} userId
 */
const getSettings = async (userId) => {
  let settings = await UserSettings.findOne({ user_id: userId });

  if (!settings) {
    settings = await UserSettings.create({
      user_id: userId,
      ...DEFAULT_SETTINGS,
    });
  }

  return settings;
};

/**
 * Updates settings for a user
 * @param {string} userId
 * @param {object} updateData
 */
const updateSettings = async (userId, updateData) => {
  const allowedFields = ['theme', 'currency', 'appearance', 'date_format', 'theme_color'];
  const updatePayload = {};

  allowedFields.forEach((field) => {
    if (updateData[field] !== undefined) {
      updatePayload[field] = updateData[field];
    }
  });

  // Validate theme enum if present
  if (updatePayload.theme && !['dark', 'light', 'system'].includes(updatePayload.theme)) {
    const error = new Error('Invalid theme option. Allowed values: dark, light, system.');
    error.statusCode = 400;
    throw error;
  }

  const settings = await UserSettings.findOneAndUpdate(
    { user_id: userId },
    { $set: updatePayload },
    { new: true, upsert: true, runValidators: true }
  );

  return settings;
};

module.exports = {
  getSettings,
  updateSettings,
  DEFAULT_SETTINGS,
};
