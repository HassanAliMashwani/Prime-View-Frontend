/**
 * Phone number utilities for Pakistani mobile numbers (11 digits, e.g., 0300-1234567 or 03001234567).
 * Strictly enforces that phone numbers CANNOT exceed 11 digits.
 */

/**
 * Strips all non-digit characters and caps at exactly 11 digits.
 */
export function cleanPhoneDigits(raw?: string | null): string {
  if (!raw) return '';
  return raw.replace(/\D/g, '').slice(0, 11);
}

/**
 * Format phone number up to 11 digits:
 * 0300 -> 0300
 * 03001234567 -> 0300-1234567 (max 12 characters with dash, max 11 digits)
 */
export function formatPhone(raw?: string | null): string {
  if (!raw) return '';
  const digits = cleanPhoneDigits(raw);
  if (digits.length <= 4) {
    return digits;
  }
  return `${digits.slice(0, 4)}-${digits.slice(4, 11)}`;
}

/**
 * Validates that the phone number contains exactly 11 digits and does not exceed 11 digits.
 */
export function isValidPhone(val?: string | null): boolean {
  if (!val) return false;
  const digits = val.replace(/\D/g, '');
  return digits.length === 11;
}

/**
 * Checks if raw input has more than 11 numeric digits.
 */
export function exceeds11Digits(val?: string | null): boolean {
  if (!val) return false;
  const digits = val.replace(/\D/g, '');
  return digits.length > 11;
}
