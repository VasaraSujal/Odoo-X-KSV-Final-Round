import api from '@/services/axios';
import { API_ROUTES } from '@/constants/apiRoutes';
import { parseApiResponse } from '@/lib/apiResponse';

const settingsService = {
  async getSettings() {
    const response = await api.get(API_ROUTES.SETTINGS.ROOT);
    return parseApiResponse(response);
  },

  async updateSettings(payload) {
    const response = await api.put(API_ROUTES.SETTINGS.ROOT, payload);
    return parseApiResponse(response);
  },
};

export default settingsService;
