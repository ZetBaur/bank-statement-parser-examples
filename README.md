# Bank Statement Parser Examples                                                                                                                                                 
                                         
  Code examples for parsing PDF bank statements from major US banks into structured data.                                                                                          
                                                                                                                                                                                   
  ## Supported Banks                                                                                                                                                               
                                                            
  | Bank | Checking | Credit Card | Formats |
  |------|----------|-------------|---------|
  | Chase | Yes | Yes | v1 (2015), v2 (2019), v3 (2024) |
  | Bank of America | Yes | Yes | Standard, eStatement |
  | Wells Fargo | Yes | Yes | Standard, Character-spaced |
  | Capital One | Yes | Yes | 360, Venture |

  ## Quick Start

  ### Using pdfjs-dist (Recommended)

  ```javascript
  const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

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

  Bank-Specific Patterns

  Chase Bank

  Account Detection:
  // Chase checking account pattern
  const chaseChecking = /Account\s*(?:Number|#)?[:\s]*(\d{3,4})/i;

  // Chase credit card pattern
  const chaseCredit = /Account\s*Number[:\s]*[\d\s]*(\d{4})/i;

  Transaction Pattern (v3 - 2024+):
  // Format: MM/DD Description Amount
  const transactionRegex = /^(\d{2}\/\d{2})\s+(.+?)\s+(-?[\d,]+\.\d{2})$/;

  Date Range Detection:
  // "January 1 - January 31, 2024" or "01/01/24 - 01/31/24"
  const dateRangeRegex = /(\w+\s+\d{1,2})\s*[-–]\s*(\w+\s+\d{1,2},?\s*\d{4})/;

  Bank of America

  Account Detection:
  // BOA checking
  const boaAccount = /Account\s*#?\s*[:.]?\s*(\d{4}\s*\d{4}\s*\d{4})/i;

  // BOA credit card (last 4 digits)
  const boaCredit = /Account\s*ending\s*in\s*(\d{4})/i;

  Transaction Pattern:
  // Format: MM/DD/YY Description Amount
  const boaTransaction = /^(\d{2}\/\d{2}\/\d{2})\s+(.+?)\s+(-?[\d,]+\.\d{2})$/;

  Wells Fargo

  Note: Wells Fargo PDFs often have character-spaced text (e.g., "W E L L S F A R G O").

  Fix Character Spacing:
  function fixWellsFargoSpacing(text) {
    // Remove single spaces between letters
    return text.replace(/(\w)\s(?=\w)/g, '$1');
  }

  Account Detection:
  const wfAccount = /Account\s*(?:Number|#)?[:\s]*(\d{10,12})/i;

  Transaction Pattern:
  // Format: MM/DD Description Amount
  const wfTransaction = /^(\d{1,2}\/\d{1,2})\s+(.+?)\s+(-?[\d,]+\.\d{2})$/;

  Capital One

  Account Detection:
  // Capital One 360
  const capitalOne360 = /Account\s*(?:Number)?[:\s]*(\d{10})/i;

  // Capital One Credit Card
  const capitalOneCredit = /Account\s*Ending\s*(?:in)?\s*(\d{4})/i;

  Transaction Pattern:
  // Format: Mon DD Description Amount
  const coTransaction = /^([A-Z][a-z]{2}\s+\d{1,2})\s+(.+?)\s+(-?\$?[\d,]+\.\d{2})$/;

  Output Format (QuickBooks-Ready)

  const transaction = {
    date: '2024-01-15',        // ISO format
    description: 'AMAZON.COM', // Cleaned merchant name
    amount: -45.99,            // Negative = debit
    type: 'debit',             // 'debit' or 'credit'
    balance: 1234.56           // Running balance (if available)
  };

  Excel/CSV Export

  const headers = ['Date', 'Description', 'Amount', 'Type'];
  const csvRows = transactions.map(t =>
    [t.date, t.description, t.amount, t.type].join(',')
  );

  Common Challenges

  1. Multi-line Descriptions

  Some transactions span multiple lines. Collect lines until you find a valid amount.

  2. Check Numbers

  Checks often appear as: Check #1234  01/15  -500.00

  3. Pending vs Posted

  Filter out "Pending" section - only parse posted transactions.

  4. PDF Structure Variations

  Banks update PDF formats. Always validate against sample statements.

  Production Solution

  For production use with 99%+ accuracy, automatic bank detection, and QuickBooks-ready output:

  https://bank-parser.com/?utm_source=github&utm_medium=referral&utm_campaign=readme

  Handles all format variations, credit cards, and edge cases automatically.

  License

  MIT License - Use freely in your projects.

  Contributing

  Pull requests welcome! Please include sample test cases (with sensitive data removed).
