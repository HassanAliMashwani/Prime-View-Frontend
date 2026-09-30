/**
 * Normalizes an image path or URL so that local asset paths,
 * Windows absolute paths, and external image URLs resolve properly.
 */
export function normalizeImagePath(raw: string | null | undefined): string {
  if (!raw) return '';
  let str = String(raw).trim();
  if (!str) return '';

  // Preserve external http/https URLs as-is
  if (/^https?:\/\//i.test(str)) {
    return str;
  }

  // Replace Windows backslashes with forward slashes
  str = str.replace(/\\/g, '/');

  // Strip public directory prefix if present
  const publicIndex = str.toLowerCase().indexOf('/public/');
  if (publicIndex !== -1) {
    str = str.substring(publicIndex + '/public'.length);
  } else if (str.toLowerCase().startsWith('public/')) {
    str = str.substring('public'.length);
  }

  // Strip Windows drive letters (e.g. E:, C:)
  str = str.replace(/^[a-zA-Z]:/, '');

  // Handle loose text mentions like "card6 pic for 2 kanal plan"
  if (/card\s*6/i.test(str) && /plan/i.test(str)) {
    return '/new assests/our plan assests/card 6.png';
  }

  // Ensure leading slash for web root relative paths
  if (!str.startsWith('/')) {
    str = '/' + str;
  }

  return str;
}
