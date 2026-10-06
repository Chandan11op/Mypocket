import api from './api';

export const authApi = {
  register: (payload) => api.post('/auth/register', payload),
  login: (credentials) => api.post('/auth/login', credentials),
  getMe: () => api.get('/auth/me'),
  refresh: (refreshToken) => api.post('/auth/refresh', { refresh_token: refreshToken }),
  logout: (refreshToken) => api.post('/auth/logout', { refresh_token: refreshToken }),
  logoutAll: () => api.post('/auth/logout-all'),
  forgotPassword: (identifier) => api.post('/auth/forgot-password', { identifier }),
  resetPassword: (payload) => api.post('/auth/reset-password', payload),
};

export const transactionApi = {
  getSummary: () => api.get('/transactions/summary'),
  getStatement: (params) => api.get('/transactions/statement', { params }),
  getTransactions: (params) => api.get('/transactions', { params }),
  getTransactionById: (id) => api.get(`/transactions/${id}`),
  createTransaction: (payload) => api.post('/accounting/transactions', payload),
  reverseTransaction: (id, reason) => api.post(`/accounting/transactions/${id}/reverse`, { reason }),
  deleteTransaction: (id) => api.delete(`/accounting/transactions/${id}`),
  updateTransaction: (id, payload) => api.put(`/transactions/${id}`, payload),
  exportExcel: (params) =>
    api.get('/transactions/export', {
      params,
      responseType: 'blob',
    }),
};

export const personApi = {
  getPersons: () => api.get('/persons'),
  searchPersons: (query, limit = 10) => api.get('/persons/search', { params: { q: query, limit } }),
};

export const ledgerApi = {
  getLedger: () => api.get('/ledger'),
  getPersonLedger: (personId) => api.get(`/ledger/${personId}`),
};

export const profileApi = {
  getProfile: () => api.get('/profile'),
  updateProfile: (payload) => api.put('/profile', payload),
  changePassword: (payload) => api.put('/profile/password', payload),
};

export const settingsApi = {
  getSettings: () => api.get('/settings'),
  updateSettings: (payload) => api.put('/settings', payload),
};

export const accountApi = {
  getAccounts: () => api.get('/accounts'),
  getAccountById: (id) => api.get(`/accounts/${id}`),
  createAccount: (payload) => api.post('/accounts', payload),
  updateAccount: (id, payload) => api.put(`/accounts/${id}`, payload),
  deleteAccount: (id) => api.delete(`/accounts/${id}`),
  getAccountTransactions: (id, params) => api.get(`/accounts/${id}/transactions`, { params }),
  getFinancialPosition: () => api.get('/financial-position'),
  reconcileAccount: (id, payload) => api.post(`/reconciliation/${id}`, payload),
  getReconciliationLogs: (id) => api.get(`/reconciliation/${id}`),
};

export { aiApi } from './ai';
