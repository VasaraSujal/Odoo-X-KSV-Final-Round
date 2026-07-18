import api from '@/services/axios';
import { API_ROUTES } from '@/constants/apiRoutes';
import { parseApiResponse } from '@/lib/apiResponse';

const EXPORT_ROUTES = {
  csv: API_ROUTES.REPORTS.EXPORT_CSV,
  excel: API_ROUTES.REPORTS.EXPORT_EXCEL,
  pdf: API_ROUTES.REPORTS.EXPORT_PDF,
};

const EXTENSIONS = {
  csv: 'csv',
  excel: 'xlsx',
  pdf: 'pdf',
};

function triggerDownload(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

const reportsService = {
  async getRentalReport(params = {}) {
    const response = await api.get(API_ROUTES.REPORTS.RENTALS, { params });
    return parseApiResponse(response);
  },

  async getRevenueReport(params = {}) {
    const response = await api.get(API_ROUTES.REPORTS.REVENUE, { params });
    return parseApiResponse(response);
  },

  /**
   * Download a report export from the backend (CSV / Excel / PDF).
   * Backend export `type` supports: rentals | revenue.
   */
  async exportReport(format, params = {}) {
    const route = EXPORT_ROUTES[format];
    if (!route) {
      throw new Error(`Unsupported export format: ${format}`);
    }

    const response = await api.get(route, {
      params,
      responseType: 'blob',
    });

    const contentType = response.headers?.['content-type'] || '';
    if (contentType.includes('application/json')) {
      const text = await response.data.text();
      let message = 'Export failed';
      try {
        message = JSON.parse(text)?.message || message;
      } catch {
        /* ignore */
      }
      throw new Error(message);
    }

    const type = params.type || 'rentals';
    const filename = `${type}-report.${EXTENSIONS[format]}`;
    triggerDownload(response.data, filename);

    return { success: true, message: `${format.toUpperCase()} export downloaded`, data: null };
  },
};

export default reportsService;
