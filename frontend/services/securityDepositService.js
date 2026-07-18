import api from '@/services/axios';
import { API_ROUTES } from '@/constants/apiRoutes';
import { parseApiResponse } from '@/lib/apiResponse';

const securityDepositService = {
  async getDeposits(params = {}) {
    const response = await api.get(API_ROUTES.SECURITY_DEPOSITS.LIST, { params });
    return parseApiResponse(response);
  },

  async getById(id) {
    const response = await api.get(API_ROUTES.SECURITY_DEPOSITS.BY_ID(id));
    return parseApiResponse(response);
  },

  async create(payload) {
    const response = await api.post(API_ROUTES.SECURITY_DEPOSITS.LIST, payload);
    return parseApiResponse(response);
  },

  async update(id, payload) {
    const response = await api.put(API_ROUTES.SECURITY_DEPOSITS.BY_ID(id), payload);
    return parseApiResponse(response);
  },

  async refund(id, payload) {
    const response = await api.post(API_ROUTES.SECURITY_DEPOSITS.REFUND(id), payload);
    return parseApiResponse(response);
  },
};

export default securityDepositService;
