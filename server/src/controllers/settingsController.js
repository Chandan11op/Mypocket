const settingsService = require('../services/settingsService');

/**
 * GET /api/settings
 * Retrieves user preferences with automatic default fallback
 */
const getSettings = async (req, res, next) => {
  try {
    const settings = await settingsService.getSettings(req.userId);
    res.status(200).json({
      success: true,
      data: {
        settings,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/settings
 * Updates user preferences
 */
const updateSettings = async (req, res, next) => {
  try {
    const { theme, currency, appearance, date_format, theme_color } = req.body;
    const settings = await settingsService.updateSettings(req.userId, {
      theme,
      currency,
      appearance,
      date_format,
      theme_color,
    });

    res.status(200).json({
      success: true,
      message: 'Settings updated successfully.',
      data: {
        settings,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSettings,
  updateSettings,
};
