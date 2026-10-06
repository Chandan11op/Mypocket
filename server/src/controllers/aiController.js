const { ChatHistory } = require('../models');
const { generateUserFinancialSummary } = require('../services/financialSummaryService');
const aiService = require('../services/aiService');

/**
 * POST /api/ai/chat
 * Generates compact user summary, queries AI service abstraction, and saves chat history
 */
const chatWithAi = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { message } = req.body;

    // Validation
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'A valid text message query is required.',
      });
    }

    const cleanMessage = message.trim();
    if (cleanMessage.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Message exceeds maximum length limit of 500 characters.',
      });
    }

    // 1. Fetch compact financial summary (strictly user-scoped)
    const financialSummary = await generateUserFinancialSummary(userId);

    // 2. Fetch recent conversation history for this user
    const recentHistory = await ChatHistory.find({ user_id: userId })
      .sort({ created_at: -1 })
      .limit(6)
      .lean();

    // 3. Query AI Service
    let aiResponseText = '';
    try {
      aiResponseText = await aiService.getFinancialGuidance(
        financialSummary,
        cleanMessage,
        recentHistory.reverse()
      );
    } catch (aiErr) {
      if (aiErr.code === 'AI_NOT_CONFIGURED' || aiErr.statusCode === 503) {
        return res.status(503).json({
          success: false,
          message: 'AI Financial Assistant is currently not configured on the server. Please set AI_API_KEY in environment variables.',
          code: 'AI_NOT_CONFIGURED',
        });
      }
      throw aiErr;
    }

    // 4. Persist conversation turn in ChatHistory sequentially to guarantee deterministic chronological ordering
    await ChatHistory.create({
      user_id: userId,
      role: 'user',
      message: cleanMessage,
    });
    await ChatHistory.create({
      user_id: userId,
      role: 'assistant',
      message: aiResponseText,
    });

    res.status(200).json({
      success: true,
      message: aiResponseText,
      data: {
        reply: aiResponseText,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/ai/history
 * Retrieves authenticated user's chat history
 */
const getChatHistory = async (req, res, next) => {
  try {
    const userId = req.userId;
    const history = await ChatHistory.find({ user_id: userId })
      .sort({ created_at: 1 })
      .limit(50)
      .lean();

    res.status(200).json({
      success: true,
      data: {
        history: history.map((item) => ({
          id: item._id,
          role: item.role,
          message: item.message,
          created_at: item.created_at,
        })),
        total: history.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/ai/history
 * Clears chat history for authenticated user only
 */
const clearChatHistory = async (req, res, next) => {
  try {
    const userId = req.userId;
    await ChatHistory.deleteMany({ user_id: userId });

    res.status(200).json({
      success: true,
      message: 'Chat history cleared successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  chatWithAi,
  getChatHistory,
  clearChatHistory,
};
