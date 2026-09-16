import { AdminSession, ContentBlock, ContentSection } from '../mock/types';
import { apiGet, apiPost, apiDelete } from '../api';

/**
 * Retrieve content blocks for CMS management, filtered optionally by section ('plans' | 'events').
 * Calls backend GET /content.
 */
export async function getContentBlocks(
  session: AdminSession,
  section?: ContentSection
): Promise<{ ok: boolean; blocks: ContentBlock[]; error?: string }> {
  const query = section ? `?section=${section}` : '';
  const res = await apiGet<any>(`/content${query}`, session.token);

  if (!res.ok) {
    return { ok: false, blocks: [], error: res.error || 'FETCH_CONTENT_FAILED' };
  }

  const blocks: ContentBlock[] = Array.isArray(res.data)
    ? res.data
    : (res.data as any)?.blocks || [];

  return { ok: true, blocks };
}

/**
 * Acquire a 30-minute soft edit lock on a CMS content block.
 * Calls backend POST /content/:id/lock.
 */
export async function acquireContentLock(
  session: AdminSession,
  blockId: string
): Promise<{
  ok: boolean;
  block?: ContentBlock;
  error?: string;
  lockedByName?: string;
  lockedAt?: number;
}> {
  const res = await apiPost<any>(`/content/${blockId}/lock`, {}, session.token);

  if (!res.ok) {
    return {
      ok: false,
      error: res.error || 'LOCK_ACQUIRE_FAILED',
      lockedByName: (res.data as any)?.lockedByName,
      lockedAt: (res.data as any)?.lockedAt ? new Date((res.data as any).lockedAt).getTime() : undefined,
    };
  }

  const block = (res.data as any)?.block || res.data;
  return { ok: true, block };
}

/**
 * Release an active CMS content edit lock.
 * Calls backend POST /content/:id/release-lock.
 */
export async function releaseContentLock(
  session: AdminSession,
  blockId: string
): Promise<{ ok: boolean; error?: string }> {
  const res = await apiPost<any>(`/content/${blockId}/release-lock`, {}, session.token);

  if (!res.ok) {
    return { ok: false, error: res.error || 'RELEASE_LOCK_FAILED' };
  }

  return { ok: true };
}

/**
 * Save updates to a content block atomically and release edit lock.
 * Calls backend POST /content/:id/save.
 */
export async function saveContentBlock(
  session: AdminSession,
  blockId: string,
  updates: {
    title?: string;
    subtitle?: string;
    category?: string;
    content?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<{ ok: boolean; block?: ContentBlock; error?: string }> {
  const res = await apiPost<any>(`/content/${blockId}/save`, updates, session.token);

  if (!res.ok) {
    return { ok: false, error: res.error || 'SAVE_CONTENT_FAILED' };
  }

  const block = (res.data as any)?.block || res.data;
  return { ok: true, block };
}

/**
 * Create a new content block (plan or event) in the CMS.
 * Calls backend POST /content.
 */
export async function createContentBlock(
  session: AdminSession,
  data: {
    section: ContentSection;
    title: string;
    subtitle?: string;
    category?: string;
    content: string;
    metadata?: Record<string, unknown>;
  }
): Promise<{ ok: boolean; block?: ContentBlock; error?: string }> {
  const res = await apiPost<any>('/content', data, session.token);

  if (!res.ok) {
    return { ok: false, error: res.error || 'CREATE_CONTENT_FAILED' };
  }

  const block = (res.data as any)?.block || res.data;
  return { ok: true, block };
}

/**
 * Delete a content block from the CMS.
 * Calls backend DELETE /content/:id.
 */
export async function deleteContentBlock(
  session: AdminSession,
  blockId: string
): Promise<{ ok: boolean; error?: string }> {
  const res = await apiDelete(`/content/${blockId}`, session.token);

  if (!res.ok) {
    return { ok: false, error: res.error || 'DELETE_CONTENT_FAILED' };
  }

  return { ok: true };
}
