import api from '@/services/axios';
import { API_ROUTES } from '@/constants/apiRoutes';
import { getResponseData, parseApiResponse } from '@/lib/apiResponse';
import { clearAuthStorage, getUser, setToken, setUser } from '@/utils/storage';

/**
 * Authentication service — maps to /api/auth endpoints.
 */
const authService = {
  async login(credentials, options = {}) {
    const { rememberMe = true, ...payload } = credentials;
    const response = await api.post(API_ROUTES.AUTH.LOGIN, payload);
    const parsed = parseApiResponse(response);
    const { user, token } = parsed.data || {};
    const remember = options.remember ?? rememberMe;

    if (token) setToken(token, { remember });
    if (user) setUser(user, { remember });

    return parsed;
  },

  async register(payload) {
    const response = await api.post(API_ROUTES.AUTH.REGISTER, payload);
    return parseApiResponse(response);
  },

  async logout() {
    try {
      await api.post(API_ROUTES.AUTH.LOGOUT);
    } finally {
      clearAuthStorage();
    }

    return {
      success: true,
      message: 'Logout successful',
      data: null,
    };
  },

  getCurrentUser() {
    return getUser();
  },

  async refreshProfile() {
    const response = await api.get(API_ROUTES.AUTH.ME);
    const user = getResponseData(response);
    if (user) setUser(user);
    return parseApiResponse(response);
  },

  async changePassword(payload) {
    const response = await api.post(API_ROUTES.AUTH.CHANGE_PASSWORD, payload);
    return parseApiResponse(response);
  },
};

export default authService;
