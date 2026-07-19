import api from '@/services/axios';
import { API_ROUTES } from '@/constants/apiRoutes';
import { parseApiResponse } from '@/lib/apiResponse';

const userService = {
  async getProfile() {
    const response = await api.get(API_ROUTES.USERS.PROFILE);
    return parseApiResponse(response);
  },

  async updateProfile(payload) {
    const response = await api.put(API_ROUTES.USERS.PROFILE, payload);
    return parseApiResponse(response);
  },

  async getUsers(params = {}) {
    const response = await api.get(API_ROUTES.USERS.LIST, { params });
    return parseApiResponse(response);
  },

  async getById(id) {
    const response = await api.get(API_ROUTES.USERS.BY_ID(id));
    return parseApiResponse(response);
  },

  async updateUser(id, payload) {
    const response = await api.put(API_ROUTES.USERS.BY_ID(id), payload);
    return parseApiResponse(response);
  },

  async remove(id) {
    const response = await api.delete(API_ROUTES.USERS.BY_ID(id));
    return parseApiResponse(response);
  },
};

export default userService;
