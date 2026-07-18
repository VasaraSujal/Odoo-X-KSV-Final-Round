/**
 * Shared helpers for building real CSV / Excel / PDF report exports.
 */

function money(value) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function formatMoney(value) {
  return money(value).toFixed(2);
}

function formatDate(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function formatDateTime(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().replace('T', ' ').slice(0, 19);
}

function customerName(customer) {
  if (!customer) return '';
  const name = [customer.firstName, customer.lastName].filter(Boolean).join(' ');
  return name || customer.email || '';
}

function vehicleLabel(v) {
  if (!v) return '';
  return [v.brand, v.model, v.registrationNumber].filter(Boolean).join(' ');
}

function escapeCsv(value) {
  const s = value == null ? '' : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function getExportMeta(type, query = {}) {
  const title =
    type === 'revenue' ? 'Revenue Report' : 'Rental Orders Report';
  const range =
    query.startDate && query.endDate
      ? `${formatDate(query.startDate)} to ${formatDate(query.endDate)}`
      : 'All dates';
  return { title, range, generatedAt: formatDateTime(new Date()) };
}

export function mapRentalsToRows(rentals = []) {
  return rentals.map((r) => ({
    bookingNumber: r.orderNumber || '',
    customer: customerName(r.customer),
    email: r.customer?.email || '',
    vehicles: vehicleLabel(r.vehicle),
    status: r.orderStatus || '',
    paymentStatus: r.payment?.paymentStatus || '',
    pickupDate: formatDate(r.pickupDate),
    expectedReturnDate: formatDate(r.expectedReturnDate),
    subtotal: formatMoney(r.rentalAmount),
    tax: formatMoney(r.payment?.taxAmount),
    discount: formatMoney(0),
    lateFee: formatMoney(r.securityDeposit?.penaltyAmount),
    grandTotal: formatMoney(r.invoice?.totalAmount || r.payment?.totalAmount),
    createdAt: formatDateTime(r.createdAt),
  }));
}

export function mapRevenueToRows(payments = []) {
  return payments.map((p) => ({
    paymentId: p.id || '',
    bookingNumber: p.order?.orderNumber || '',
    customer: customerName(p.order?.customer),
    paymentMethod: p.paymentMethod || '',
    paymentStatus: p.paymentStatus || '',
    amount: formatMoney(p.totalAmount),
    currency: 'INR',
    transactionId: p.transactionId || '',
    paidAt: formatDateTime(p.paymentDate),
  }));
}

export function getColumns(type) {
  if (type === 'revenue') {
    return [
      { key: 'paymentId', header: 'Payment ID', width: 36 },
      { key: 'bookingNumber', header: 'Booking #', width: 16 },
      { key: 'customer', header: 'Customer', width: 22 },
      { key: 'paymentMethod', header: 'Method', width: 14 },
      { key: 'paymentStatus', header: 'Status', width: 12 },
      { key: 'amount', header: 'Amount', width: 12 },
      { key: 'currency', header: 'Currency', width: 10 },
      { key: 'transactionId', header: 'Transaction ID', width: 24 },
      { key: 'paidAt', header: 'Paid At', width: 20 },
    ];
  }

  return [
    { key: 'bookingNumber', header: 'Booking #', width: 16 },
    { key: 'customer', header: 'Customer', width: 22 },
    { key: 'email', header: 'Email', width: 26 },
    { key: 'vehicles', header: 'Vehicles', width: 28 },
    { key: 'status', header: 'Status', width: 12 },
    { key: 'paymentStatus', header: 'Payment', width: 12 },
    { key: 'pickupDate', header: 'Pickup', width: 12 },
    { key: 'expectedReturnDate', header: 'Return', width: 12 },
    { key: 'subtotal', header: 'Subtotal', width: 12 },
    { key: 'tax', header: 'Tax', width: 10 },
    { key: 'discount', header: 'Discount', width: 10 },
    { key: 'lateFee', header: 'Late Fee', width: 10 },
    { key: 'grandTotal', header: 'Grand Total', width: 12 },
    { key: 'createdAt', header: 'Created At', width: 20 },
  ];
}

export function mapExportRows(type, data) {
  return type === 'revenue' ? mapRevenueToRows(data) : mapRentalsToRows(data);
}

export function summarizeRows(type, rows) {
  if (type === 'revenue') {
    const total = rows.reduce((sum, row) => sum + money(row.amount), 0);
    return { count: rows.length, totalAmount: formatMoney(total) };
  }
  const total = rows.reduce((sum, row) => sum + money(row.grandTotal), 0);
  return { count: rows.length, totalAmount: formatMoney(total) };
}

export function buildCsv(type, data) {
  const columns = getColumns(type);
  const rows = mapExportRows(type, data);
  const header = columns.map((c) => escapeCsv(c.header)).join(',');
  const body = rows
    .map((row) => columns.map((c) => escapeCsv(row[c.key])).join(','))
    .join('\n');
  return `${header}\n${body}${rows.length ? '\n' : ''}`;
}

export async function buildExcelBuffer(type, data, query = {}) {
  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'CRMS';
  workbook.created = new Date();

  const meta = getExportMeta(type, query);
  const columns = getColumns(type);
  const rows = mapExportRows(type, data);
  const summary = summarizeRows(type, rows);

  const sheet = workbook.addWorksheet(type === 'revenue' ? 'Revenue' : 'Rentals');

  sheet.mergeCells(1, 1, 1, columns.length);
  sheet.getCell(1, 1).value = meta.title;
  sheet.getCell(1, 1).font = { bold: true, size: 14 };

  sheet.mergeCells(2, 1, 2, columns.length);
  sheet.getCell(2, 1).value = `Period: ${meta.range} · Generated: ${meta.generatedAt}`;
  sheet.getCell(2, 1).font = { size: 10, color: { argb: 'FF64748B' } };

  sheet.mergeCells(3, 1, 3, columns.length);
  sheet.getCell(3, 1).value = `Records: ${summary.count} · Total: ${summary.totalAmount}`;
  sheet.getCell(3, 1).font = { size: 10, bold: true };

  const headerRow = sheet.getRow(5);
  columns.forEach((col, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = col.header;
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2563EB' },
    };
    sheet.getColumn(index + 1).width = col.width;
  });
  headerRow.commit();

  rows.forEach((row, rowIndex) => {
    const excelRow = sheet.getRow(6 + rowIndex);
    columns.forEach((col, colIndex) => {
      excelRow.getCell(colIndex + 1).value = row[col.key];
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export async function buildPdfBuffer(type, data, query = {}) {
  const PDFDocument = (await import('pdfkit')).default;
  const meta = getExportMeta(type, query);
  const columns = getColumns(type);
  const rows = mapExportRows(type, data);
  const summary = summarizeRows(type, rows);

  // Keep PDF readable: show a practical subset of columns
  const pdfColumns =
    type === 'revenue'
      ? columns.filter((c) =>
          ['bookingNumber', 'customer', 'paymentMethod', 'amount', 'paidAt'].includes(
            c.key
          )
        )
      : columns.filter((c) =>
          [
            'bookingNumber',
            'customer',
            'status',
            'grandTotal',
            'pickupDate',
          ].includes(c.key)
        );

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      margin: 40,
      size: 'A4',
      layout: 'landscape',
    });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(16).fillColor('#111827').text(meta.title, { align: 'left' });
    doc.moveDown(0.4);
    doc
      .fontSize(10)
      .fillColor('#64748B')
      .text(`Period: ${meta.range}`);
    doc.text(`Generated: ${meta.generatedAt}`);
    doc.text(`Records: ${summary.count} · Total amount: ${summary.totalAmount}`);
    doc.moveDown(0.8);

    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const colWidth = pageWidth / pdfColumns.length;
    const startX = doc.page.margins.left;
    let y = doc.y;

    const drawHeader = () => {
      doc.rect(startX, y, pageWidth, 22).fill('#2563EB');
      doc.fillColor('#FFFFFF').fontSize(9).font('Helvetica-Bold');
      pdfColumns.forEach((col, i) => {
        doc.text(col.header, startX + i * colWidth + 4, y + 6, {
          width: colWidth - 8,
          ellipsis: true,
        });
      });
      y += 26;
      doc.font('Helvetica').fillColor('#111827');
    };

    drawHeader();

    rows.forEach((row, index) => {
      if (y > doc.page.height - 50) {
        doc.addPage();
        y = doc.page.margins.top;
        drawHeader();
      }

      if (index % 2 === 0) {
        doc.rect(startX, y - 2, pageWidth, 18).fill('#F8FAFC');
        doc.fillColor('#111827');
      }

      pdfColumns.forEach((col, i) => {
        doc.fontSize(8).text(String(row[col.key] ?? ''), startX + i * colWidth + 4, y, {
          width: colWidth - 8,
          ellipsis: true,
        });
      });
      y += 18;
    });

    if (!rows.length) {
      doc.fontSize(11).fillColor('#64748B').text('No records found for this export.', {
        align: 'center',
      });
    }

    doc.end();
  });
}
