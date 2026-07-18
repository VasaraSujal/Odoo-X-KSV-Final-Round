import api from '@/services/axios';
import { API_ROUTES } from '@/constants/apiRoutes';
import { parseApiResponse } from '@/lib/apiResponse';

const rentalService = {
  async getRentalOrders(params = {}) {
    const response = await api.get(API_ROUTES.RENTAL_ORDERS.LIST, { params });
    return parseApiResponse(response);
  },

  async getRentalOrderById(id) {
    const response = await api.get(API_ROUTES.RENTAL_ORDERS.BY_ID(id));
    return parseApiResponse(response);
  },

  async create(payload) {
    const response = await api.post(API_ROUTES.RENTAL_ORDERS.LIST, payload);
    return parseApiResponse(response);
  },

  async update(id, payload) {
    const response = await api.put(API_ROUTES.RENTAL_ORDERS.BY_ID(id), payload);
    return parseApiResponse(response);
  },

  async updateStatus(id, status) {
    const response = await api.patch(API_ROUTES.RENTAL_ORDERS.STATUS(id), { status });
    return parseApiResponse(response);
  },

  async recalculate(id) {
    const response = await api.post(API_ROUTES.RENTAL_ORDERS.RECALCULATE(id));
    return parseApiResponse(response);
  },

  async remove(id) {
    const response = await api.delete(API_ROUTES.RENTAL_ORDERS.BY_ID(id));
    return parseApiResponse(response);
  },

  async pickup(id, pickupOtp) {
    const response = await api.patch(API_ROUTES.RENTAL_ORDERS.PICKUP(id), { pickupOtp });
    return parseApiResponse(response);
  },

  async returnVehicle(id, payload) {
    const response = await api.patch(API_ROUTES.RENTAL_ORDERS.RETURN(id), payload);
    return parseApiResponse(response);
  },
};

export default rentalService;
