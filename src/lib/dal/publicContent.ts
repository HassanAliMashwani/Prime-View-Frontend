/**
 * Public (unauthenticated) content fetcher for the public-facing website.
 * Reads plan and event content blocks from GET /content?section=...
 */

import { API_BASE_URL } from '../apiBase';

export interface ContentBlock {
  id: string;
  section: 'plans' | 'events';
  title: string;
  subtitle?: string;
  category?: string;
  content?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Fetch published content blocks for a section without authentication.
 * Falls back to empty array on any network or server error.
 */
export async function fetchPublicContent(
  section: 'plans' | 'events'
): Promise<ContentBlock[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/content?section=${section}`, {
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const body = await res.json();
    const blocks: ContentBlock[] = Array.isArray(body) ? body : body?.data || body?.blocks || [];
    return blocks;
  } catch {
    return [];
  }
}
