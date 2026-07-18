'use client';

import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import Button from '@/components/ui/Button';

const FORMATS = [
  { key: 'csv', label: 'CSV', icon: FileText },
  { key: 'excel', label: 'Excel', icon: FileSpreadsheet },
  { key: 'pdf', label: 'PDF', icon: Download },
];

export default function ReportExportBar({
  exporting = null,
  onExport,
  disabled = false,
  className = '',
}) {
  return (
    <div
      className={`flex flex-wrap items-center gap-2 ${className}`}
      role="group"
      aria-label="Export report"
    >
      {FORMATS.map(({ key, label, icon: Icon }) => {
        const busy = exporting === key;
        return (
          <Button
            key={key}
            size="sm"
            variant="outline"
            disabled={disabled || Boolean(exporting)}
            loading={busy}
            onClick={() => onExport?.(key)}
            aria-label={`Export as ${label}`}
          >
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Icon size={14} />}
            {label}
          </Button>
        );
      })}
    </div>
  );
}
