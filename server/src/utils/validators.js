const validator = require('validator');

/**
 * Normalizes a mobile number string (removes non-digit characters except leading plus)
 * @param {string} mobile 
 * @returns {string} Normalized 10-15 digit string
 */
const normalizeMobileNumber = (mobile) => {
  if (!mobile) return '';
  return String(mobile).replace(/[^\d+]/g, '').trim();
};

/**
 * Normalizes email address
 * @param {string} email 
 * @returns {string} Normalized lowercase email
 */
const normalizeEmail = (email) => {
  if (!email) return '';
  return validator.normalizeEmail(String(email).trim(), { lowercase: true }) || String(email).trim().toLowerCase();
};

/**
 * Normalizes username
 * @param {string} username 
 * @returns {string} Lowercase trimmed username
 */
const normalizeUsername = (username) => {
  if (!username) return '';
  return String(username).trim().toLowerCase();
};

/**
 * Validator for Registration payload
 */
const validateRegistration = (body) => {
  const errors = [];
  const {
    mobile_number,
    username,
    email,
    full_name,
    date_of_birth,
    password,
    confirm_password,
  } = body;

  const normMobile = normalizeMobileNumber(mobile_number);
  if (!normMobile || normMobile.length < 10 || normMobile.length > 15) {
    errors.push({ field: 'mobile_number', message: 'Valid mobile number (10-15 digits) is required' });
  }

  const normUsername = normalizeUsername(username);
  if (!normUsername || normUsername.length < 3 || normUsername.length > 30) {
    errors.push({ field: 'username', message: 'Username must be between 3 and 30 characters' });
  } else if (!/^[a-zA-Z0-9._]+$/.test(normUsername)) {
    errors.push({ field: 'username', message: 'Username can only contain letters, numbers, underscores, and dots' });
  }

  if (!email || !validator.isEmail(String(email))) {
    errors.push({ field: 'email', message: 'Valid email address is required' });
  }

  if (!full_name || String(full_name).trim().length < 2) {
    errors.push({ field: 'full_name', message: 'Full name must be at least 2 characters' });
  }

  if (!date_of_birth || isNaN(Date.parse(date_of_birth))) {
    errors.push({ field: 'date_of_birth', message: 'Valid date of birth is required' });
  }

  if (!password || String(password).length < 6) {
    errors.push({ field: 'password', message: 'Password must be at least 6 characters long' });
  }

  if (password !== confirm_password) {
    errors.push({ field: 'confirm_password', message: 'Passwords do not match' });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validator for Login credentials
 */
const validateLogin = (body) => {
  const errors = [];
  const { mobile_number, password } = body;

  const normMobile = normalizeMobileNumber(mobile_number);
  if (!normMobile) {
    errors.push({ field: 'mobile_number', message: 'Mobile number is required' });
  }

  if (!password) {
    errors.push({ field: 'password', message: 'Password is required' });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validator for Forgot Password request
 */
const validateForgotPassword = (body) => {
  const errors = [];
  const { identifier } = body;

  if (!identifier || String(identifier).trim().length < 3) {
    errors.push({ field: 'identifier', message: 'Mobile number or email is required' });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validator for Reset Password with Token
 */
const validateResetPassword = (body) => {
  const errors = [];
  const { reset_token, new_password, confirm_new_password } = body;

  if (!reset_token || String(reset_token).trim().length < 16) {
    errors.push({ field: 'reset_token', message: 'Valid password reset token is required' });
  }

  if (!new_password || String(new_password).length < 6) {
    errors.push({ field: 'new_password', message: 'New password must be at least 6 characters long' });
  }

  if (new_password !== confirm_new_password) {
    errors.push({ field: 'confirm_new_password', message: 'Passwords do not match' });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validator for Creating / Updating Transaction
 */
const validateTransaction = (body) => {
  const errors = [];
  const { type, amount, purpose, date } = body;

  // Type validation: must be income or expense
  if (!type || !['income', 'expense'].includes(String(type).toLowerCase())) {
    errors.push({ field: 'type', message: 'Transaction type must be "income" or "expense"' });
  }

  // Amount validation: strictly positive number
  const numAmount = Number(amount);
  if (amount === undefined || amount === null || isNaN(numAmount) || numAmount <= 0) {
    errors.push({ field: 'amount', message: 'Transaction amount must be a positive number greater than 0' });
  } else if (!isFinite(numAmount) || numAmount > 1000000000) {
    errors.push({ field: 'amount', message: 'Transaction amount exceeds maximum allowable limit' });
  }

  // Purpose validation
  if (!purpose || String(purpose).trim().length === 0) {
    errors.push({ field: 'purpose', message: 'Purpose / description is required' });
  } else if (String(purpose).trim().length > 200) {
    errors.push({ field: 'purpose', message: 'Purpose cannot exceed 200 characters' });
  }

  // Date validation: valid ISO date if provided
  if (date !== undefined && date !== null) {
    if (isNaN(Date.parse(date))) {
      errors.push({ field: 'date', message: 'Invalid transaction date format' });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

module.exports = {
  normalizeMobileNumber,
  normalizeEmail,
  normalizeUsername,
  validateRegistration,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  validateTransaction,
};
