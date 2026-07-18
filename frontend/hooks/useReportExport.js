'use client';

import { useCallback, useState } from 'react';
import reportsService from '@/services/reportsService';
import { buildReportParams, downloadClientCsv } from '@/lib/reports';
import { getErrorMessage } from '@/lib/apiResponse';
import notify from '@/lib/toast';

/**
 * Shared export handler for report pages.
 * Uses backend export APIs for rentals/revenue; client CSV fallback otherwise.
 */
export default function useReportExport({
  exportType = 'rentals',
  filters = {},
  clientRows = null,
  clientColumns = null,
  clientFilename = 'report.csv',
}) {
  const [exporting, setExporting] = useState(null);

  const exportFile = useCallback(
    async (format) => {
      setExporting(format);
      try {
        const backendSupported =
          exportType === 'rentals' || exportType === 'revenue';

        if (format === 'csv' && !backendSupported && clientRows && clientColumns) {
          downloadClientCsv(clientFilename, clientRows, clientColumns);
          notify.success('CSV exported successfully');
          return;
        }

        if (!backendSupported && format !== 'csv') {
          notify.info(
            'PDF and Excel exports are available for Rentals and Revenue reports. Use CSV for this report.'
          );
          return;
        }

        const params = buildReportParams({
          ...filters,
          type: backendSupported ? exportType : 'rentals',
        });

        await reportsService.exportReport(format, params);
        notify.success(`${format.toUpperCase()} export downloaded`);
      } catch (error) {
        notify.error(getErrorMessage(error, 'Export failed'));
      } finally {
        setExporting(null);
      }
    },
    [clientColumns, clientFilename, clientRows, exportType, filters]
  );

  return { exporting, exportFile };
}
