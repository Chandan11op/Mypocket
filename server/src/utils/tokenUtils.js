const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const env = require('../config/env');

/**
 * Generate a short-lived access token
 * Payload contains only minimal, non-sensitive identifier (userId)
 * @param {string} userId
 * @returns {string} Signed JWT Access Token
 */
const generateAccessToken = (userId) => {
  return jwt.sign({ sub: userId }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
};

/**
 * Generate a cryptographically secure random refresh token string
 * @returns {string} Raw opaque refresh token
 */
const generateRefreshToken = () => {
  return crypto.randomBytes(40).toString('hex');
};

/**
 * Hash refresh token / reset token with SHA-256 before database storage
 * @param {string} token
 * @returns {string} Hex hash
 */
const hashToken = (tokenOrOtp) => {
  return crypto.createHash('sha256').update(String(tokenOrOtp)).digest('hex');
};

/**
 * Verify JWT Access Token
 * @param {string} token
 * @returns {object} Decoded token payload
 */
const verifyAccessToken = (token) => {
  return jwt.verify(token, env.JWT_SECRET);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  verifyAccessToken,
};
