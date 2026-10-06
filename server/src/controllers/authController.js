const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { User, UserSettings, Session, PasswordResetToken } = require('../models');
const env = require('../config/env');
const turnstileService = require('../services/turnstileService');
const {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
} = require('../utils/tokenUtils');
const {
  normalizeMobileNumber,
  normalizeEmail,
  normalizeUsername,
} = require('../utils/validators');

/**
 * Cookie options helper for web sessions
 */
const getCookieOptions = (maxAgeMs) => ({
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax',
  maxAge: maxAgeMs,
});

/**
 * Helper to parse client device information
 */
const parseDeviceInfo = (req) => {
  const userAgent = req.headers['user-agent'] || '';
  const clientHeader = req.headers['x-client-type'] || '';
  
  let deviceType = 'web';
  if (clientHeader.toLowerCase().includes('android') || userAgent.toLowerCase().includes('android')) {
    deviceType = 'android';
  } else if (clientHeader.toLowerCase().includes('ios') || userAgent.toLowerCase().includes('iphone')) {
    deviceType = 'ios';
  }

  const ipAddress = req.ip || req.connection?.remoteAddress || '';
  return {
    device_type: deviceType,
    device_name: req.headers['x-device-name'] || `${deviceType.toUpperCase()} Device`,
    ip_address: ipAddress,
    user_agent: userAgent,
  };
};

/**
 * Creates authenticated session, stores hashed refresh token, sets cookies & returns tokens
 */
const createSessionAndTokens = async (user, req, res) => {
  const userId = user._id.toString();
  const accessToken = generateAccessToken(userId);
  const rawRefreshToken = generateRefreshToken();
  const refreshTokenHash = hashToken(rawRefreshToken);

  const expiresDays = parseInt(env.JWT_REFRESH_EXPIRES_IN) || 7;
  const sessionExpiresAt = new Date(Date.now() + expiresDays * 24 * 60 * 60 * 1000);
  const deviceInfo = parseDeviceInfo(req);

  // Save session in database
  const session = await Session.create({
    user_id: user._id,
    refresh_token_hash: refreshTokenHash,
    device_type: deviceInfo.device_type,
    device_name: deviceInfo.device_name,
    ip_address: deviceInfo.ip_address,
    user_agent: deviceInfo.user_agent,
    expires_at: sessionExpiresAt,
  });

  // Set HTTP-only cookies for Web clients
  res.cookie('access_token', accessToken, getCookieOptions(15 * 60 * 1000)); // 15 mins
  res.cookie('refresh_token', rawRefreshToken, getCookieOptions(expiresDays * 24 * 60 * 60 * 1000));

  return {
    accessToken,
    refreshToken: rawRefreshToken,
    sessionId: session._id,
    user: {
      id: user._id,
      mobile_number: user.mobile_number,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      date_of_birth: user.date_of_birth,
      profile_photo: user.profile_photo,
    },
  };
};

// ==========================================
// CONTROLLER ACTIONS
// ==========================================

/**
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const {
      mobile_number,
      username,
      email,
      full_name,
      date_of_birth,
      password,
      turnstile_token,
    } = req.body;

    // 1. Verify Turnstile token
    const turnstileResult = await turnstileService.verifyToken(turnstile_token, req.ip);
    if (!turnstileResult.success) {
      return res.status(400).json({
        success: false,
        message: turnstileResult.message,
      });
    }

    const normMobile = normalizeMobileNumber(mobile_number);
    const normUsername = normalizeUsername(username);
    const normEmail = normalizeEmail(email);

    // 2. Uniqueness checks
    const existingMobile = await User.findOne({ mobile_number: normMobile });
    if (existingMobile) {
      return res.status(409).json({
        success: false,
        message: 'An account with this mobile number already exists',
        field: 'mobile_number',
      });
    }

    const existingUsername = await User.findOne({ username: normUsername });
    if (existingUsername) {
      return res.status(409).json({
        success: false,
        message: 'This username is already taken',
        field: 'username',
      });
    }

    const existingEmail = await User.findOne({ email: normEmail });
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists',
        field: 'email',
      });
    }

    // 3. Hash password with bcrypt
    const salt = await bcrypt.genSalt(12);
    const password_hash = await bcrypt.hash(password, salt);

    // 4. Create User
    const user = await User.create({
      mobile_number: normMobile,
      username: normUsername,
      email: normEmail,
      full_name: full_name.trim(),
      date_of_birth: new Date(date_of_birth),
      password_hash,
      is_verified: true,
    });

    // 5. Initialize default UserSettings
    await UserSettings.create({
      user_id: user._id,
      theme: 'system',
      currency: 'INR',
      appearance: 'default',
      date_format: 'DD/MM/YYYY',
      theme_color: 'emerald',
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please proceed to login.',
      data: {
        user: {
          id: user._id,
          mobile_number: user.mobile_number,
          username: user.username,
          email: user.email,
          full_name: user.full_name,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/login
 * Streamlined Login: Validates mobile + password and creates authenticated session directly
 */
const login = async (req, res, next) => {
  try {
    const { mobile_number, password } = req.body;
    const normMobile = normalizeMobileNumber(mobile_number);

    // 1. Find user by mobile number (select password_hash explicitly)
    const user = await User.findOne({ mobile_number: normMobile }).select('+password_hash');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid mobile number or password',
      });
    }

    // 2. Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid mobile number or password',
      });
    }

    // 3. Create Session & issue tokens directly (NO OTP)
    const sessionData = await createSessionAndTokens(user, req, res);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: sessionData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/refresh
 * Rotates refresh token and issues new access token
 */
const refresh = async (req, res, next) => {
  try {
    // 1. Extract raw refresh token from body or cookie
    let rawRefreshToken = req.body.refresh_token;
    if (!rawRefreshToken && req.cookies && req.cookies.refresh_token) {
      rawRefreshToken = req.cookies.refresh_token;
    }

    if (!rawRefreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token is required',
      });
    }

    // 2. Look up active session
    const incomingHash = hashToken(rawRefreshToken);
    const session = await Session.findOne({
      refresh_token_hash: incomingHash,
      revoked_at: null,
    });

    if (!session) {
      res.clearCookie('access_token');
      res.clearCookie('refresh_token');
      return res.status(401).json({
        success: false,
        message: 'Invalid or revoked session. Please log in again.',
      });
    }

    // Check expiration
    if (new Date() > session.expires_at) {
      session.revoked_at = new Date();
      await session.save();
      res.clearCookie('access_token');
      res.clearCookie('refresh_token');
      return res.status(401).json({
        success: false,
        message: 'Session has expired. Please log in again.',
      });
    }

    // Fetch user
    const user = await User.findById(session.user_id);
    if (!user) {
      session.revoked_at = new Date();
      await session.save();
      return res.status(401).json({
        success: false,
        message: 'User account no longer exists',
      });
    }

    // 3. Rotate refresh token for security
    const newRawRefreshToken = generateRefreshToken();
    const newRefreshTokenHash = hashToken(newRawRefreshToken);
    const newAccessToken = generateAccessToken(user._id.toString());

    session.refresh_token_hash = newRefreshTokenHash;
    session.last_used_at = new Date();
    await session.save();

    // 4. Update cookies
    const expiresDays = parseInt(env.JWT_REFRESH_EXPIRES_IN) || 7;
    res.cookie('access_token', newAccessToken, getCookieOptions(15 * 60 * 1000));
    res.cookie('refresh_token', newRawRefreshToken, getCookieOptions(expiresDays * 24 * 60 * 60 * 1000));

    res.status(200).json({
      success: true,
      message: 'Session refreshed successfully',
      data: {
        accessToken: newAccessToken,
        refreshToken: newRawRefreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me
 * Retrieves current authenticated user profile
 */
const getMe = async (req, res, next) => {
  try {
    const user = req.user;
    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          mobile_number: user.mobile_number,
          username: user.username,
          email: user.email,
          full_name: user.full_name,
          date_of_birth: user.date_of_birth,
          profile_photo: user.profile_photo,
          is_verified: user.is_verified,
          created_at: user.created_at,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/logout
 * Revokes current device session
 */
const logout = async (req, res, next) => {
  try {
    let rawRefreshToken = req.body.refresh_token;
    if (!rawRefreshToken && req.cookies && req.cookies.refresh_token) {
      rawRefreshToken = req.cookies.refresh_token;
    }

    if (rawRefreshToken) {
      const incomingHash = hashToken(rawRefreshToken);
      await Session.findOneAndUpdate(
        { refresh_token_hash: incomingHash },
        { revoked_at: new Date() }
      );
    }

    res.clearCookie('access_token');
    res.clearCookie('refresh_token');

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/logout-all
 * Revokes all active sessions for current authenticated user
 */
const logoutAll = async (req, res, next) => {
  try {
    const userId = req.userId;
    await Session.updateMany(
      { user_id: userId, revoked_at: null },
      { revoked_at: new Date() }
    );

    res.clearCookie('access_token');
    res.clearCookie('refresh_token');

    res.status(200).json({
      success: true,
      message: 'Successfully logged out from all devices',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/forgot-password
 * Generates cryptographically secure, time-limited reset token
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { identifier } = req.body;
    const isEmail = identifier.includes('@');
    const normIdentifier = isEmail ? normalizeEmail(identifier) : normalizeMobileNumber(identifier);

    const query = isEmail ? { email: normIdentifier } : { mobile_number: normIdentifier };
    const user = await User.findOne(query);

    const genericResponse = {
      success: true,
      message: 'If an account exists with this identifier, a password reset link/token has been generated.',
    };

    if (!user) {
      return res.status(200).json(genericResponse);
    }

    // Invalidate any existing unused reset tokens for this user
    await PasswordResetToken.deleteMany({ user_id: user._id });

    // Generate random 64-character token
    const rawResetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(rawResetToken);
    const expiryMinutes = env.RESET_TOKEN_EXPIRY_MINUTES || 15;
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    await PasswordResetToken.create({
      user_id: user._id,
      token_hash: tokenHash,
      is_used: false,
      expires_at: expiresAt,
    });

    const responsePayload = {
      ...genericResponse,
    };

    // ONLY expose reset_token in development for local testing
    if (env.NODE_ENV !== 'production') {
      responsePayload.dev_reset_token = rawResetToken;
      console.log(`\n🔑 [DEV PASSWORD RESET TOKEN]: ${rawResetToken} (Expires in ${expiryMinutes}m)\n`);
    }

    res.status(200).json(responsePayload);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/reset-password
 * Resets password using valid reset token and revokes previous sessions
 */
const resetPassword = async (req, res, next) => {
  try {
    const { reset_token, new_password } = req.body;
    const incomingTokenHash = hashToken(reset_token);

    // 1. Locate token
    const tokenDoc = await PasswordResetToken.findOne({
      token_hash: incomingTokenHash,
      is_used: false,
    });

    if (!tokenDoc) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or already used password reset token.',
      });
    }

    // Check expiration
    if (new Date() > tokenDoc.expires_at) {
      await PasswordResetToken.deleteOne({ _id: tokenDoc._id });
      return res.status(400).json({
        success: false,
        message: 'Password reset token has expired. Please request a new one.',
      });
    }

    // 2. Fetch user
    const user = await User.findById(tokenDoc.user_id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.',
      });
    }

    // 3. Hash new password and update user
    const salt = await bcrypt.genSalt(12);
    user.password_hash = await bcrypt.hash(new_password, salt);
    await user.save();

    // 4. Mark reset token as used & delete it
    tokenDoc.is_used = true;
    await tokenDoc.save();
    await PasswordResetToken.deleteOne({ _id: tokenDoc._id });

    // 5. Revoke all active sessions for security
    await Session.updateMany(
      { user_id: user._id, revoked_at: null },
      { revoked_at: new Date() }
    );

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. Please log in with your new password.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  refresh,
  getMe,
  logout,
  logoutAll,
  forgotPassword,
  resetPassword,
};
