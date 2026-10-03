/**
 * Centralized API Base URL helper for the Prime View frontend.
 * Reads NEXT_PUBLIC_API_URL (with NEXT_PUBLIC_API_BASE_URL fallback for compatibility).
 * Never hardcodes production live URLs in source code.
 * A production build with that variable missing must not call localhost - it must fail closed.
 */
export function getApiBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL;
  if (envUrl && envUrl.trim() !== '') {
    return envUrl.replace(/\/$/, '');
  }
  if (process.env.NODE_ENV === 'production') {
    // Fail closed: Never fall back to localhost in production builds
    if (typeof window !== 'undefined') {
      console.error('[SECURITY ERROR] NEXT_PUBLIC_API_URL is missing in production. Refusing connection.');
    }
    return 'https://api-missing-closed.invalid';
  }
  return 'http://localhost:3001';
}

export const API_BASE_URL: string = getApiBaseUrl();

