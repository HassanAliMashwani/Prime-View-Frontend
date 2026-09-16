/**
 * Centralized API Base URL helper for the Prime View frontend.
 * Reads NEXT_PUBLIC_API_URL (with NEXT_PUBLIC_API_BASE_URL fallback for compatibility).
 * Never hardcodes production live URLs in source code.
 */
export const API_BASE_URL: string =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'http://localhost:3001';
