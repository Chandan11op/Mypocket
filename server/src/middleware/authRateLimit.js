const rateLimit = require('express-rate-limit');

/**
 * Standardized JSON response for rate limit hits
 */
const rateLimitMessage = (customMsg) => ({
  success: false,
  message: customMsg || 'Too many attempts. Please try again later.',
});

// Login limiter (10 attempts per 15 min)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitMessage('Too many login attempts from this IP. Please try again after 15 minutes.'),
});

// Registration limiter (15 per hour)
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitMessage('Too many accounts created from this IP. Please try again in an hour.'),
});

// Password Reset request limiter (6 per hour)
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 6,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitMessage('Too many password reset requests. Please try again later.'),
});

module.exports = {
  loginLimiter,
  registerLimiter,
  passwordResetLimiter,
};
