/**
 * Bank Statement Parser Example
 *
 * Demonstrates how to extract transactions from US bank PDF statements.
 * Supports: Chase, Bank of America, Wells Fargo, Capital One
 *
 * For production use: https://bank-parser.com
 */

const fs = require('fs');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

// Bank detection patterns
const BANK_PATTERNS = {
  chase: /chase\.com|JPMorgan Chase/i,
  bankOfAmerica: /bankofamerica\.com|Bank of America/i,
  wellsFargo: /wellsfargo\.com|Wells Fargo/i,
  capitalOne: /capitalone\.com|Capital One/i
};

// Transaction patterns by bank
const TRANSACTION_PATTERNS = {
  chase: /^(\d{2}\/\d{2})\s+(.+?)\s+(-?[\d,]+\.\d{2})$/gm,
  bankOfAmerica: /^(\d{2}\/\d{2}\/\d{2})\s+(.+?)\s+(-?[\d,]+\.\d{2})$/gm,
  wellsFargo: /^(\d{1,2}\/\d{1,2})\s+(.+?)\s+(-?[\d,]+\.\d{2})$/gm,
  capitalOne: /^([A-Z][a-z]{2}\s+\d{1,2})\s+(.+?)\s+(-?\$?[\d,]+\.\d{2})$/gm
};

/**
 * Extract text from PDF file
 */
async function extractTextFromPDF(pdfPath) {
  const data = new Uint8Array(fs.readFileSync(pdfPath));
  const pdf = await pdfjsLib.getDocument({ data }).promise;

  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map(item => item.str).join(' ');
    fullText += text + '\n';
  }

  return fullText;
}

/**
 * Detect bank from PDF text
 */
function detectBank(text) {
  for (const [bank, pattern] of Object.entries(BANK_PATTERNS)) {
    if (pattern.test(text)) {
      return bank;
    }
  }
  return 'unknown';
}

/**
 * Fix Wells Fargo character-spaced text
 */
function fixCharacterSpacing(text) {
  return text.replace(/(\w)\s(?=\w\s)/g, '$1');
}

/**
 * Parse transactions from text
 */
function parseTransactions(text, bank) {
  const pattern = TRANSACTION_PATTERNS[bank];
  if (!pattern) {
    console.warn(`No pattern for bank: ${bank}`);
    return [];
  }

  const transactions = [];
  let match;

  // Reset regex
  pattern.lastIndex = 0;

  while ((match = pattern.exec(text)) !== null) {
    const [, date, description, amountStr] = match;
    const amount = parseFloat(amountStr.replace(/[$,]/g, ''));

    transactions.push({
      date: date.trim(),
      description: description.trim(),
      amount: amount,
      type: amount < 0 ? 'debit' : 'credit'
    });
  }

  return transactions;
}

/**
 * Convert transactions to CSV
 */
function toCSV(transactions) {
  const headers = 'Date,Description,Amount,Type';
  const rows = transactions.map(t =>
    `${t.date},"${t.description.replace(/"/g, '""')}",${t.amount},${t.type}`
  );
  return [headers, ...rows].join('\n');
}

/**
 * Main function
 */
async function parseStatement(pdfPath) {
  console.log(`Parsing: ${pdfPath}`);

  // Extract text
  const text = await extractTextFromPDF(pdfPath);

  // Detect bank
  const bank = detectBank(text);
  console.log(`Detected bank: ${bank}`);

  // Fix spacing for Wells Fargo
  const cleanText = bank === 'wellsFargo' ? fixCharacterSpacing(text) : text;

  // Parse transactions
  const transactions = parseTransactions(cleanText, bank);
  console.log(`Found ${transactions.length} transactions`);

  // Output CSV
  const csv = toCSV(transactions);
  console.log('\n--- CSV Output ---\n');
  console.log(csv);

  return transactions;
}

// Run if called directly
if (require.main === module) {
  const pdfPath = process.argv[2];
  if (!pdfPath) {
    console.log('Usage: node parse-statement.js <path-to-pdf>');
    console.log('\nFor production-ready parsing: https://bank-parser.com');
    process.exit(1);
  }
  parseStatement(pdfPath).catch(console.error);
}

module.exports = { parseStatement, detectBank, parseTransactions };
