/**
 * Currency Service for Rupee Tracker
 * Handles all monetary conversion, parsing, and formatting.
 *
 * Fundamental Rule:
 * Monetary values are stored and calculated strictly as integer paise (1 INR = 100 paise).
 * No floating point money in the database or calculations.
 */

export const CURRENCY_SYMBOL = '₹';
export const CURRENCY_CODE = 'INR';

/**
 * Converts a rupee value (number or string representation) to integer paise.
 * E.g.: "12.50" -> 1250, 100 -> 10000, "0.75" -> 75
 */
export function rupeesToPaise(rupees: number | string): number {
  if (typeof rupees === 'string') {
    const cleaned = rupees.replace(/[^0-9.-]/g, '').trim();
    if (!cleaned || isNaN(Number(cleaned))) return 0;
    const parsed = parseFloat(cleaned);
    return Math.round(parsed * 100);
  }
  if (isNaN(rupees)) return 0;
  return Math.round(rupees * 100);
}

/**
 * Converts integer paise to rupees as a float number.
 * E.g.: 1250 -> 12.50, 5000 -> 50.00
 */
export function paiseToRupees(paise: number): number {
  if (isNaN(paise)) return 0;
  return paise / 100;
}

/**
 * Formats integer paise into Indian Rupee format with ₹ symbol.
 * Example outputs:
 *  1250 -> "₹12.50"
 *  10000000 -> "₹1,00,000.00" (or no decimal if paise is 0 and hideDecimalsIfZero is true)
 */
export function formatINR(
  paise: number,
  options?: {
    showSymbol?: boolean;
    showSign?: boolean;
    compact?: boolean;
    hideZeroDecimals?: boolean;
  }
): string {
  const {
    showSymbol = true,
    showSign = false,
    hideZeroDecimals = false,
  } = options ?? {};

  const isNegative = paise < 0;
  const absPaise = Math.abs(paise);
  const rupees = absPaise / 100;

  let formattedNumber: string;

  try {
    const hasFraction = absPaise % 100 !== 0;
    const minFractionDigits = hideZeroDecimals && !hasFraction ? 0 : 2;
    const maxFractionDigits = 2;

    formattedNumber = new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: minFractionDigits,
      maximumFractionDigits: maxFractionDigits,
    }).format(rupees);
  } catch {
    // Fallback if Intl is unavailable or lacks en-IN
    const parts = rupees.toFixed(2).split('.');
    let integerPart = parts[0];
    const decimalPart = parts[1];

    const lastThree = integerPart.substring(integerPart.length - 3);
    const otherNumbers = integerPart.substring(0, integerPart.length - 3);
    if (otherNumbers !== '') {
      formattedNumber =
        otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree;
    } else {
      formattedNumber = lastThree;
    }

    if (hideZeroDecimals && decimalPart === '00') {
      // no decimals
    } else {
      formattedNumber = `${formattedNumber}.${decimalPart}`;
    }
  }

  let prefix = '';
  if (isNegative) {
    prefix = '- ';
  } else if (showSign && paise > 0) {
    prefix = '+ ';
  }

  const symbol = showSymbol ? `${CURRENCY_SYMBOL}` : '';
  return `${prefix}${symbol}${formattedNumber}`;
}

/**
 * Parse text entered by user in amount field and return integer paise.
 * Handles inputs with decimal points, prevents multiple decimals.
 */
export function parseAmountInputToPaise(input: string): number {
  const sanitized = input.replace(/[^0-9.]/g, '');
  const parts = sanitized.split('.');
  if (parts.length > 2) {
    // Keep only the first decimal point
    return rupeesToPaise(`${parts[0]}.${parts.slice(1).join('')}`);
  }
  return rupeesToPaise(sanitized);
}

/**
 * Converts integer paise into string suitable for TextInput display.
 * E.g.: 1500 -> "15" or "15.00", 1250 -> "12.50"
 */
export function paiseToInputString(paise: number): string {
  if (!paise) return '';
  const rupees = paise / 100;
  return Number.isInteger(rupees) ? rupees.toString() : rupees.toFixed(2);
}
