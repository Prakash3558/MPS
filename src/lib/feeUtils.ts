import { MonthFee } from '../types';

export const STANDARD_MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
] as const;

export const STANDARD_FEE_MONTHS_2026 = [
  'January, 2026',
  'February, 2026',
  'March, 2026',
  'April, 2026',
  'May, 2026',
  'June, 2026',
  'July, 2026',
  'August, 2026',
  'September, 2026',
  'October, 2026',
  'November, 2026',
  'December, 2026'
];

/**
 * Returns 0 for January, 1 for February, ... 11 for December.
 */
export function getMonthOrderIndex(monthStr?: string): number {
  if (!monthStr) return 999;
  const lower = monthStr.toLowerCase().trim();
  
  for (let i = 0; i < STANDARD_MONTH_NAMES.length; i++) {
    const name = STANDARD_MONTH_NAMES[i].toLowerCase();
    const shortName = name.slice(0, 3);
    if (lower.includes(name) || lower.includes(shortName)) {
      return i;
    }
  }
  return 999;
}

/**
 * Extracts numeric 4-digit year from a month string like "January, 2026" or "2026-01"
 */
export function extractYearFromMonth(monthStr?: string, defaultYear = 2026): number {
  if (!monthStr) return defaultYear;
  const match = monthStr.match(/\b(20\d\d)\b/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return defaultYear;
}

/**
 * Sorts any list of objects containing a `month` field chronologically:
 * Year (ascending) -> Month (January to December).
 */
export function sortFeeMonths<T extends { month?: string }>(months: T[]): T[] {
  if (!Array.isArray(months)) return [];
  
  return [...months].sort((a, b) => {
    const yearA = extractYearFromMonth(a.month);
    const yearB = extractYearFromMonth(b.month);
    if (yearA !== yearB) {
      return yearA - yearB;
    }
    return getMonthOrderIndex(a.month) - getMonthOrderIndex(b.month);
  });
}

/**
 * Generates an ordered 12-month fee breakdown for a student (January to December).
 */
export function generateDefault12MonthFeeList(amount = 1100, year = 2026): MonthFee[] {
  return STANDARD_MONTH_NAMES.map(m => ({
    month: `${m}, ${year}`,
    status: 'Pending',
    amount: amount
  }));
}

/**
 * Ensures a student has all 12 calendar months (January to December) populated and organized.
 * Any existing paid/pending records are matched and formatted consistently.
 */
export function getNormalizedStudentFeeMonths(
  months?: MonthFee[],
  defaultAmount = 1100,
  year = 2026
): MonthFee[] {
  const existingList = Array.isArray(months) ? months : [];
  
  return STANDARD_MONTH_NAMES.map(monthName => {
    const monthLower = monthName.toLowerCase();
    const existing = existingList.find(m => {
      const mLower = (m.month || '').toLowerCase();
      return mLower.includes(monthLower);
    });

    if (existing) {
      const yr = extractYearFromMonth(existing.month, year);
      return {
        ...existing,
        month: `${monthName}, ${yr}`
      };
    }

    return {
      month: `${monthName}, ${year}`,
      status: 'Pending' as const,
      amount: defaultAmount
    };
  });
}
