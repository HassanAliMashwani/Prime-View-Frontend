import { API_BASE_URL } from '../apiBase';

export interface ResolvedImageResult {
  directUrl: string | null;
  isPage: boolean;
  error?: string;
}

/**
 * Resolver for CMS image links:
 * - If it already starts with https://images.unsplash.com/ or https://res.cloudinary.com/,
 *   or ends in .jpg, .jpeg, .png, .webp, or .gif (or is a local asset path), keep it.
 * - If it is an Unsplash photo page (https://unsplash.com/photos/...), read that page's og:image
 *   on the backend and use that address.
 * - If it cannot be resolved (or is a non-image page), returns directUrl: null, isPage: true.
 */
export async function resolveImageLink(url?: string): Promise<ResolvedImageResult> {
  if (!url || !url.trim()) {
    return { directUrl: null, isPage: false };
  }
  const trimmed = url.trim();

  // Rule 1: Keep direct image addresses
  if (
    trimmed.startsWith('https://images.unsplash.com/') ||
    trimmed.startsWith('https://res.cloudinary.com/') ||
    trimmed.startsWith('/') ||
    /\.(jpe?g|png|webp|gif)(\?.*)?$/i.test(trimmed)
  ) {
    return { directUrl: trimmed, isPage: false };
  }

  // Rule 2: Unsplash photo page or other webpage -> call backend to resolve og:image
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const endpoint = `${API_BASE_URL}/content/resolve-image?url=${encodeURIComponent(trimmed)}`;
      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        if (data.ok && data.directUrl) {
          return { directUrl: data.directUrl, isPage: false };
        }
        if (data.isPage) {
          return { directUrl: null, isPage: true, error: 'This link is a page, not a picture.' };
        }
      }
    } catch {
      // Fall through to error
    }
  }

  return { directUrl: null, isPage: true, error: 'This link is a page, not a picture.' };
}

/**
 * Accept youtube.com/watch?v=, youtu.be/, youtube.com/embed/, and youtube.com/shorts/.
 * Save metadata.videoUrl as https://www.youtube.com/embed/VIDEO_ID.
 */
export function formatYouTubeEmbedUrl(input?: string): string | null {
  if (!input || !input.trim()) return null;
  const trimmed = input.trim();

  // youtube.com/watch?v=VIDEO_ID
  const watchMatch = trimmed.match(/(?:youtube\.com\/watch\?.*?v=)([a-zA-Z0-9_-]+)/i);
  if (watchMatch && watchMatch[1]) return `https://www.youtube.com/embed/${watchMatch[1]}`;

  // youtu.be/VIDEO_ID
  const shortMatch = trimmed.match(/(?:youtu\.be\/)([a-zA-Z0-9_-]+)/i);
  if (shortMatch && shortMatch[1]) return `https://www.youtube.com/embed/${shortMatch[1]}`;

  // youtube.com/embed/VIDEO_ID
  const embedMatch = trimmed.match(/(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/i);
  if (embedMatch && embedMatch[1]) return `https://www.youtube.com/embed/${embedMatch[1]}`;

  // youtube.com/shorts/VIDEO_ID
  const shortsMatch = trimmed.match(/(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]+)/i);
  if (shortsMatch && shortsMatch[1]) return `https://www.youtube.com/embed/${shortsMatch[1]}`;

  return null;
}
