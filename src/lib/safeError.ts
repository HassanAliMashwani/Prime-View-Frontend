/**
 * Frontend Error Sanitizer
 *
 * Ensures no raw database sentences, Prisma exceptions, SQL fragments,
 * network errors ("Failed to fetch"), or HTTP status codes ever appear
 * on screen across the admin portal and member portal.
 */

export const GENERAL_SAFE_ERROR = 'Something went wrong. Please try again.';

export function toSafeErrorMessage(input: unknown): string {
  if (!input) {
    return GENERAL_SAFE_ERROR;
  }

  // Extract raw string representation
  let text = '';
  if (typeof input === 'string') {
    text = input;
  } else if (typeof input === 'object') {
    const obj = input as any;
    if (obj.message && typeof obj.message === 'string') {
      text = obj.message;
    } else if (obj.error && typeof obj.error === 'string') {
      text = obj.error;
    } else if (Array.isArray(obj.message)) {
      text = obj.message.join(', ');
    } else if (input instanceof Error) {
      text = input.message;
    }
  }

  text = text.trim();
  if (!text) {
    return GENERAL_SAFE_ERROR;
  }

  if (text === GENERAL_SAFE_ERROR) {
    return GENERAL_SAFE_ERROR;
  }

  // Uppercase constant error codes (e.g. BALLOON_ENGINE_ERROR, LOCKED_BY_ANOTHER, SLIP_NOT_FOUND)
  if (/^[A-Z0-9_]{3,}$/.test(text)) {
    return GENERAL_SAFE_ERROR;
  }

  const lower = text.toLowerCase();

  // Guard, policy, trigger, row security, schema
  if (
    lower.includes('guard') ||
    lower.includes('trigger') ||
    lower.includes('policy') ||
    lower.includes('row security') ||
    lower.includes('rls') ||
    lower.includes('schema')
  ) {
    return GENERAL_SAFE_ERROR;
  }

  // 1. Network / fetch / browser errors
  if (
    lower.includes('failed to fetch') ||
    lower.includes('networkerror') ||
    lower.includes('network request failed') ||
    lower.includes('load failed') ||
    lower.includes('fetch failed') ||
    lower.includes('abort') ||
    lower.includes('econnrefused') ||
    lower.includes('etimedout')
  ) {
    return GENERAL_SAFE_ERROR;
  }

  // 2. HTTP internal server errors
  if (
    lower.includes('internal server error') ||
    lower.includes('bad gateway') ||
    lower.includes('service unavailable')
  ) {
    return GENERAL_SAFE_ERROR;
  }

  // 3. Database / Prisma / Postgres raw dumps
  if (
    lower.includes('prisma') ||
    lower.includes('connectorerror') ||
    lower.includes('connecterror') ||
    lower.includes('postgresql') ||
    lower.includes('postgres') ||
    lower.includes('pgbouncer') ||
    lower.includes('prepared statement') ||
    lower.includes('syntax error') ||
    lower.includes('errcode') ||
    lower.includes('sqlstate') ||
    lower.includes('select ') ||
    lower.includes('insert ') ||
    lower.includes('update ') ||
    lower.includes('delete ') ||
    lower.includes('violates foreign key') ||
    lower.includes('duplicate key value')
  ) {
    return GENERAL_SAFE_ERROR;
  }

  // 6. Stack traces, file paths, code syntax, JSON, HTML
  if (
    text.includes('    at ') ||
    text.includes('\n') ||
    text.includes('{') ||
    text.includes('}') ||
    text.includes('<') ||
    text.includes('>') ||
    text.includes('.ts:') ||
    text.includes('.js:') ||
    text.includes('\\') ||
    text.includes('/src/') ||
    text.includes('/dist/') ||
    text.includes('/node_modules/') ||
    text.includes('Error:') ||
    text.includes('Exception:')
  ) {
    return GENERAL_SAFE_ERROR;
  }

  // 7. Check length (plain sentences are concise human sentences)
  if (text.length > 180) {
    return GENERAL_SAFE_ERROR;
  }

  return text;
}
