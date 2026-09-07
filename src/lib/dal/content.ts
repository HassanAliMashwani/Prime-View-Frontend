import { mockStore } from '../mock/store';
import { AdminSession, ContentBlock, ContentSection } from '../mock/types';

/**
 * Retrieve content blocks for CMS management, filtered optionally by section ('plans' | 'events').
 */
export async function getContentBlocks(
  session: AdminSession,
  section?: ContentSection
): Promise<{ ok: boolean; blocks: ContentBlock[]; error?: string }> {
  mockStore.cleanExpiredContentLocks();

  let blocks = mockStore.contentBlocks;
  if (section) {
    blocks = blocks.filter((b) => b.section === section);
  }

  return { ok: true, blocks };
}

/**
 * Acquire a 30-minute soft edit lock on a CMS content block.
 * Exception 4.2: Prevents simultaneous conflicting edits.
 * Exception 4.3: 30-minute auto-release timeout.
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
  mockStore.cleanExpiredContentLocks();

  // Permission guard
  if (!session.permissions.can_edit_content && session.role !== 'super_admin') {
    return { ok: false, error: 'FORBIDDEN' };
  }

  const block = mockStore.contentBlocks.find((b) => b.id === blockId);
  if (!block) {
    return { ok: false, error: 'CONTENT_BLOCK_NOT_FOUND' };
  }

  const now = Date.now();
  const lockExpiryMs = 30 * 60 * 1000;

  // Check if locked by another admin
  if (block.lockedBy && block.lockedBy !== session.adminId) {
    if (block.lockedAt && now - block.lockedAt <= lockExpiryMs) {
      return {
        ok: false,
        error: 'LOCKED_BY_ANOTHER',
        lockedByName: block.lockedByName,
        lockedAt: block.lockedAt,
      };
    }
  }

  // Acquire lock
  block.lockedBy = session.adminId;
  block.lockedByName = session.fullName;
  block.lockedAt = now;

  mockStore.scheduleContentLockTimeout(blockId, lockExpiryMs);

  mockStore.broadcast({
    type: 'CONTENT_LOCKED',
    timestamp: new Date().toISOString(),
    contentBlockId: blockId,
    lockedBy: session.adminId,
    lockedByName: session.fullName,
  });

  mockStore.addAuditEntry({
    actorId: session.adminId,
    actorName: session.fullName,
    actorRole: session.role,
    action: 'CONTENT_LOCK_ACQUIRED',
    entityType: 'content',
    entityId: blockId,
    details: `Admin ${session.fullName} acquired 30m CMS edit lock on "${block.title}"`,
  });

  return { ok: true, block };
}

/**
 * Release an active CMS content edit lock.
 */
export async function releaseContentLock(
  session: AdminSession,
  blockId: string
): Promise<{ ok: boolean; error?: string }> {
  mockStore.loadFromStorage();
  const block = mockStore.contentBlocks.find((b) => b.id === blockId);
  if (!block) {
    return { ok: false, error: 'CONTENT_BLOCK_NOT_FOUND' };
  }

  if (block.lockedBy === session.adminId || session.role === 'super_admin') {
    block.lockedBy = undefined;
    block.lockedByName = undefined;
    block.lockedAt = undefined;
    mockStore.clearContentLockTimeout(blockId);

    mockStore.broadcast({
      type: 'CONTENT_UNLOCKED',
      timestamp: new Date().toISOString(),
      contentBlockId: blockId,
      reason: 'MANUAL_RELEASE',
    });

    mockStore.addAuditEntry({
      actorId: session.adminId,
      actorName: session.fullName,
      actorRole: session.role,
      action: 'CONTENT_LOCK_RELEASED',
      entityType: 'content',
      entityId: blockId,
      details: `Released CMS edit lock on "${block.title}"`,
    });

    return { ok: true };
  }

  return { ok: false, error: 'NOT_LOCK_HOLDER' };
}

/**
 * Save updates to a content block atomically and release edit lock.
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
  mockStore.loadFromStorage();

  if (!session.permissions.can_edit_content && session.role !== 'super_admin') {
    return { ok: false, error: 'FORBIDDEN' };
  }

  const block = mockStore.contentBlocks.find((b) => b.id === blockId);
  if (!block) {
    return { ok: false, error: 'CONTENT_BLOCK_NOT_FOUND' };
  }

  // Lock ownership verification
  if (block.lockedBy && block.lockedBy !== session.adminId && session.role !== 'super_admin') {
    return { ok: false, error: 'LOCK_LOST' };
  }

  const oldSnapshot = {
    title: block.title,
    subtitle: block.subtitle,
    category: block.category,
    content: block.content,
    metadata: { ...block.metadata },
  };

  // Apply updates atomically
  if (updates.title !== undefined) block.title = updates.title.trim();
  if (updates.subtitle !== undefined) block.subtitle = updates.subtitle.trim();
  if (updates.category !== undefined) block.category = updates.category.trim();
  if (updates.content !== undefined) block.content = updates.content.trim();
  if (updates.metadata) block.metadata = { ...block.metadata, ...updates.metadata };

  block.lastModifiedBy = session.fullName;
  block.lastModifiedAt = new Date().toISOString();

  // Clear lock
  block.lockedBy = undefined;
  block.lockedByName = undefined;
  block.lockedAt = undefined;
  mockStore.clearContentLockTimeout(blockId);

  // Broadcast and Audit
  mockStore.broadcast({
    type: 'CONTENT_SAVED',
    timestamp: new Date().toISOString(),
    contentBlockId: blockId,
    modifiedBy: session.fullName,
  });

  mockStore.broadcast({
    type: 'CONTENT_UNLOCKED',
    timestamp: new Date().toISOString(),
    contentBlockId: blockId,
    reason: 'SAVE_COMPLETED',
  });

  mockStore.addAuditEntry({
    actorId: session.adminId,
    actorName: session.fullName,
    actorRole: session.role,
    action: 'CONTENT_UPDATED',
    entityType: 'content',
    entityId: blockId,
    details: `Updated content block "${block.title}" (${block.section})`,
    oldValue: JSON.stringify(oldSnapshot),
    newValue: JSON.stringify({
      title: block.title,
      subtitle: block.subtitle,
      category: block.category,
      content: block.content,
      metadata: block.metadata,
    }),
  });

  return { ok: true, block };
}
