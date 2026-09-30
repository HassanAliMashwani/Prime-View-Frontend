/**
 * Centralized API Base URL helper for the Prime View frontend.
 * Reads NEXT_PUBLIC_API_URL (with NEXT_PUBLIC_API_BASE_URL fallback for compatibility).
 * Never hardcodes production live URLs in source code.
 * A production build with that variable missing must not call localhost.
 */
export function getApiBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL;
  if (envUrl) {
    return envUrl.replace(/\/$/, '');
  }
  if (process.env.NODE_ENV === 'production') {
    return '';
  }
  return 'http://localhost:3001';
}

export const API_BASE_URL: string = getApiBaseUrl();
