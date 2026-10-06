const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const requireAuth = require('../middleware/requireAuth');
const rateLimit = require('express-rate-limit');

// Rate Limiting specifically for AI endpoint (20 requests per 15 min per user/IP)
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many AI Assistant requests. Please wait a few minutes before asking more questions.',
  },
});

// All AI routes require verified authentication
router.use(requireAuth);

router.post('/chat', aiLimiter, aiController.chatWithAi);
router.get('/history', aiController.getChatHistory);
router.delete('/history', aiController.clearChatHistory);

module.exports = router;
