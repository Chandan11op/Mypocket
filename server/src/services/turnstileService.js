const env = require('../config/env');

/**
 * Cloudflare Turnstile Verification Service
 */
class TurnstileService {
  /**
   * Verifies the Cloudflare Turnstile token server-side
   * @param {string} token - The turnstile response token from the client
   * @param {string} remoteIp - Optional client IP
   * @returns {Promise<{success: boolean, message?: string}>}
   */
  async verifyToken(token, remoteIp = '') {
    // Development bypass:
    // If we are in development mode, allow bypass when token is omitted or placeholder passed
    if (env.NODE_ENV !== 'production') {
      if (!token || token === 'dummy_token' || !env.CLOUDFLARE_TURNSTILE_SECRET) {
        return { success: true, message: 'Turnstile bypassed in development mode' };
      }
    }

    if (!token) {
      return { success: false, message: 'CAPTCHA token is required' };
    }

    if (!env.CLOUDFLARE_TURNSTILE_SECRET) {
      if (env.NODE_ENV === 'production') {
        throw new Error('CLOUDFLARE_TURNSTILE_SECRET is missing in production environment');
      }
      return { success: true };
    }

    try {
      const postData = new URLSearchParams({
        secret: env.CLOUDFLARE_TURNSTILE_SECRET,
        response: token,
      });

      if (remoteIp) {
        postData.append('remoteip', remoteIp);
      }

      const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: postData.toString(),
      });

      const result = await response.json();

      if (!result.success) {
        return {
          success: false,
          message: 'Cloudflare Turnstile verification failed. Please try again.',
          errorCodes: result['error-codes'],
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Turnstile verification error:', error.message);
      return {
        success: false,
        message: 'Could not complete CAPTCHA verification at this time.',
      };
    }
  }
}

module.exports = new TurnstileService();
