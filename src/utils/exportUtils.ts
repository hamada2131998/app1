// Export utilities for PDF and Excel/CSV generation

import type { Expense } from '@/data/mockData';

export interface ExportOptions {
  format: 'csv' | 'excel' | 'pdf';
  filename: string;
  title?: string;
  dateRange?: { start: string; end: string };
}

// Format currency for export
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 0,
  }).format(amount);
};

// Format date for export
const formatDate = (date: string): string => {
  return new Intl.DateTimeFormat('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
};

// Status translations
const statusTranslations: Record<string, string> = {
  pending: 'قيد المراجعة',
  approved: 'معتمد',
  rejected: 'مرفوض',
  settled: 'تمت التسوية',
};

// Export expenses to CSV
export function exportExpensesToCSV(expenses: Expense[], filename: string = 'expenses'): void {
  const headers = [
    'رقم المرجع',
    'الوصف',
    'المبلغ الصافي',
    'ضريبة القيمة المضافة',
    'الإجمالي',
    'الحالة',
    'كود الحساب',
    'المشروع',
    'التاريخ',
  ];

  const rows = expenses.map(exp => [
    exp.id,
    exp.description,
    exp.net_amount.toString(),
    exp.vat_amount.toString(),
    exp.amount.toString(),
    statusTranslations[exp.status] || exp.status,
    exp.gl_code,
    exp.projects?.name || '-',
    formatDate(exp.created_at),
  ]);

  const csvContent = [
    '\uFEFF', // BOM for UTF-8
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  downloadFile(csvContent, `${filename}_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv;charset=utf-8');
}

// Export to Excel (using CSV with Excel-compatible format)
export function exportExpensesToExcel(expenses: Expense[], filename: string = 'expenses'): void {
  const headers = [
    'رقم المرجع',
    'الوصف',
    'المبلغ الصافي',
    'ضريبة القيمة المضافة',
    'الإجمالي',
    'الحالة',
    'كود الحساب',
    'المشروع',
    'مركز التكلفة',
    'التاريخ',
    'تاريخ الاعتماد',
  ];

  const rows = expenses.map(exp => [
    exp.id,
    exp.description,
    exp.net_amount,
    exp.vat_amount,
    exp.amount,
    statusTranslations[exp.status] || exp.status,
    exp.gl_code,
    exp.projects?.name || '-',
    exp.cost_center || '-',
    formatDate(exp.created_at),
    exp.approved_at ? formatDate(exp.approved_at) : '-',
  ]);

  // Create Excel-compatible XML
  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="المصروفات">
  <Table>
   <Row>
    ${headers.map(h => `<Cell><Data ss:Type="String">${h}</Data></Cell>`).join('')}
   </Row>
   ${rows.map(row => `
   <Row>
    ${row.map((cell, i) => 
      `<Cell><Data ss:Type="${typeof cell === 'number' ? 'Number' : 'String'}">${cell}</Data></Cell>`
    ).join('')}
   </Row>`).join('')}
  </Table>
 </Worksheet>
</Workbook>`;

  downloadFile(xmlContent, `${filename}_${new Date().toISOString().split('T')[0]}.xls`, 'application/vnd.ms-excel');
}

// Generate PDF report (creates a printable HTML that can be saved as PDF)
export function exportToPDF(
  title: string,
  content: { headers: string[]; rows: (string | number)[][] },
  summary?: { label: string; value: string }[],
  filename: string = 'report'
): void {
  const htmlContent = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Cairo', sans-serif; 
      padding: 40px;
      background: #fff;
      color: #1a1a2e;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #8b5cf6;
    }
    .logo {
      width: 60px;
      height: 60px;
      background: linear-gradient(135deg, #8b5cf6, #a855f7);
      border-radius: 12px;
      margin: 0 auto 15px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 24px;
    }
    h1 { color: #1a1a2e; font-size: 24px; margin-bottom: 5px; }
    .date { color: #64748b; font-size: 14px; }
    .summary {
      display: flex;
      gap: 20px;
      margin-bottom: 30px;
      flex-wrap: wrap;
    }
    .summary-card {
      flex: 1;
      min-width: 150px;
      padding: 15px;
      background: #f8fafc;
      border-radius: 8px;
      text-align: center;
    }
    .summary-card .label { color: #64748b; font-size: 12px; }
    .summary-card .value { color: #1a1a2e; font-size: 18px; font-weight: bold; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th { 
      background: #8b5cf6; 
      color: white; 
      padding: 12px 8px; 
      text-align: right;
      font-weight: 600;
    }
    td { 
      padding: 10px 8px; 
      border-bottom: 1px solid #e2e8f0;
      font-size: 13px;
    }
    tr:nth-child(even) { background: #f8fafc; }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      color: #64748b;
      font-size: 12px;
    }
    @media print {
      body { padding: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">SA</div>
    <h1>${title}</h1>
    <p class="date">تاريخ التقرير: ${new Date().toLocaleDateString('ar-SA', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}</p>
  </div>
  
  ${summary ? `
  <div class="summary">
    ${summary.map(s => `
      <div class="summary-card">
        <div class="label">${s.label}</div>
        <div class="value">${s.value}</div>
      </div>
    `).join('')}
  </div>
  ` : ''}
  
  <table>
    <thead>
      <tr>
        ${content.headers.map(h => `<th>${h}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${content.rows.map(row => `
        <tr>
          ${row.map(cell => `<td>${cell}</td>`).join('')}
        </tr>
      `).join('')}
    </tbody>
  </table>
  
  <div class="footer">
    <p>Smart Accountant Pro - نظام المحاسبة الذكي</p>
    <p>تم إنشاء هذا التقرير تلقائياً</p>
  </div>
  
  <script class="no-print">
    window.onload = function() { window.print(); }
  </script>
</body>
</html>`;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }
}

// Export expenses report to PDF
export function exportExpensesReportPDF(
  expenses: Expense[],
  title: string = 'تقرير المصروفات'
): void {
  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalVat = expenses.reduce((sum, e) => sum + e.vat_amount, 0);
  const totalNet = expenses.reduce((sum, e) => sum + e.net_amount, 0);

  const summary = [
    { label: 'إجمالي المصروفات', value: formatCurrency(totalAmount) },
    { label: 'صافي المبلغ', value: formatCurrency(totalNet) },
    { label: 'ضريبة القيمة المضافة', value: formatCurrency(totalVat) },
    { label: 'عدد المصروفات', value: expenses.length.toString() },
  ];

  const content = {
    headers: ['الوصف', 'المبلغ', 'الضريبة', 'الإجمالي', 'الحالة', 'التاريخ'],
    rows: expenses.map(exp => [
      exp.description,
      formatCurrency(exp.net_amount),
      formatCurrency(exp.vat_amount),
      formatCurrency(exp.amount),
      statusTranslations[exp.status] || exp.status,
      formatDate(exp.created_at),
    ]),
  };

  exportToPDF(title, content, summary, 'expenses-report');
}

// Helper function to download files
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Generic data export function
export function exportData<T extends Record<string, any>>(
  data: T[],
  columns: { key: keyof T; header: string; format?: (value: any) => string }[],
  options: ExportOptions
): void {
  const headers = columns.map(c => c.header);
  const rows = data.map(item => 
    columns.map(c => c.format ? c.format(item[c.key]) : String(item[c.key] ?? '-'))
  );

  if (options.format === 'csv') {
    const csvContent = [
      '\uFEFF',
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    downloadFile(csvContent, `${options.filename}.csv`, 'text/csv;charset=utf-8');
  } else if (options.format === 'pdf') {
    exportToPDF(options.title || options.filename, { headers, rows }, undefined, options.filename);
  }
}

// Generic export to Excel (from object array)
export function exportToExcel<T extends Record<string, any>>(data: T[], filename: string): void {
  if (data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const rows = data.map(item => headers.map(h => item[h]));

  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="Report">
  <Table>
   <Row>
    ${headers.map(h => `<Cell><Data ss:Type="String">${h}</Data></Cell>`).join('')}
   </Row>
   ${rows.map(row => `
   <Row>
    ${row.map(cell => 
      `<Cell><Data ss:Type="${typeof cell === 'number' ? 'Number' : 'String'}">${cell ?? ''}</Data></Cell>`
    ).join('')}
   </Row>`).join('')}
  </Table>
 </Worksheet>
</Workbook>`;

  downloadFile(xmlContent, `${filename}.xls`, 'application/vnd.ms-excel');
}

// Generic export to CSV (from object array)
export function exportToCSV<T extends Record<string, any>>(data: T[], filename: string): void {
  if (data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const rows = data.map(item => headers.map(h => item[h]));

  const csvContent = [
    '\uFEFF',
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell ?? ''}"`).join(','))
  ].join('\n');

  downloadFile(csvContent, `${filename}.csv`, 'text/csv;charset=utf-8');
}

// Generic PDF export (from object array)
export function exportGenericToPDF<T extends Record<string, any>>(data: T[], filename: string, title: string): void {
  if (data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const rows = data.map(item => headers.map(h => String(item[h] ?? '')));

  exportToPDF(title, { headers, rows }, undefined, filename);
}
