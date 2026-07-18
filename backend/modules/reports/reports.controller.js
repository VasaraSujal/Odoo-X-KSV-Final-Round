import rService from './reports.service.js';
import catchAsync from '../../utils/catchAsync.js';
import ApiResponse from '../../utils/ApiResponse.js';
import {
  buildCsv,
  buildExcelBuffer,
  buildPdfBuffer,
} from './reports.export.js';

function resolveExportType(query = {}) {
  const type = String(query.type || 'rentals').toLowerCase();
  return type === 'revenue' ? 'revenue' : 'rentals';
}

class ReportsController {
  getRentals = catchAsync(async (req, res) => {
    const data = await rService.getRentalReport(req.query);
    res.status(200).json(new ApiResponse(200, data, 'Rentals report fetched'));
  });

  getRevenue = catchAsync(async (req, res) => {
    const data = await rService.getRevenueReport(req.query);
    res.status(200).json(new ApiResponse(200, data, 'Revenue report fetched'));
  });

  exportCsv = catchAsync(async (req, res) => {
    const type = resolveExportType(req.query);
    const data = await rService.getExportData(type, req.query);
    const csv = buildCsv(type, data);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${type}-report.csv"`
    );
    res.status(200).send(csv);
  });

  exportExcel = catchAsync(async (req, res) => {
    const type = resolveExportType(req.query);
    const data = await rService.getExportData(type, req.query);
    const buffer = await buildExcelBuffer(type, data, req.query);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${type}-report.xlsx"`
    );
    res.status(200).send(buffer);
  });

  exportPdf = catchAsync(async (req, res) => {
    const type = resolveExportType(req.query);
    const data = await rService.getExportData(type, req.query);
    const buffer = await buildPdfBuffer(type, data, req.query);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${type}-report.pdf"`
    );
    res.status(200).send(buffer);
  });
}

export default new ReportsController();
