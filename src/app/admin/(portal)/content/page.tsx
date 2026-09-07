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
  Plus,
  Trash2,
  Image as ImageIcon,
  Phone,
  Globe,
  CreditCard,
} from 'lucide-react';
import { AdminSession, ContentBlock, ContentSection } from '@/lib/mock/types';
import { getActiveAdminSession } from '@/lib/dal/adminAuth';
import {
  getContentBlocks,
  acquireContentLock,
  releaseContentLock,
  saveContentBlock,
  createContentBlock,
  deleteContentBlock,
} from '@/lib/dal/content';
import { mockStore } from '@/lib/mock/store';

export default function ContentCMSPage() {
  const router = useRouter();
  const [session, setSession] = useState<AdminSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<ContentSection>('plans');
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Edit / Create Drawer state
  const [editingBlock, setEditingBlock] = useState<ContentBlock | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editForm, setEditForm] = useState<{
    title: string;
    subtitle: string;
    category: string;
    content: string;
    price?: number;
    size?: string;
    downPayment?: string;
    monthly?: string;
    halfYearly?: string;
    possession?: string;
    date?: string;
    location?: string;
    contact?: string;
    website?: string;
    imageUrl?: string;
    tagsString?: string;
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

    // Cross-tab broadcast listener for real-time lock and content updates
    const unsubscribe = mockStore.onBroadcast((event) => {
      if (
        event.type === 'CONTENT_LOCKED' ||
        event.type === 'CONTENT_UNLOCKED' ||
        event.type === 'CONTENT_SAVED' ||
        event.type === 'CONTENT_CREATED' ||
        event.type === 'CONTENT_DELETED'
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
      const t = setTimeout(() => setFeedback(null), 4500);
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

  // Start editing an existing block (Acquire soft edit lock)
  const handleStartEdit = async (block: ContentBlock) => {
    if (!session) return;
    setEditError(null);
    setIsCreating(false);

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
      downPayment: (locked.metadata.downPayment as string) || '',
      monthly: (locked.metadata.monthly as string) || '',
      halfYearly: (locked.metadata.halfYearly as string) || '',
      possession: (locked.metadata.possession as string) || '',
      date: locked.metadata.date,
      location: locked.metadata.location,
      contact: (locked.metadata.contact as string) || '',
      website: (locked.metadata.website as string) || '',
      imageUrl: locked.metadata.imageUrl || '',
      tagsString: Array.isArray(locked.metadata.tags) ? locked.metadata.tags.join(', ') : '',
      featured: Boolean(locked.metadata.featured),
    });
    loadData(session, activeSection);
  };

  // Start creating a new block
  const handleStartCreate = () => {
    if (!session) return;
    setEditingBlock(null);
    setIsCreating(true);
    setEditError(null);
    setEditForm({
      title: '',
      subtitle: '',
      category: activeSection === 'plans' ? 'residential' : 'ceremony',
      content: '',
      price: undefined,
      size: '',
      downPayment: '',
      monthly: '',
      halfYearly: '',
      possession: '',
      date: '',
      location: '',
      contact: '',
      website: '',
      imageUrl: '',
      tagsString: '',
      featured: false,
    });
  };

  // Close / Cancel modal
  const handleCancelModal = async () => {
    if (isCreating) {
      setIsCreating(false);
      setEditError(null);
      return;
    }

    if (session && editingBlock) {
      await releaseContentLock(session, editingBlock.id);
      setEditingBlock(null);
      setEditError(null);
      loadData(session, activeSection);
    }
  };

  // Save changes (Create or Update)
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    setSaving(true);
    setEditError(null);

    const tags = editForm.tagsString
      ? editForm.tagsString.split(',').map((t) => t.trim()).filter(Boolean)
      : undefined;

    const metadata: Record<string, unknown> = {
      imageUrl: editForm.imageUrl?.trim() || undefined,
      featured: editForm.featured,
      tags,
    };

    if (activeSection === 'plans') {
      if (editForm.price !== undefined && !isNaN(editForm.price)) metadata.price = editForm.price;
      if (editForm.size?.trim()) metadata.size = editForm.size.trim();
      if (editForm.downPayment?.trim()) metadata.downPayment = editForm.downPayment.trim();
      if (editForm.monthly?.trim()) metadata.monthly = editForm.monthly.trim();
      if (editForm.halfYearly?.trim()) metadata.halfYearly = editForm.halfYearly.trim();
      if (editForm.possession?.trim()) metadata.possession = editForm.possession.trim();
    } else {
      if (editForm.date?.trim()) metadata.date = editForm.date.trim();
      if (editForm.location?.trim()) metadata.location = editForm.location.trim();
      if (editForm.contact?.trim()) metadata.contact = editForm.contact.trim();
      if (editForm.website?.trim()) metadata.website = editForm.website.trim();
    }

    if (isCreating) {
      const res = await createContentBlock(session, {
        section: activeSection,
        title: editForm.title,
        subtitle: editForm.subtitle,
        category: editForm.category,
        content: editForm.content,
        metadata,
      });
      setSaving(false);

      if (!res.ok) {
        setEditError(res.error || 'Failed to create content block.');
        return;
      }

      setIsCreating(false);
      setFeedback({
        type: 'success',
        message: `${activeSection === 'plans' ? 'Plan card' : 'Event'} "${editForm.title}" published successfully.`,
      });
      loadData(session, activeSection);
      return;
    }

    if (editingBlock) {
      const res = await saveContentBlock(session, editingBlock.id, {
        title: editForm.title,
        subtitle: editForm.subtitle,
        category: editForm.category,
        content: editForm.content,
        metadata,
      });
      setSaving(false);

      if (!res.ok) {
        setEditError(res.error || 'Failed to save content block.');
        return;
      }

      setEditingBlock(null);
      setFeedback({
        type: 'success',
        message: `Content block "${editForm.title}" updated and published successfully.`,
      });
      loadData(session, activeSection);
    }
  };

  // Delete a block with confirmation
  const handleDeleteBlock = async (block: ContentBlock) => {
    if (!session) return;
    if (!confirm(`Are you sure you want to delete "${block.title}"? This cannot be undone.`)) {
      return;
    }

    const res = await deleteContentBlock(session, block.id);
    if (!res.ok) {
      setFeedback({
        type: 'error',
        message: res.error || 'Failed to delete content block.',
      });
      return;
    }

    setFeedback({
      type: 'success',
      message: `Content block "${block.title}" deleted.`,
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
        <span className="ml-3 text-sm font-medium text-slate-600">Loading content CRM...</span>
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
        <h2 className="text-xl font-bold text-slate-900 mb-2 font-serif">Access Denied: Content CRM</h2>
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
                Plans & Events Content CRM
              </h1>
              <p className="text-xs text-slate-500">
                Manage development plans and official society events with 30-minute concurrent edit locking.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
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
                <span>Development Plans ({blocks.length && activeSection === 'plans' ? blocks.length : 6})</span>
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

            {/* Create New Block Button */}
            <button
              onClick={handleStartCreate}
              className="flex items-center gap-2 px-4 py-2 bg-[#10251E] hover:bg-[#18392C] text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#D4AF37]" />
              <span>{activeSection === 'plans' ? 'Add Plan Card' : 'Add Event'}</span>
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
              <div>
                {/* Image Banner if available */}
                {block.metadata.imageUrl && (
                  <div className="relative h-44 w-full bg-slate-900 overflow-hidden border-b border-slate-100 group">
                    <img
                      src={block.metadata.imageUrl as string}
                      alt={block.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
                    {block.metadata.featured && (
                      <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500 text-white shadow-md">
                        <Sparkles className="w-3 h-3" />
                        Featured
                      </span>
                    )}
                    <span className="absolute bottom-3 left-3 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-white border border-white/20">
                      {block.category || block.section}
                    </span>
                  </div>
                )}

                <div className="p-6 space-y-3">
                  {/* Status Bar (if no image banner) */}
                  {!block.metadata.imageUrl && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                        {block.category || block.section}
                      </span>
                      {block.metadata.featured && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                          <Sparkles className="w-3 h-3 text-amber-600" />
                          Featured
                        </span>
                      )}
                    </div>
                  )}

                  {/* Soft Lock Badge */}
                  <div className="flex items-center justify-between">
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

                    {block.metadata.imageUrl && !block.metadata.featured && (
                      <span className="text-[10px] text-slate-400">ID: {block.id}</span>
                    )}
                  </div>

                  {/* Title & Subtitle */}
                  <div>
                    <h3 className="font-serif font-bold text-base text-slate-900 tracking-tight">
                      {block.title}
                    </h3>
                    {block.subtitle && (
                      <div className="text-xs text-slate-500 mt-0.5 font-medium">{block.subtitle}</div>
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
                    {Boolean(block.metadata.downPayment) && (
                      <span className="flex items-center gap-1 bg-amber-50 text-amber-900 px-2 py-0.5 rounded-md border border-amber-200 font-mono text-[10px] font-semibold">
                        <CreditCard className="w-3 h-3 text-amber-700" />
                        Down: {String(block.metadata.downPayment)}
                      </span>
                    )}
                    {Boolean(block.metadata.monthly) && (
                      <span className="flex items-center gap-1 bg-blue-50 text-blue-900 px-2 py-0.5 rounded-md border border-blue-200 font-mono text-[10px] font-semibold">
                        Monthly: {String(block.metadata.monthly)}
                      </span>
                    )}
                    {Boolean(block.metadata.halfYearly) && (
                      <span className="flex items-center gap-1 bg-purple-50 text-purple-900 px-2 py-0.5 rounded-md border border-purple-200 font-mono text-[10px] font-semibold">
                        Half-Yr: {String(block.metadata.halfYearly)}
                      </span>
                    )}
                    {Boolean(block.metadata.possession) && (
                      <span className="flex items-center gap-1 bg-emerald-50 text-emerald-900 px-2 py-0.5 rounded-md border border-emerald-200 font-mono text-[10px] font-semibold">
                        Possession: {String(block.metadata.possession)}
                      </span>
                    )}
                    {Boolean(block.metadata.date) && (
                      <span className="flex items-center gap-1 bg-violet-50 text-violet-900 px-2 py-0.5 rounded-md border border-violet-200 font-medium">
                        <Calendar className="w-3 h-3 text-violet-600" />
                        {String(block.metadata.date)}
                      </span>
                    )}
                    {Boolean(block.metadata.location) && (
                      <span className="flex items-center gap-1 bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md border border-slate-200 font-medium">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        {String(block.metadata.location)}
                      </span>
                    )}
                    {Boolean(block.metadata.contact) && (
                      <span className="flex items-center gap-1 bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-200 font-medium text-[10px]">
                        <Phone className="w-3 h-3 text-emerald-600" />
                        {String(block.metadata.contact)}
                      </span>
                    )}
                    {Boolean(block.metadata.website) && (
                      <span className="flex items-center gap-1 bg-slate-50 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200 font-medium text-[10px]">
                        <Globe className="w-3 h-3 text-slate-500" />
                        {String(block.metadata.website)}
                      </span>
                    )}
                  </div>

                  {/* Tags */}
                  {Array.isArray(block.metadata.tags) && block.metadata.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {block.metadata.tags.map((tag: string) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 text-[10px] bg-slate-50 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200/80"
                        >
                          <Tag className="w-2.5 h-2.5 text-slate-400" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer */}
              <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400">
                  Modified by {block.lastModifiedBy || 'Super Admin'}
                </span>

                <div className="flex items-center gap-2">
                  {/* Delete Block */}
                  <button
                    type="button"
                    title="Delete Block"
                    onClick={() => handleDeleteBlock(block)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Edit Block */}
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
            </div>
          );
        })}
      </div>

      {/* ==================================================== */}
      {/* 30-MINUTE EDIT LOCK DRAWER / CREATE MODAL            */}
      {/* ==================================================== */}
      {(editingBlock || isCreating) && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-2xl shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-700 flex items-center justify-center text-emerald-400">
                  {isCreating ? <Plus className="w-4 h-4" /> : <FileEdit className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base">
                    {isCreating
                      ? `Create New ${activeSection === 'plans' ? 'Development Plan' : 'Society Event'}`
                      : 'Editing Content Block'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Section: {(editingBlock?.section || activeSection).toUpperCase()}
                  </p>
                </div>
              </div>

              {/* 30m countdown badge if editing */}
              <div className="flex items-center gap-3">
                {!isCreating && editingBlock && (
                  <div className="flex items-center gap-1.5 bg-emerald-950/80 border border-emerald-700/60 px-3 py-1 rounded-xl text-xs font-mono font-bold text-emerald-300">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Lock Expiry: {formatCountdown(lockSecondsRemaining)}</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleCancelModal}
                  className="text-slate-400 hover:text-white p-1 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitForm} className="p-6 space-y-4 overflow-y-auto grow">
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
                    placeholder={activeSection === 'plans' ? 'e.g. 10 Marla Residential Plot' : 'e.g. Pre-Launch Ceremony'}
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
                    placeholder={activeSection === 'plans' ? 'e.g. Dimensions: 35 x 70 • Total Price: PKR 4,900,000' : 'e.g. Prime View Cooperative Housing Society Abbottabad'}
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
                    placeholder={activeSection === 'plans' ? 'e.g. residential, commercial' : 'e.g. ceremony, milestone'}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:border-emerald-600"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Full Description / Details *
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Enter complete overview, payment milestones, invitation details, or project description..."
                    value={editForm.content}
                    onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:border-emerald-600 leading-relaxed font-sans"
                  />
                </div>

                {/* Section Specific Fields */}
                {activeSection === 'plans' ? (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Starting / Total Price (PKR)
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 4900000"
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
                        placeholder="e.g. 35 x 70 (10 Marla)"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Down Payment
                      </label>
                      <input
                        type="text"
                        value={editForm.downPayment || ''}
                        onChange={(e) => setEditForm({ ...editForm, downPayment: e.target.value })}
                        placeholder="e.g. PKR 1,225,000 (25%)"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Monthly Installments
                      </label>
                      <input
                        type="text"
                        value={editForm.monthly || ''}
                        onChange={(e) => setEditForm({ ...editForm, monthly: e.target.value })}
                        placeholder="e.g. PKR 48,000 x 39"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Half-Yearly Installments
                      </label>
                      <input
                        type="text"
                        value={editForm.halfYearly || ''}
                        onChange={(e) => setEditForm({ ...editForm, halfYearly: e.target.value })}
                        placeholder="e.g. PKR 175,000 x 8"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        On Possession
                      </label>
                      <input
                        type="text"
                        value={editForm.possession || ''}
                        onChange={(e) => setEditForm({ ...editForm, possession: e.target.value })}
                        placeholder="e.g. PKR 400,000"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Event Date & Time
                      </label>
                      <input
                        type="text"
                        value={editForm.date || ''}
                        onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                        placeholder="e.g. Monday, 17 August | 12:00 PM"
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
                        placeholder="e.g. Rosecliff Marquee, Main Margalla Road, E-11/1, Islamabad"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Contact Number
                      </label>
                      <input
                        type="text"
                        value={editForm.contact || ''}
                        onChange={(e) => setEditForm({ ...editForm, contact: e.target.value })}
                        placeholder="e.g. 0333 0111112"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Website Link
                      </label>
                      <input
                        type="text"
                        value={editForm.website || ''}
                        onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                        placeholder="e.g. www.primeview.pk"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                      />
                    </div>
                  </>
                )}

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Image URL or Asset Path
                  </label>
                  <input
                    type="text"
                    value={editForm.imageUrl || ''}
                    onChange={(e) => setEditForm({ ...editForm, imageUrl: e.target.value })}
                    placeholder="/new assests/our plan assests/card 1.png or /new assests/Events and media/event1/..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono"
                  />
                  {editForm.imageUrl && (
                    <div className="mt-2 h-24 w-40 rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                      <img
                        src={editForm.imageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tags (Comma-separated)
                  </label>
                  <input
                    type="text"
                    value={editForm.tagsString || ''}
                    onChange={(e) => setEditForm({ ...editForm, tagsString: e.target.value })}
                    placeholder="Residential, 10 Marla, Luxury, Rosecliff"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 select-none cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editForm.featured}
                      onChange={(e) => setEditForm({ ...editForm, featured: e.target.checked })}
                      className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <span>Highlight as Featured on Portal Landing</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleCancelModal}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
                >
                  {isCreating ? 'Cancel' : 'Discard & Release Lock'}
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
                      <span>{isCreating ? 'Create & Publish' : 'Save Changes & Publish'}</span>
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
