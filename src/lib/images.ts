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
    return '/new assests/our plan assests/card 6.webp';
  }

  // Ensure leading slash for web root relative paths
  if (!str.startsWith('/')) {
    str = '/' + str;
  }

  return str;
}

/**
 * Resolves full-size WebP and lightweight thumbnail WebP URLs
 * for event photography, ensuring display copies are loaded appropriately.
 */
export function getEventImageUrls(raw: string | null | undefined): { full: string; thumb: string } {
  const normalized = normalizeImagePath(raw);
  if (!normalized) return { full: '', thumb: '' };

  const match = normalized.match(
    /\/new assests\/Events and media\/event1\/(QAS07025\.JPG_202609031129|QAS07031\.JPG_2K_202609031134|QAS07033\.JPG_2K_202609031135|QAS07562_improved|QAS07590_glow|QAS07600\.png_2K_202609031145|QAS07627\.JPG_202609031125|WhatsApp Image 2026-09-06 at 3\.10\.12 PM)(?:_thumb)?\.(?:jpeg|jpg|png|webp)/i
  );

  if (match) {
    const base = match[1];
    return {
      full: `/new assests/Events and media/event1/${base}.webp`,
      thumb: `/new assests/Events and media/event1/${base}_thumb.webp`,
    };
  }

  return { full: normalized, thumb: normalized };
}
