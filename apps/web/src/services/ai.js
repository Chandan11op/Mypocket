import api from './api';

export const aiApi = {
  /**
   * Send question to AI Financial Assistant
   * @param {string} message
   */
  sendMessage: (message) => api.post('/ai/chat', { message }),

  /**
   * Fetch chat history for authenticated user
   */
  getHistory: () => api.get('/ai/history'),

  /**
   * Clear chat history for authenticated user
   */
  clearHistory: () => api.delete('/ai/history'),
};

export default aiApi;
