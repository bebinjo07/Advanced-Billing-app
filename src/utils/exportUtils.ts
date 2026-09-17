import * as XLSX from 'xlsx';

export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  filename: string
) {
  if (!data || data.length === 0) return;
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  XLSX.writeFile(workbook, `${filename}.csv`, { bookType: 'csv' });
}

export function exportToExcel<T extends Record<string, any>>(
  data: T[],
  filename: string,
  sheetName = 'Report'
) {
  if (!data || data.length === 0) return;
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${filename}.xlsx`, { bookType: 'xlsx' });
}
