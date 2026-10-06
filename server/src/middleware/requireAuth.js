const { verifyAccessToken } = require('../utils/tokenUtils');
const { User } = require('../models');

/**
 * Authentication Middleware: Validates access token and attaches authenticated user
 * 
 * Strict Security Rules:
 * - Checks Authorization: Bearer <token> header (standard for Android & APIs)
 * - Also checks HTTP-only 'access_token' cookie (standard for Web)
 * - Resolves user from verified token payload
 * - Rejects request if user does not exist
 * - NEVER trusts req.body.user_id
 */
const requireAuth = async (req, res, next) => {
  try {
    let token = null;

    // 1. Check Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    // 2. If no header, check HTTP-only cookie
    if (!token && req.cookies && req.cookies.access_token) {
      token = req.cookies.access_token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No access token provided.',
      });
    }

    // 3. Verify access token signature and expiration
    const decoded = verifyAccessToken(token);
    if (!decoded || !decoded.sub) {
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token payload.',
      });
    }

    // 4. Fetch user from database
    const user = await User.findById(decoded.sub);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User belonging to this token no longer exists.',
      });
    }

    // 5. Attach user object and explicit verified userId to request
    req.user = user;
    req.userId = user._id.toString();

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Access token expired. Please refresh your session.',
        code: 'TOKEN_EXPIRED',
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid authentication token.',
    });
  }
};

module.exports = requireAuth;
