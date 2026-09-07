'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileEdit,
  Layers,
  Calendar,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Save,
  X,
  ShieldAlert,
  Tag,
  Sparkles,
  MapPin,
  DollarSign,
  Maximize2,
  RefreshCw,
} from 'lucide-react';
import { AdminSession, ContentBlock, ContentSection } from '@/lib/mock/types';
import { getActiveAdminSession } from '@/lib/dal/adminAuth';
import {
  getContentBlocks,
  acquireContentLock,
  releaseContentLock,
  saveContentBlock,
} from '@/lib/dal/content';
import { mockStore } from '@/lib/mock/store';

export default function ContentCMSPage() {
  const router = useRouter();
  const [session, setSession] = useState<AdminSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<ContentSection>('plans');
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Edit Drawer state
  const [editingBlock, setEditingBlock] = useState<ContentBlock | null>(null);
  const [editForm, setEditForm] = useState<{
    title: string;
    subtitle: string;
    category: string;
    content: string;
    price?: number;
    size?: string;
    date?: string;
    location?: string;
    imageUrl?: string;
    featured: boolean;
  }>({
    title: '',
    subtitle: '',
    category: '',
    content: '',
    featured: false,
  });
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // 30-minute lock countdown timer
  const [lockSecondsRemaining, setLockSecondsRemaining] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load content blocks
  const loadData = useCallback(async (currentSession: AdminSession, section: ContentSection) => {
    const res = await getContentBlocks(currentSession, section);
    if (res.ok) {
      setBlocks(res.blocks);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const cur = getActiveAdminSession();
    if (!cur) {
      router.push('/admin/login');
      return;
    }
    setSession(cur);
    loadData(cur, activeSection);

    // Cross-tab broadcast listener for real-time lock updates
    const unsubscribe = mockStore.onBroadcast((event) => {
      if (
        event.type === 'CONTENT_LOCKED' ||
        event.type === 'CONTENT_UNLOCKED' ||
        event.type === 'CONTENT_SAVED'
      ) {
        const latestSession = getActiveAdminSession();
        if (latestSession) {
          loadData(latestSession, activeSection);
        }
      }
    });

    return () => unsubscribe();
  }, [router, activeSection, loadData]);

  // Flash feedback timer
  useEffect(() => {
    if (feedback) {
      const t = setTimeout(() => setFeedback(null), 4000);
      return () => clearTimeout(t);
    }
  }, [feedback]);

  // Countdown timer effect while editing
  useEffect(() => {
    if (!editingBlock || !editingBlock.lockedAt) {
      if (timerRef.current) clearInterval(timerRef.current);
      setLockSecondsRemaining(null);
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const elapsedMs = now - (editingBlock.lockedAt || now);
      const remainingMs = Math.max(0, 30 * 60 * 1000 - elapsedMs);
      const remainingSecs = Math.floor(remainingMs / 1000);
      setLockSecondsRemaining(remainingSecs);

      if (remainingSecs <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        setEditingBlock(null);
        setFeedback({
          type: 'error',
          message: 'Your 30-minute edit lock expired. The block was released.',
        });
        if (session) loadData(session, activeSection);
      }
    };

    updateTimer();
    timerRef.current = setInterval(updateTimer, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [editingBlock, session, activeSection, loadData]);

  // Start editing a block (Acquire soft edit lock)
  const handleStartEdit = async (block: ContentBlock) => {
    if (!session) return;
    setEditError(null);

    const res = await acquireContentLock(session, block.id);
    if (!res.ok) {
      if (res.error === 'LOCKED_BY_ANOTHER') {
        setFeedback({
          type: 'error',
          message: `This content block is currently locked and being edited by ${res.lockedByName || 'another administrator'}.`,
        });
      } else {
        setFeedback({
          type: 'error',
          message: res.error || 'Failed to acquire content edit lock.',
        });
      }
      loadData(session, activeSection);
      return;
    }

    const locked = res.block || block;
    setEditingBlock(locked);
    setEditForm({
      title: locked.title,
      subtitle: locked.subtitle || '',
      category: locked.category || '',
      content: locked.content,
      price: locked.metadata.price,
      size: locked.metadata.size,
      date: locked.metadata.date,
      location: locked.metadata.location,
      imageUrl: locked.metadata.imageUrl,
      featured: Boolean(locked.metadata.featured),
    });
    loadData(session, activeSection);
  };

  // Close / Cancel edit (Release soft lock)
  const handleCancelEdit = async () => {
    if (!session || !editingBlock) return;
    await releaseContentLock(session, editingBlock.id);
    setEditingBlock(null);
    loadData(session, activeSection);
  };

  // Save changes (Commit and release lock)
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !editingBlock) return;
    setSaving(true);
    setEditError(null);

    const res = await saveContentBlock(session, editingBlock.id, {
      title: editForm.title,
      subtitle: editForm.subtitle,
      category: editForm.category,
      content: editForm.content,
      metadata: {
        price: editForm.price,
        size: editForm.size,
        date: editForm.date,
        location: editForm.location,
        imageUrl: editForm.imageUrl,
        featured: editForm.featured,
      },
    });
    setSaving(false);

    if (!res.ok) {
      setEditError(res.error || 'Failed to save content block.');
      return;
    }

    setEditingBlock(null);
    setFeedback({
      type: 'success',
      message: `Content block "${editForm.title}" published successfully.`,
    });
    loadData(session, activeSection);
  };

  // Format countdown seconds into mm:ss
  const formatCountdown = (totalSecs: number | null) => {
    if (totalSecs === null) return '--:--';
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16">
        <RefreshCw className="w-6 h-6 animate-spin text-emerald-700" />
        <span className="ml-3 text-sm font-medium text-slate-600">Loading content CMS...</span>
      </div>
    );
  }

  // Permission Guard
  const canAccess = session?.role === 'super_admin' || session?.permissions.can_edit_content;
  if (!canAccess) {
    return (
      <div className="max-w-2xl mx-auto mt-12 bg-white rounded-2xl border border-rose-200 p-8 shadow-sm text-center">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2 font-serif">Access Denied: Content CMS</h2>
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          Your administrative account does not have permission to edit website plans or society events. Contact a Super Administrator to adjust your privileges.
        </p>
        <button
          onClick={() => router.push('/admin/dashboard')}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Feedback banner */}
      {feedback && (
        <div
          className={`flex items-center gap-3 p-4 rounded-xl border text-sm font-medium transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-rose-50 text-rose-900 border-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Header & Section Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600">
              <FileEdit className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 font-serif tracking-tight">
                Plans & Events Content CMS
              </h1>
              <p className="text-xs text-slate-500">
                Manage development plans and official society events with 30-minute concurrent edit locking.
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/80 text-xs font-bold">
            <button
              onClick={() => {
                setActiveSection('plans');
                if (session) loadData(session, 'plans');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all cursor-pointer ${
                activeSection === 'plans'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              <span>Development Plans</span>
            </button>
            <button
              onClick={() => {
                setActiveSection('events');
                if (session) loadData(session, 'events');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all cursor-pointer ${
                activeSection === 'events'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-violet-600" />
              <span>Society Events</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content Blocks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {blocks.map((block) => {
          const isLockedByMe = block.lockedBy === session?.adminId;
          const isLockedByOther = block.lockedBy && block.lockedBy !== session?.adminId;

          return (
            <div
              key={block.id}
              className={`bg-white rounded-2xl border transition-all duration-200 shadow-xs overflow-hidden flex flex-col justify-between ${
                isLockedByMe
                  ? 'border-emerald-300 ring-2 ring-emerald-500/20'
                  : isLockedByOther
                  ? 'border-amber-200 bg-amber-50/20'
                  : 'border-slate-200/80 hover:border-slate-300'
              }`}
            >
              <div className="p-6 space-y-3">
                {/* Status Bar */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                    {block.category || block.section}
                  </span>

                  {/* Soft Lock Badge */}
                  {isLockedByMe ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-300 animate-pulse">
                      <Lock className="w-3 h-3 text-emerald-700" />
                      <span>Editing by You</span>
                    </span>
                  ) : isLockedByOther ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                      <Lock className="w-3 h-3 text-amber-700" />
                      <span>Locked by {block.lockedByName}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-50 text-slate-600 border border-slate-200">
                      <Unlock className="w-3 h-3 text-slate-400" />
                      <span>Available</span>
                    </span>
                  )}
                </div>

                {/* Title & Subtitle */}
                <div>
                  <h3 className="font-serif font-bold text-base text-slate-900 tracking-tight">
                    {block.title}
                  </h3>
                  {block.subtitle && (
                    <div className="text-xs text-slate-500 mt-0.5">{block.subtitle}</div>
                  )}
                </div>

                {/* Content snippet */}
                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                  {block.content}
                </p>

                {/* Metadata Pills */}
                <div className="pt-2 flex flex-wrap gap-2 text-[11px] text-slate-600 border-t border-slate-100">
                  {block.metadata.price && (
                    <span className="flex items-center gap-1 bg-emerald-50 text-emerald-900 px-2 py-0.5 rounded-md border border-emerald-200 font-mono font-bold">
                      <DollarSign className="w-3 h-3 text-emerald-700" />
                      PKR {block.metadata.price.toLocaleString()}
                    </span>
                  )}
                  {block.metadata.size && (
                    <span className="flex items-center gap-1 bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md border border-slate-200 font-medium">
                      <Maximize2 className="w-3 h-3 text-slate-500" />
                      {block.metadata.size}
                    </span>
                  )}
                  {block.metadata.date && (
                    <span className="flex items-center gap-1 bg-violet-50 text-violet-900 px-2 py-0.5 rounded-md border border-violet-200 font-medium">
                      <Calendar className="w-3 h-3 text-violet-600" />
                      {block.metadata.date}
                    </span>
                  )}
                  {block.metadata.location && (
                    <span className="flex items-center gap-1 bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md border border-slate-200 font-medium">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      {block.metadata.location}
                    </span>
                  )}
                </div>
              </div>

              {/* Card Footer */}
              <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400">
                  Modified by {block.lastModifiedBy || 'Super Admin'}
                </span>

                <button
                  type="button"
                  disabled={Boolean(isLockedByOther)}
                  onClick={() => handleStartEdit(block)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
                    isLockedByOther
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-200'
                      : isLockedByMe
                      ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                      : 'bg-[#10251E] hover:bg-[#18392C] text-white'
                  }`}
                >
                  <FileEdit className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>{isLockedByMe ? 'Resume Edit' : 'Edit Block'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ==================================================== */}
      {/* 30-MINUTE EDIT LOCK DRAWER / MODAL                   */}
      {/* ==================================================== */}
      {editingBlock && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-2xl shadow-2xl overflow-hidden my-8">
            {/* Modal Header with Countdown Timer */}
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-700 flex items-center justify-center text-emerald-400">
                  <FileEdit className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base">Editing Content Block</h3>
                  <p className="text-[11px] text-slate-400">Section: {editingBlock.section.toUpperCase()}</p>
                </div>
              </div>

              {/* 30m countdown badge */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 bg-emerald-950/80 border border-emerald-700/60 px-3 py-1 rounded-xl text-xs font-mono font-bold text-emerald-300">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Lock Expiry: {formatCountdown(lockSecondsRemaining)}</span>
                </div>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              {editError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-900 rounded-xl text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Subtitle / Summary
                  </label>
                  <input
                    type="text"
                    value={editForm.subtitle}
                    onChange={(e) => setEditForm({ ...editForm, subtitle: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Category Tag
                  </label>
                  <input
                    type="text"
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    placeholder="e.g. Master Plan, Groundbreaking, Balloting"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:border-emerald-600"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Full Description / Details *
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={editForm.content}
                    onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:border-emerald-600 leading-relaxed font-sans"
                  />
                </div>

                {/* Section Specific Metadata */}
                {editingBlock.section === 'plans' ? (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Starting Price (PKR)
                      </label>
                      <input
                        type="number"
                        value={editForm.price || ''}
                        onChange={(e) =>
                          setEditForm({ ...editForm, price: Number(e.target.value) || undefined })
                        }
                        className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Plot Size / Dimensions
                      </label>
                      <input
                        type="text"
                        value={editForm.size || ''}
                        onChange={(e) => setEditForm({ ...editForm, size: e.target.value })}
                        placeholder="e.g. 1 Kanal, 10 Marla"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Event Date
                      </label>
                      <input
                        type="text"
                        value={editForm.date || ''}
                        onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                        placeholder="e.g. October 15, 2026"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Location / Venue
                      </label>
                      <input
                        type="text"
                        value={editForm.location || ''}
                        onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                        placeholder="e.g. Society Site Office, Expressway"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                      />
                    </div>
                  </>
                )}

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Image URL
                  </label>
                  <input
                    type="text"
                    value={editForm.imageUrl || ''}
                    onChange={(e) => setEditForm({ ...editForm, imageUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 select-none cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editForm.featured}
                      onChange={(e) => setEditForm({ ...editForm, featured: e.target.checked })}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Highlight as Featured on Portal Landing</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Discard & Release Lock
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving & Broadcasting...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Changes & Publish</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
