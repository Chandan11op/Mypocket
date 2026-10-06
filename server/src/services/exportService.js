const XLSX = require('xlsx');

/**
 * Formats date as YYYY-MM-DD HH:mm for Excel rows
 */
const formatDate = (dateObj) => {
  if (!dateObj) return '';
  const d = new Date(dateObj);
  return d.toISOString().replace('T', ' ').substring(0, 16);
};

/**
 * Generates an Excel binary buffer for financial statement
 * @param {Array<object>} statementEntries - Output from getStatementWithRunningBalance
 * @param {object} userInfo - Safe user summary
 * @returns {Buffer} Binary buffer of .xlsx file
 */
const generateStatementExcel = (statementEntries, userInfo = {}) => {
  // 1. Prepare structured rows
  const rows = statementEntries.map((entry) => ({
    Date: formatDate(entry.date),
    Type: entry.type.toUpperCase(),
    Person: entry.person_name || '-',
    Purpose: entry.purpose || '',
    'Amount (INR)': entry.amount,
    'Running Balance (INR)': entry.running_balance,
  }));

  // 2. Create Sheet & Workbook
  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Set column widths for clean readability
  worksheet['!cols'] = [
    { wch: 18 }, // Date
    { wch: 12 }, // Type
    { wch: 20 }, // Person
    { wch: 30 }, // Purpose
    { wch: 16 }, // Amount
    { wch: 22 }, // Running Balance
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'My Pocket Statement');

  // 3. Generate binary buffer
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  return buffer;
};

module.exports = {
  generateStatementExcel,
};
