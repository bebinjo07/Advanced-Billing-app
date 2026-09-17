const singleDigits = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
const teenDigits = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const tensDigits = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function convertChunk(n: number): string {
  let str = '';
  if (n >= 100) {
    str += singleDigits[Math.floor(n / 100)] + ' Hundred ';
    n %= 100;
  }
  if (n >= 10 && n < 20) {
    str += teenDigits[n - 10] + ' ';
  } else {
    if (n >= 20) {
      str += tensDigits[Math.floor(n / 10)] + ' ';
      n %= 10;
    }
    if (n > 0) {
      str += singleDigits[n] + ' ';
    }
  }
  return str.trim();
}

/**
 * Converts Indian Rupee amounts into Words (Lakh, Crore format)
 */
export function numberToWordsIndian(amount: number): string {
  if (isNaN(amount) || amount === 0) return 'Zero Rupees Only';

  const roundedAmount = Math.round(amount * 100) / 100;
  const integerPart = Math.floor(roundedAmount);
  const decimalPart = Math.round((roundedAmount - integerPart) * 100);

  let num = integerPart;
  let words = '';

  if (num >= 10000000) { // Crore
    const crore = Math.floor(num / 10000000);
    words += convertChunk(crore) + ' Crore ';
    num %= 10000000;
  }

  if (num >= 100000) { // Lakh
    const lakh = Math.floor(num / 100000);
    words += convertChunk(lakh) + ' Lakh ';
    num %= 100000;
  }

  if (num >= 1000) { // Thousand
    const thousand = Math.floor(num / 1000);
    words += convertChunk(thousand) + ' Thousand ';
    num %= 1000;
  }

  if (num > 0) {
    words += convertChunk(num) + ' ';
  }

  let result = 'Rupees ' + words.trim();

  if (decimalPart > 0) {
    result += ' and ' + convertChunk(decimalPart) + ' Paise';
  }

  return result + ' Only';
}

export function formatCurrency(amount: number, symbol = '₹'): string {
  const rounded = Number(amount || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
  return `${symbol} ${rounded}`;
}
