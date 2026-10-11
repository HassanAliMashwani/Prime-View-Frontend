/**
 * Format CNIC to exactly 13 digits with two dashes: 00000-0000000-0 (max 15 characters).
 * Keeps digits only, inserts dash after 5th and 12th digits, and refuses a 14th digit.
 */
export function formatCnic(raw: string): string {
  if (!raw) return '';
  const digits = raw.replace(/\D/g, '').slice(0, 13);
  if (digits.length <= 5) {
    return digits;
  }
  if (digits.length <= 12) {
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  }
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12, 13)}`;
}

export function isValidCnic(val?: string | null): boolean {
  if (!val) return false;
  return /^\d{5}-\d{7}-\d{1}$/.test(val.trim());
}
