const dotenv = require('dotenv');

dotenv.config();

const env = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/mypocket',
  JWT_SECRET: process.env.JWT_SECRET || 'dev_secret_key_change_in_production_32chars',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret_key_change_in_production_32chars',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  CLOUDFLARE_TURNSTILE_SECRET: process.env.CLOUDFLARE_TURNSTILE_SECRET || '',
  RESET_TOKEN_EXPIRY_MINUTES: parseInt(process.env.RESET_TOKEN_EXPIRY_MINUTES || '15', 10),
  AI_PROVIDER: process.env.AI_PROVIDER || 'gemini',
  AI_API_KEY: process.env.AI_API_KEY || '',
  AI_MODEL: process.env.AI_MODEL || 'gemini-3.1-flash-lite',
};

// Validate critical configurations in production
if (env.NODE_ENV === 'production') {
  if (!process.env.MONGODB_URI) {
    throw new Error('FATAL: MONGODB_URI must be defined in production environment.');
  }
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('FATAL: Strong JWT_SECRET (min 32 characters) must be defined in production.');
  }
  if (!process.env.JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET.length < 32) {
    throw new Error('FATAL: Strong JWT_REFRESH_SECRET (min 32 characters) must be defined in production.');
  }
}

module.exports = env;
