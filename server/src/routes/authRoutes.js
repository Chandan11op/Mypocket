const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const validate = require('../middleware/validate');
const requireAuth = require('../middleware/requireAuth');
const {
  loginLimiter,
  registerLimiter,
  passwordResetLimiter,
} = require('../middleware/authRateLimit');
const {
  validateRegistration,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
} = require('../utils/validators');

// Public Authentication Routes
router.post(
  '/register',
  registerLimiter,
  validate(validateRegistration),
  authController.register
);

router.post(
  '/login',
  loginLimiter,
  validate(validateLogin),
  authController.login
);

router.post(
  '/refresh',
  authController.refresh
);

router.post(
  '/forgot-password',
  passwordResetLimiter,
  validate(validateForgotPassword),
  authController.forgotPassword
);

router.post(
  '/reset-password',
  passwordResetLimiter,
  validate(validateResetPassword),
  authController.resetPassword
);

router.post(
  '/logout',
  authController.logout
);

// Protected Authentication Routes
router.get(
  '/me',
  requireAuth,
  authController.getMe
);

router.post(
  '/logout-all',
  requireAuth,
  authController.logoutAll
);

module.exports = router;
