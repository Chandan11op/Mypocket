const mongoose = require('mongoose');
const env = require('./env');

/**
 * Sanitizes MongoDB connection URI to mask credentials in logs
 * @param {string} uri 
 * @returns {string} Safe URI for logging
 */
const sanitizeMongoUri = (uri) => {
  if (!uri) return 'undefined';
  return uri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
};

/**
 * Reusable MongoDB connection manager with resilient retry & listener logging
 */
const connectDB = async (retries = 3, delayMs = 3000) => {
  // Set up connection event listeners once
  if (!mongoose.connection.listeners('error').length) {
    mongoose.connection.on('error', (err) => {
      console.error(`❌ MongoDB Runtime Error: ${err.message}`);
    });
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected.');
    });
    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected successfully.');
    });
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const conn = await mongoose.connect(env.MONGODB_URI, {
        autoIndex: env.NODE_ENV !== 'production',
        serverSelectionTimeoutMS: 8000,
        connectTimeoutMS: 10000,
      });

      console.log(`✅ MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
      return conn;
    } catch (error) {
      console.error(`❌ MongoDB Connection Attempt ${attempt}/${retries} Failed: ${error.message}`);
      if (attempt < retries) {
        console.log(`⏳ Retrying in ${delayMs / 1000}s...`);
        await new Promise((res) => setTimeout(res, delayMs));
      } else {
        throw error;
      }
    }
  }
};

module.exports = connectDB;
