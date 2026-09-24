import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT access token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cp_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If unauthorized on protected routes, redirect to login
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        localStorage.removeItem('cp_access_token');
        localStorage.removeItem('cp_refresh_token');
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (credentials: { username: string; password: string }) => 
    api.post('/auth/login/', credentials),
  register: (userData: any) => 
    api.post('/auth/register/', userData),
  getMe: () => 
    api.get('/auth/me/'),
  updateProfile: (profileData: any) => 
    api.put('/auth/me/', profileData),
};

export const challengeApi = {
  getSummary: () => api.get('/challenge/current/'),
  getCurve: () => api.get('/challenge/curve/'),
  getConfig: () => api.get('/challenge/config/'),
  updateConfig: (data: any) => api.post('/challenge/config/', data),
};

export const tradesApi = {
  getTrades: (params?: any) => api.get('/trades/', { params }),
  getTrade: (id: number) => api.get(`/trades/${id}/`),
  createTrade: (data: any) => api.post('/trades/', data),
  updateTrade: (id: number, data: any) => api.put(`/trades/${id}/`, data),
  deleteTrade: (id: number) => api.delete(`/trades/${id}/`),
  getSummary: () => api.get('/trades/summary/'),
  getOpenPositions: () => api.get('/trades/open_positions/'),
};

export const setupsApi = {
  getSetups: () => api.get('/setups/'),
  getSetup: (id: number) => api.get(`/setups/${id}/`),
  createSetup: (data: any) => api.post('/setups/', data),
  updateSetup: (id: number, data: any) => api.put(`/setups/${id}/`, data),
  deleteSetup: (id: number) => api.delete(`/setups/${id}/`),
};

export const journalApi = {
  getPlans: () => api.get('/journal/'),
  getTodayPlan: () => api.get('/journal/today/'),
  createPlan: (data: any) => api.post('/journal/', data),
  updatePlan: (id: number, data: any) => api.put(`/journal/${id}/`, data),
  deletePlan: (id: number) => api.delete(`/journal/${id}/`),
};

export const riskApi = {
  getSettings: () => api.get('/risk/settings/'),
  updateSettings: (data: any) => api.put('/risk/settings/', data),
  getProfiles: () => api.get('/risk/profiles/'),
  createProfile: (data: any) => api.post('/risk/profiles/', data),
  updateProfile: (id: number, data: any) => api.put(`/risk/profiles/${id}/`, data),
  getLotSizes: () => api.get('/risk/lots/'),
  calculateSize: (data: { index: string; entry_price: number; stop_loss: number; capital?: number }) =>
    api.post('/risk/calculate-size/', data),
  validateFirewall: (tradeData: any) => 
    api.post('/risk/firewall/validate/', tradeData),
};

export const dhanApi = {
  getStatus: () => api.get('/dhan/status/'),
  getAuthStatus: () => api.get('/dhan/auth/status/'),
  syncTrades: () => api.post('/dhan/sync/'),
  reconcileTrades: () => api.get('/dhan/reconcile/'),
  getPositions: () => api.get('/dhan/positions/'),
  getOptionChain: (underlying = 'NIFTY') => api.get(`/dhan/optionchain/?underlying=${underlying}`),
};

export const marketApi = {
  getOverview: () => api.get('/market/overview/'),
};

export const newsApi = {
  getNews: (category?: string) => api.get('/news/', { params: { category } }),
};

export const analyticsApi = {
  getDashboard: () => api.get('/analytics/dashboard/'),
};

export const scenarioApi = {
  calculateScenarios: (params: any) => api.post('/scenario/calculate/', params),
  runMonteCarlo: (params: any) => api.post('/scenario/monte-carlo/', params),
};

export const coachApi = {
  getInsights: () => api.get('/coach/insights/'),
  getReviews: () => api.get('/coach/reviews/'),
};

export const notificationsApi = {
  getNotifications: () => api.get('/notifications/'),
  getUnreadCount: () => api.get('/notifications/unread_count/'),
  markRead: (id: number) => api.post(`/notifications/${id}/mark_read/`),
  markAllRead: () => api.post('/notifications/mark_all_read/'),
};

export default api;
