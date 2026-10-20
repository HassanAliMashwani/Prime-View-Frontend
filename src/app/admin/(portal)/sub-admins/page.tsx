'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  UserPlus,
  ShieldCheck,
  ShieldAlert,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Mail,
  User,
  Check,
  X,
  Layers,
  KeyRound,
  RefreshCw,
  Search,
  Filter,
  CheckSquare,
  Square,
  Shield,
  Clock,
  Sparkles,
  Info,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  Copy,
} from 'lucide-react';
import { AdminSession, AdminUser, BlockId } from '@/lib/mock/types';
import { getActiveAdminSession } from '@/lib/dal/adminAuth';
import { getSubAdmins, createSubAdmin, updateSubAdmin, deleteSubAdmin, resetAdminPassword, getAvailableBlocks, CreateSubAdminInput, UpdateSubAdminInput } from '@/lib/dal/users';
import { MODULE_REGISTRY, ModuleRegistryItem } from '@/lib/constants/moduleRegistry';
import { getCache, setCache, clearCachePrefix } from '@/lib/dal/apiCache';
import { runLane1, runLane2, enqueueLane2 } from '@/lib/requestLanes';
import { AdminActionToast } from '@/components/admin/AdminActionToast';
import { toSafeErrorMessage } from '@/lib/safeError';

const parseAdminTitle = (fullName?: string) => {
  if (!fullName) return { displayName: 'Administrator', roleTitle: null };
  const match = fullName.match(/^(.*?)\s*\((.*?)\)$/);
  if (match) {
    return {
      displayName: match[1].trim(),
      roleTitle: match[2].trim(),
    };
  }
  return {
    displayName: fullName,
    roleTitle: null,
  };
};

const formatSinceDate = (dateStr?: string) => {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
};

const PAGE_SIZE = 10;
const DEFAULT_BLOCKS: { id: BlockId | string; name: string }[] = [
  { id: 'abbott', name: 'Abbott Block' },
  { id: 'royal', name: 'Royal Block' },
  { id: 'overseas', name: 'Overseas Block' },
  { id: 'elite', name: 'Elite Block' },
  { id: 'commercial', name: 'Commercial Block' },
  { id: 'npf-phase-1', name: 'NPF Phase 1' },
];

const BLOCK_BADGES: Record<string, string> = {
  abbott: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  royal: 'bg-amber-50 text-amber-800 border-amber-200',
  overseas: 'bg-sky-50 text-sky-800 border-sky-200',
  elite: 'bg-purple-50 text-purple-800 border-purple-200',
  commercial: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  'npf-phase-1': 'bg-teal-50 text-teal-800 border-teal-200',
  'npf-phase-2': 'bg-cyan-50 text-cyan-800 border-cyan-200',
};

const COMBINED_PERMISSION_GROUPS = [
  {
    id: 'plots',
    label: 'Reserve, Book, Sort Reservations, and Master Plan',
    description: 'This one checkbox opens Master Plan, plot reserve, plot book, and Sort Reservations.',
    keys: ['can_reserve', 'can_book', 'can_view_master_plan'],
  },
  {
    id: 'members',
    label: 'Create Customer Account and View Customer Directory',
    description: 'Grants access to customer registration and customer directory.',
    keys: ['can_create_customer', 'can_view_customers'],
  },
  {
    id: 'sales',
    label: 'View Sales History',
    description: 'Grants access to sales reports and sales transaction history.',
    keys: ['can_view_sales_reports', 'can_view_sales_history'],
  },
] as const;

const STANDALONE_PERMISSIONS = [
  {
    key: 'can_edit_content',
    label: 'Edit Website Plans',
    description: 'Manage website content, master development plans, and society events.',
  },
  {
    key: 'can_verify_receipts',
    label: 'Receipt Verification',
    description: 'Inspect, verify, approve, or reject customer bank deposit slips.',
  },
  {
    key: 'can_view_inventory',
    label: 'View Inventory Overview',
    description: 'Access the inventory dashboard and sector availability reports.',
  },
] as const;

// Default initial permissions for creating a new sub-admin
const getDefaultCreatePermissions = (): Record<string, boolean> => {
  const perms: Record<string, boolean> = {};
  for (const item of MODULE_REGISTRY) {
    perms[item.key] = true;
  }
  return perms;
};

export default function TeamsPage() {
  const router = useRouter();
  const getInit = () => {
    if (typeof window === 'undefined') return null;
    const s = getActiveAdminSession();
    if (!s) return null;
    const adminId = s.adminId || s.username || 'admin';
    return getCache<{ subAdmins: AdminUser[], total: number }>(`/sub-admins:${adminId}:page=1:size=${PAGE_SIZE}:status=all:search=`, true);
  };
  const init = getInit();

  const [session, setSession] = useState<AdminSession | null>(() => (typeof window === 'undefined' ? null : getActiveAdminSession()));
  const [hasLoadedOnce, setHasLoadedOnce] = useState<boolean>(Boolean(init));
  const [subAdmins, setSubAdmins] = useState<AdminUser[]>(init?.subAdmins || []);
  const [loading, setLoading] = useState(!init);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [page, setPage] = useState<number>(1);
  const [totalRecords, setTotalRecords] = useState<number>(init?.total || 0);
  const [availableBlocks, setAvailableBlocks] = useState<{ id: BlockId | string; name: string }[]>(() => {
    if (typeof window === 'undefined') return DEFAULT_BLOCKS;
    const cached = getCache<{ blocks: { id: BlockId | string; name: string }[] }>('/admin/blocks', true);
    return cached?.blocks && cached.blocks.length > 0 ? cached.blocks : DEFAULT_BLOCKS;
  });

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  const [confirmAdmin, setConfirmAdmin] = useState<AdminUser | null>(null);
  const [confirmProcessing, setConfirmProcessing] = useState(false);
  const [deleteAdmin, setDeleteAdmin] = useState<AdminUser | null>(null);
  const [deleteProcessing, setDeleteProcessing] = useState(false);
  const [resetSubmitting, setResetSubmitting] = useState<string | null>(null);
  const [resetModalData, setResetModalData] = useState<{
    admin: AdminUser;
    newPassword: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Detail panel modal state (Item 4)
  const [selectedAdminDetail, setSelectedAdminDetail] = useState<AdminUser | null>(null);

  // New sub-admin credentials panel (Item 5)
  const [createdCredentials, setCreatedCredentials] = useState<{
    fullName: string;
    username: string;
    password: string;
  } | null>(null);
  const [createdCredsCopied, setCreatedCredsCopied] = useState<string | null>(null);

  // Form states
  const [createForm, setCreateForm] = useState<CreateSubAdminInput>({
    fullName: '',
    email: '',
    username: '',
    password: '',
    assignedBlocks: ['abbott', 'royal'],
    permissions: getDefaultCreatePermissions(),
  });
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Edit form state
  const [editForm, setEditForm] = useState<UpdateSubAdminInput>({});
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const reqIdRef = React.useRef(0);
  const statusFilterRef = React.useRef(statusFilter);
  useEffect(() => {
    statusFilterRef.current = statusFilter;
  }, [statusFilter]);
  const [searchInput, setSearchInput] = useState('');

  const loadData = useCallback(async (currentSession: AdminSession, p = 1, st = statusFilterRef.current, search = '', isBackground = false) => {
    if (currentSession.role !== 'super_admin') {
      setLoading(false);
      return;
    }

    const adminId = currentSession.adminId || currentSession.username || 'admin';
    const cacheKey = `/sub-admins:${adminId}:page=${p}:size=${PAGE_SIZE}:status=${st}:search=${search || ''}`;

    if (!isBackground) {
      const cached = getCache<{ subAdmins: AdminUser[], total: number }>(cacheKey, false);
      if (cached) {
        setSubAdmins(cached.subAdmins || []);
        setTotalRecords(cached.total || 0);
        setLoading(false);
      } else {
        setSubAdmins([]);
        setLoading(true);
      }
    }

    const currentReq = ++reqIdRef.current;
    setFetchError(null);
    const fetcher = async (signal?: AbortSignal) => {
      return await getSubAdmins(currentSession, {
        search,
        status: st,
        page: p,
        pageSize: PAGE_SIZE
      }, signal);
    };

    try {
      let res: any;
      if (isBackground) {
        res = await runLane2({
          screen: 'sub-admins',
          key: cacheKey,
          isRefresh: true,
          fn: fetcher,
        });
      } else {
        res = await runLane1({
          screen: 'sub-admins',
          key: cacheKey,
          fn: fetcher,
        });
      }

      if (!res || currentReq !== reqIdRef.current || st !== statusFilterRef.current) return;

      if (res.ok) {
        const items = res.subAdmins || [];
        setSubAdmins(items);
        setTotalRecords(res.total || 0);
        setCache(cacheKey, { subAdmins: items, total: res.total || 0 });

        // Prefetch next page into cache if next page exists and allowed using Lane 2
        const totalPages = Math.ceil((res.total || 0) / PAGE_SIZE);
        if (p < totalPages && currentSession.role === 'super_admin') {
          const nextP = p + 1;
          const nextKey = `/sub-admins:${adminId}:page=${nextP}:size=${PAGE_SIZE}:status=${st}:search=${search || ''}`;
          if (!getCache(nextKey, false)) {
            enqueueLane2(
              async (signal) => {
                const nextRes = await getSubAdmins(currentSession, {
                  search,
                  status: st,
                  page: nextP,
                  pageSize: PAGE_SIZE,
                }, signal);
                if (nextRes.ok) {
                  setCache(nextKey, { subAdmins: nextRes.subAdmins || [], total: nextRes.total || 0 });
                }
                return nextRes;
              },
              nextKey,
              'sub-admins'
            );
          }
        }
      } else {
        setFetchError(res.message || 'Failed to retrieve team members.');
      }
    } catch (err: any) {
      if (err?.message === 'REQUEST_SUPERSEDED') return;
      if (currentReq !== reqIdRef.current) return;
      setFetchError('Network communication error while loading team members.');
    } finally {
      if (currentReq === reqIdRef.current && !isBackground) {
        setHasLoadedOnce(true);
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearchTerm(searchInput);
      setPage(1);
      if (session) loadData(session, 1, statusFilterRef.current, searchInput, false);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput, session, loadData]);

  const handleStatusFilterChange = (newStatus: 'all' | 'active' | 'suspended') => {
    statusFilterRef.current = newStatus;
    setStatusFilter(newStatus);
    setPage(1);
    if (!session) return;
    const adminId = session.adminId || session.username || 'admin';
    const cacheKey = `/sub-admins:${adminId}:page=1:size=${PAGE_SIZE}:status=${newStatus}:search=${searchInput || ''}`;
    const cached = getCache<{ subAdmins: AdminUser[], total: number }>(cacheKey, false);
    if (cached) {
      setSubAdmins(cached.subAdmins || []);
      setTotalRecords(cached.total || 0);
      setLoading(false);
    } else {
      setSubAdmins([]);
      setLoading(true);
    }
    loadData(session, 1, newStatus, searchInput, false);
  };

  useEffect(() => {
    const cur = getActiveAdminSession();
    if (!cur) {
      router.push('/admin/login');
      return;
    }
    setSession(cur);
    loadData(cur, 1, statusFilterRef.current, '', false);
    // Load available blocks directly from the Block table
    getAvailableBlocks(cur).then((res) => {
      if (res.ok && res.blocks && res.blocks.length > 0) {
        setAvailableBlocks(res.blocks);
        setCache('/admin/blocks', { blocks: res.blocks });
      }
    });
  }, [router, loadData]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    if (session) {
      loadData(session, newPage, statusFilterRef.current, searchTerm, false);
    }
  };

  // Auto-refresh via polling using Lane 2
  useEffect(() => {
    const intervalId = setInterval(() => {
      const s = getActiveAdminSession();
      if (s && searchTerm === '' && statusFilterRef.current === 'all') {
        loadData(s, 1, 'all', '', true);
      }
    }, 30000);

    return () => clearInterval(intervalId);
  }, [loadData, searchTerm]);

  // Flash feedback timer
  useEffect(() => {
    if (feedback) {
      const t = setTimeout(() => setFeedback(null), 4500);
      return () => clearTimeout(t);
    }
  }, [feedback]);

  // Handle create submit
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    setFormError(null);
    setCreateSubmitting(true);

    const invalidBlocks = (createForm.assignedBlocks || []).filter(
      (bId) => !availableBlocks.some((b) => b.id === bId)
    );
    if (invalidBlocks.length > 0) {
      setFormError(`The selected sector (${invalidBlocks.join(', ')}) does not exist in the database.`);
      setCreateSubmitting(false);
      return;
    }

    const res = await runLane1({
      screen: 'sub-admins',
      isSave: true,
      fn: async () => createSubAdmin(session, createForm),
    });
    setCreateSubmitting(false);

    if (!res.ok) {
      if (res.error === 'USERNAME_TAKEN') {
        setFormError('This username is already taken. Please choose another.');
      } else if (res.error === 'EMAIL_ALREADY_IN_USE') {
        setFormError('This email address is already assigned to an admin.');
      } else {
        setFormError(toSafeErrorMessage(res.message || res.error || 'Failed to create sub-admin.'));
      }
      return;
    }

    const creds = {
      fullName: res.subAdmin?.fullName || createForm.fullName,
      username: res.subAdmin?.username || createForm.username,
      password: createForm.password,
    };

    setIsCreateOpen(false);
    setCreatedCredentials(creds);
    setCreatedCredsCopied(null);
    setFeedback({
      type: 'success',
      message: `Sub-Administrator "${res.subAdmin?.fullName}" added to the team successfully.`,
    });
    setCreateForm({
      fullName: '',
      email: '',
      username: '',
      password: '',
      assignedBlocks: availableBlocks.slice(0, 2).map((b) => b.id),
      permissions: getDefaultCreatePermissions(),
    });
    clearCachePrefix(`/sub-admins:${session.adminId || session.username || 'admin'}`);
    loadData(session, 1, statusFilterRef.current, searchTerm, false);
  };

  // Open Edit Modal
  const handleOpenEdit = (admin: AdminUser) => {
    setEditingAdmin(admin);
    setEditForm({
      fullName: admin.fullName,
      username: admin.username,
      status: admin.status,
      assignedBlocks: [...admin.assignedBlocks],
      permissions: { ...admin.permissions },
      password: '',
    });
    setEditError(null);
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !editingAdmin) return;
    setEditError(null);
    setEditSubmitting(true);

    // Validate that all assigned blocks exist in availableBlocks before saving
    const invalidBlocks = (editForm.assignedBlocks || []).filter(
      (bId) => !availableBlocks.some((b) => b.id === bId)
    );
    if (invalidBlocks.length > 0) {
      setEditError(`The selected sector (${invalidBlocks.join(', ')}) does not exist in the database.`);
      setEditSubmitting(false);
      return;
    }

    // Filter out empty password so we don't accidentally blank it
    const payload: UpdateSubAdminInput = {
      fullName: editForm.fullName,
      username: editForm.username?.trim().toLowerCase().replace(/^@/, ''),
      status: editForm.status,
      assignedBlocks: editForm.assignedBlocks,
      permissions: editForm.permissions,
    };
    if (editForm.password && editForm.password.trim().length > 0) {
      payload.password = editForm.password.trim();
    }

    const res = await runLane1({
      screen: 'sub-admins',
      isSave: true,
      fn: async () => updateSubAdmin(session, editingAdmin.id, payload),
    });
    setEditSubmitting(false);

    if (!res.ok) {
      if (res.error === 'USERNAME_TAKEN') {
        setEditError('This username is already taken by another administrator.');
      } else {
        setEditError(toSafeErrorMessage(res.message || res.error || 'Failed to update sub-admin.'));
      }
      return;
    }

    setEditingAdmin(null);
    setFeedback({
      type: 'success',
      message: `Team member "${res.subAdmin?.fullName || editingAdmin.fullName}" updated successfully.`,
    });
    clearCachePrefix(`/sub-admins:${session.adminId || session.username || 'admin'}`);
    loadData(session, page, statusFilterRef.current, searchTerm, false);
  };

  // Confirm Status Toggle (Suspend / Activate)
  const handleConfirmStatusToggle = async () => {
    if (!session || !confirmAdmin) return;
    setConfirmProcessing(true);
    const newStatus = confirmAdmin.status === 'active' ? 'suspended' : 'active';
    const res = await runLane1({
      screen: 'sub-admins',
      isSave: true,
      fn: async () => updateSubAdmin(session, confirmAdmin.id, { status: newStatus }),
    });
    setConfirmProcessing(false);
    setConfirmAdmin(null);

    if (res.ok) {
      setFeedback({
        type: 'success',
        message: `Account for "${confirmAdmin.fullName}" has been ${newStatus === 'active' ? 'activated' : 'suspended'}.`,
      });
      clearCachePrefix(`/sub-admins:${session.adminId || session.username || 'admin'}`);
      loadData(session, page, statusFilterRef.current, searchTerm, false);
    } else {
      setFeedback({
        type: 'error',
        message: toSafeErrorMessage(res.error || res.message || 'Failed to update status.'),
      });
    }
  };

  // Permanently Delete Sub-Admin
  const handleDeleteSubAdmin = async () => {
    if (!session || !deleteAdmin) return;
    setDeleteProcessing(true);
    const target = deleteAdmin;
    const res = await runLane1({
      screen: 'sub-admins',
      isSave: true,
      fn: async () => deleteSubAdmin(session, target.id),
    });
    setDeleteProcessing(false);
    setDeleteAdmin(null);

    if (res.ok) {
      setFeedback({
        type: 'success',
        message: res.message || `Sub-administrator "${target.fullName}" (@${target.username}) has been permanently deleted.`,
      });
      clearCachePrefix(`/sub-admins:${session.adminId || session.username || 'admin'}`);
      loadData(session, page, statusFilterRef.current, searchTerm, false);
    } else {
      setFeedback({
        type: 'error',
        message: toSafeErrorMessage(res.error || res.message || 'Failed to delete sub-administrator.'),
      });
    }
  };

  // Quick Select All / Deselect All for Create Form Permissions
  const handleToggleAllCreatePerms = (grantAll: boolean) => {
    const updated: Record<string, boolean> = {};
    for (const item of MODULE_REGISTRY) {
      updated[item.key] = grantAll;
    }
    setCreateForm((prev) => ({ ...prev, permissions: updated }));
  };

  // Quick Select All / Deselect All for Edit Form Permissions
  const handleToggleAllEditPerms = (grantAll: boolean) => {
    const updated: Record<string, boolean> = {};
    for (const item of MODULE_REGISTRY) {
      updated[item.key] = grantAll;
    }
    setEditForm((prev) => ({ ...prev, permissions: updated }));
  };

  // Handle Reset Sub-Admin Password (Super Admin exclusive)
  const handleResetPassword = async (admin: AdminUser) => {
    if (!session || session.role !== 'super_admin') return;
    if (admin.role === 'super_admin' || admin.id === session.adminId) return;

    if (!confirm(`Are you sure you want to reset the password for sub-admin ${admin.fullName} (${admin.username})? Their current password will immediately stop working.`)) {
      return;
    }

    setResetSubmitting(admin.id);
    const res = await runLane1({
      screen: 'sub-admins',
      isSave: true,
      fn: async () => resetAdminPassword(session, admin.id),
    });
    setResetSubmitting(null);

    if (!res.ok) {
      setFeedback({ type: 'error', message: toSafeErrorMessage(res.message || res.error || 'Failed to reset sub-admin password.') });
    } else if (!res.newPassword) {
      setFeedback({ type: 'error', message: 'Password reset returned empty credentials.' });
    } else {
      setCopied(false);
      setResetModalData({
        admin,
        newPassword: res.newPassword,
      });
      setFeedback({
        type: 'success',
        message: `Password reset successfully for ${admin.fullName}.`,
      });
    }
  };

  // Filtered members list is now handled by the server
  const filteredAdmins = subAdmins;

  // Guard: Super Admin only
  if (!session) {
    return null;
  }

  if (session.role !== 'super_admin') {
    return (
      <div className="max-w-2xl mx-auto mt-12 bg-white rounded-3xl border border-rose-200 p-8 shadow-sm text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600 shadow-inner">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2 font-serif">
          Access Restricted: Super Administrators Only
        </h2>
        <p className="text-sm text-slate-600 mb-6 leading-relaxed max-w-md mx-auto">
          The Teams & Access Governance console is strictly reserved for Super Administrators. Sub-administrator roles do not possess permission to manage staff credentials.
        </p>
        <button
          onClick={() => router.push('/admin/dashboard')}
          className="px-6 py-2.5 bg-[#10251E] hover:bg-[#18392C] text-white text-xs font-bold rounded-xl transition shadow-md cursor-pointer"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Action Toast Feedback Popup */}
      <AdminActionToast feedback={feedback} onClose={() => setFeedback(null)} />

      {/* Teams Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2.5 text-xs font-semibold text-rose-700 uppercase tracking-wider mb-1">
            <Users className="w-4 h-4" />
            <span>Governance & Access Delegation</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 font-serif tracking-tight">
            Administrative Teams
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Manage society sub-administrators, delegate block sector scopes, and configure fine-grained module access rights.
          </p>
        </div>

        <button
          onClick={() => {
            setIsCreateOpen(true);
            setFormError(null);
          }}
          className="flex items-center justify-center gap-2.5 px-5 py-3 bg-[#10251E] hover:bg-[#18392C] text-white rounded-2xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg hover:shadow-xl cursor-pointer shrink-0"
        >
          <UserPlus className="w-4 h-4 text-[#D4AF37]" />
          <span>Add Team Member</span>
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name, username, or email..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-500 font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => handleStatusFilterChange(e.target.value as any)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none cursor-pointer"
          >
            <option value="all">All Members</option>
            <option value="active">Active Only</option>
            <option value="suspended">Suspended Only</option>
          </select>
        </div>
      </div>

      {/* Error State */}
      {!loading && fetchError && (
        <div className="bg-rose-50 border border-rose-200 rounded-3xl p-8 text-center">
          <AlertTriangle className="w-10 h-10 text-rose-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-rose-900">Failed to Load Team Roster</h3>
          <p className="text-xs text-rose-700 mt-1 max-w-md mx-auto">{fetchError}</p>
          <button
            onClick={() => session && loadData(session)}
            className="mt-4 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Retry Loading
          </button>
        </div>
      )}

      {/* Loading Skeleton Cards */}
      {!fetchError && loading && filteredAdmins.length === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 space-y-4 animate-pulse"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-200" />
                  <div className="space-y-1.5">
                    <div className="h-4 bg-slate-200 rounded w-28" />
                    <div className="h-3 bg-slate-100 rounded w-16" />
                  </div>
                </div>
                <div className="w-14 h-5 rounded-full bg-slate-100" />
              </div>
              <div className="h-10 bg-slate-50 rounded-xl" />
              <div className="h-4 bg-slate-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !fetchError && filteredAdmins.length === 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-400 mx-auto mb-4">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 font-serif">
            {searchTerm || statusFilter !== 'all'
              ? 'No matching team members found'
              : 'No sub-administrators yet'}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-6">
            {searchTerm || statusFilter !== 'all'
              ? 'Try adjusting your search criteria or resetting the status filter.'
              : 'Delegate operational responsibilities by creating dedicated sub-administrator accounts for your team.'}
          </p>
          {searchTerm || statusFilter !== 'all' ? (
            <button
              onClick={() => {
                setSearchInput('');
                setStatusFilter('all');
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Clear Filters
            </button>
          ) : (
            <button
              onClick={() => {
                setIsCreateOpen(true);
                setFormError(null);
              }}
              className="px-5 py-2.5 bg-[#10251E] hover:bg-[#18392C] text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer"
            >
              Add First Sub-Administrator
            </button>
          )}
        </div>
      )}

      {/* Responsive Teams Grid */}
      {!fetchError && filteredAdmins.length > 0 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredAdmins.map((admin) => {
              const grantedCount = MODULE_REGISTRY.filter(
                (m) => Boolean(admin.permissions?.[m.key as keyof typeof admin.permissions])
              ).length;
              const isSelf = session?.username === admin.username;
              const { displayName, roleTitle } = parseAdminTitle(admin.fullName);
              const formattedSince = formatSinceDate(admin.createdDate);

              return (
                <div
                  key={admin.id}
                  onClick={() => setSelectedAdminDetail(admin)}
                  className="bg-white rounded-2xl border border-slate-200/90 hover:border-slate-300/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group cursor-pointer"
                >
                  {/* Card Main Body */}
                  <div className="p-5 space-y-3.5">
                    {/* Header Row: Avatar + Name / Role + Status */}
                    <div className="flex items-start gap-3">
                      {(() => {
                        const rawAvatar =
                          admin.avatarUrl ||
                          (admin.permissions as any)?.avatarUrl ||
                          null;
                        const avatarSrc =
                          rawAvatar && typeof rawAvatar === 'string' && rawAvatar.startsWith('https://')
                            ? rawAvatar
                            : null;

                        if (avatarSrc) {
                          return (
                            <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-200/90 shadow-xs shrink-0 ring-1 ring-slate-900/5 bg-white flex items-center justify-center">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={avatarSrc}
                                alt={displayName}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          );
                        }

                        return (
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#10251E] to-[#18392C] text-[#D4AF37] font-serif font-bold text-base flex items-center justify-center shadow-xs shrink-0 ring-1 ring-slate-900/5">
                            {displayName ? displayName.charAt(0).toUpperCase() : 'A'}
                          </div>
                        );
                      })()}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-tight truncate" title={displayName}>
                              {displayName}
                            </h3>
                            <div className="flex items-center flex-wrap gap-1.5 mt-0.5">
                              <span className="font-mono text-[11px] text-slate-500 font-semibold">
                                @{admin.username}
                              </span>
                              {isSelf && (
                                <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[9px] font-bold px-1.5 py-0.2 rounded-md">
                                  You
                                </span>
                              )}
                              {roleTitle && (
                                <span className="text-[10px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.2 rounded-md inline-flex items-center gap-1 truncate max-w-[150px]">
                                  <Briefcase className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                                  <span className="truncate">{roleTitle}</span>
                                </span>
                              )}
                            </div>
                          </div>

                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border shrink-0 flex items-center gap-1 ${
                              admin.status === 'active'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-rose-50 text-rose-800 border-rose-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                admin.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'
                              }`}
                            />
                            {admin.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Email & Role Info Bar */}
                    <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50/70 rounded-xl p-2.5 border border-slate-100/90">
                      <div className="flex items-center gap-2 truncate">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate text-slate-700 font-medium">{admin.email}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60">
                        <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                          <Shield className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                          <span>Sub-Administrator</span>
                        </div>
                        {formattedSince && (
                          <span className="text-slate-400 font-medium text-[10px]">
                            Joined {formattedSince}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Sectors & Permission Bar */}
                    <div className="space-y-2 text-xs pt-0.5">
                      {/* Assigned Sectors */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0">
                          <Layers className="w-3 h-3 text-slate-400" />
                          <span>Sectors:</span>
                        </div>
                        <div className="flex flex-wrap gap-1 justify-end max-w-[70%]">
                          {!admin.assignedBlocks || admin.assignedBlocks.length === 0 ? (
                            <span className="text-slate-400 text-[11px] italic">All Sectors</span>
                          ) : (
                            admin.assignedBlocks.slice(0, 3).map((b) => (
                              <span
                                key={b}
                                className={`text-[9px] px-1.5 py-0.5 rounded-md font-mono font-bold border uppercase tracking-wider ${
                                  BLOCK_BADGES[b] || 'bg-slate-100 text-slate-800 border-slate-300'
                                }`}
                              >
                                {b}
                              </span>
                            ))
                          )}
                          {admin.assignedBlocks && admin.assignedBlocks.length > 3 && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 font-mono font-bold">
                              +{admin.assignedBlocks.length - 3}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Permissions Summary Bar */}
                      <div className="space-y-1 pt-1.5 border-t border-slate-100">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-500 uppercase tracking-wider">
                            Access Rights:
                          </span>
                          <span className="font-mono text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.2 rounded-md border border-emerald-200/80">
                            {grantedCount} / {MODULE_REGISTRY.length} Modules
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
                          <div
                            className="bg-emerald-600 h-1 rounded-full transition-all"
                            style={{ width: `${Math.round((grantedCount / MODULE_REGISTRY.length) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Action Buttons */}
                  <div 
                    onClick={(e) => e.stopPropagation()}
                    className="p-3 bg-slate-50/80 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2"
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEdit(admin);
                      }}
                      className="flex-1 min-w-[90px] flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl transition shadow-2xs hover:shadow-xs cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3 text-slate-500" />
                      <span>Edit Access</span>
                    </button>

                    {session?.role === 'super_admin' && !isSelf && admin.role !== 'super_admin' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleResetPassword(admin);
                        }}
                        disabled={resetSubmitting === admin.id}
                        className="flex items-center justify-center gap-1 px-2.5 py-1.5 bg-white hover:bg-amber-50 text-amber-800 hover:text-amber-900 border border-slate-200 hover:border-amber-300 text-xs font-bold rounded-xl transition shadow-2xs hover:shadow-xs cursor-pointer disabled:opacity-50"
                        title={`Reset password for ${admin.username}`}
                      >
                        <KeyRound className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>{resetSubmitting === admin.id ? 'Resetting...' : 'Reset Password'}</span>
                      </button>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmAdmin(admin);
                      }}
                      disabled={isSelf}
                      className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition cursor-pointer ${
                        isSelf
                          ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400 border-slate-200'
                          : admin.status === 'active'
                          ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                      }`}
                      title={isSelf ? 'Cannot suspend your own active account' : undefined}
                    >
                      {admin.status === 'active' ? 'Suspend' : 'Activate'}
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteAdmin(admin);
                      }}
                      disabled={isSelf}
                      className={`p-1.5 text-xs font-bold rounded-xl border transition cursor-pointer ${
                        isSelf
                          ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400 border-slate-200'
                          : 'bg-white hover:bg-rose-50 text-rose-600 border-slate-200 hover:border-rose-200 shadow-2xs'
                      }`}
                      title={isSelf ? 'Cannot delete your own active account' : 'Permanently Delete Sub-Admin'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Clean Pagination Bar (Rendered only when multi-page records exist) */}
          {totalRecords > PAGE_SIZE && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white border border-slate-200/90 rounded-2xl px-5 py-3.5 shadow-xs">
              <div className="text-xs text-slate-500 font-medium">
                Showing <span className="text-slate-900 font-bold">{Math.min((page - 1) * PAGE_SIZE + 1, totalRecords)}</span>–
                <span className="text-slate-900 font-bold">{Math.min(page * PAGE_SIZE, totalRecords)}</span> of{' '}
                <span className="text-slate-900 font-bold">{totalRecords}</span> members
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>
                <span className="text-xs font-bold text-slate-600 px-2 font-mono">
                  {page} / {Math.ceil(totalRecords / PAGE_SIZE)}
                </span>
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= Math.ceil(totalRecords / PAGE_SIZE)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition flex items-center gap-1 cursor-pointer"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CREATE SUB-ADMIN MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-2xl shadow-2xl overflow-hidden my-auto max-h-[100dvh] flex flex-col">
            <div className="p-6 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-700 shadow-xs">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-slate-900 leading-tight">
                    Add Sub-Administrator
                  </h3>
                  <p className="text-xs text-slate-500">
                    Create new staff credentials with granular sector and module access.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200/50 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
              {formError && (
                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-900 rounded-2xl text-xs flex items-center gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Basic Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      value={createForm.fullName}
                      onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                      placeholder="e.g. Farhan Zaidi"
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 bg-slate-50/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Username *
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        required
                        value={createForm.username}
                        onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                        placeholder="e.g. farhan_marketing"
                        className="w-full pl-10 pr-3.5 py-2.5 text-xs font-mono rounded-xl border border-slate-300 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 bg-slate-50/50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Initial Password *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="password"
                        required
                        value={createForm.password}
                        onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                        placeholder="Secure password"
                        className="w-full pl-10 pr-3.5 py-2.5 text-xs font-mono rounded-xl border border-slate-300 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 bg-slate-50/50"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      required
                      value={createForm.email}
                      onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                      placeholder="e.g. farhan@primeview.org"
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 bg-slate-50/50"
                    />
                  </div>
                </div>
              </div>

              {/* Block Scope Checkboxes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Assigned Block Sectors
                </label>
                <p className="text-[11px] text-slate-500 mb-2.5">
                  Select which blocks this administrator is authorized to view and manage:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {availableBlocks.map((b) => {
                    const checked = createForm.assignedBlocks.includes(b.id);
                    return (
                      <button
                        type="button"
                        key={b.id}
                        onClick={() => {
                          const updated = checked
                            ? createForm.assignedBlocks.filter((id) => id !== b.id)
                            : [...createForm.assignedBlocks, b.id];
                          setCreateForm({ ...createForm, assignedBlocks: updated });
                        }}
                        className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition flex items-center justify-between cursor-pointer ${
                          checked
                            ? 'bg-emerald-50 text-emerald-950 border-emerald-300 shadow-xs'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span className="truncate">{b.name}</span>
                        {checked ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 ml-1" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0 ml-1" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Combined and Standalone Permission Checkboxes (Item 1) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700">
                      Module Access Permissions
                    </label>
                    <p className="text-[11px] text-slate-500">
                      3 combined groups and 3 standalone permissions:
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleAllCreatePerms(true)}
                      className="text-[11px] text-emerald-700 font-bold hover:underline cursor-pointer"
                    >
                      Grant All
                    </button>
                    <span className="text-slate-300">&bull;</span>
                    <button
                      type="button"
                      onClick={() => handleToggleAllCreatePerms(false)}
                      className="text-[11px] text-rose-700 font-bold hover:underline cursor-pointer"
                    >
                      Revoke All
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  {/* 3 Combined Checkbox Groups */}
                  {COMBINED_PERMISSION_GROUPS.map((grp) => {
                    const isGranted = grp.keys.every(
                      (k) => Boolean((createForm.permissions as Record<string, boolean | undefined>)[k])
                    );
                    return (
                      <button
                        type="button"
                        key={grp.id}
                        onClick={() => {
                          const nextVal = !isGranted;
                          const nextPerms = { ...createForm.permissions };
                          grp.keys.forEach((k) => {
                            nextPerms[k] = nextVal;
                          });
                          setCreateForm({
                            ...createForm,
                            permissions: nextPerms,
                          });
                        }}
                        className={`p-3 rounded-xl border text-left transition flex items-start gap-2.5 cursor-pointer ${
                          isGranted
                            ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">
                          {isGranted ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold leading-tight">
                            {grp.label}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                            {grp.description}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400 mt-1">
                            Keys: {grp.keys.join(', ')}
                          </div>
                        </div>
                      </button>
                    );
                  })}

                  {/* 3 Standalone Checkboxes */}
                  {STANDALONE_PERMISSIONS.map((mod) => {
                    const isGranted = Boolean(
                      (createForm.permissions as Record<string, boolean | undefined>)[mod.key]
                    );
                    return (
                      <button
                        type="button"
                        key={mod.key}
                        onClick={() => {
                          setCreateForm({
                            ...createForm,
                            permissions: {
                              ...createForm.permissions,
                              [mod.key]: !isGranted,
                            },
                          });
                        }}
                        className={`p-3 rounded-xl border text-left transition flex items-start gap-2.5 cursor-pointer ${
                          isGranted
                            ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">
                          {isGranted ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold leading-tight">
                            {mod.label}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                            {mod.description}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400 mt-1">
                            Key: {mod.key}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  className="px-6 py-2.5 bg-[#10251E] hover:bg-[#18392C] disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-md cursor-pointer flex items-center gap-2"
                >
                  {createSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Creating Member...</span>
                    </>
                  ) : (
                    <span>Create Sub-Administrator</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT SUB-ADMIN MODAL */}
      {editingAdmin && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-2xl shadow-2xl overflow-hidden my-auto max-h-[100dvh] flex flex-col">
            <div className="p-6 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                {(() => {
                  const editAvatar =
                    editingAdmin.avatarUrl ||
                    (editingAdmin.permissions as any)?.avatarUrl ||
                    null;
                  if (editAvatar) {
                    return (
                      <div className="w-10 h-10 rounded-2xl overflow-hidden border border-slate-200/90 shadow-xs shrink-0 ring-1 ring-slate-900/5 bg-white">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={editAvatar} alt={editingAdmin.fullName} className="w-full h-full object-cover" />
                      </div>
                    );
                  }
                  return (
                    <div className="w-10 h-10 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-700 shadow-xs">
                      <Edit2 className="w-5 h-5" />
                    </div>
                  );
                })()}
                <div>
                  <h3 className="font-serif font-bold text-lg text-slate-900 leading-tight">
                    Edit Administrator Permissions
                  </h3>
                  <p className="text-xs text-slate-500">
                    Modifying settings for @{editingAdmin.username}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingAdmin(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200/50 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
              {editError && (
                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-900 rounded-2xl text-xs flex items-center gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              {/* Profile Details */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Username *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs font-bold">@</span>
                      <input
                        type="text"
                        required
                        value={editForm.username || ''}
                        onChange={(e) => setEditForm({ ...editForm, username: e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, '') })}
                        className="w-full pl-7 pr-3 py-2.5 text-xs font-mono font-semibold rounded-xl border border-slate-300 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 bg-slate-50/50"
                        placeholder="username"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Account Status
                    </label>
                    <select
                      value={editForm.status || 'active'}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 bg-slate-50/50 cursor-pointer"
                    >
                      <option value="active">Active (Access Allowed)</option>
                      <option value="suspended">Suspended (Access Revoked)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.fullName || ''}
                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 bg-slate-50/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Reset Password (Optional)
                  </label>
                  <input
                    type="password"
                    value={editForm.password || ''}
                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                    placeholder="Leave blank to preserve current password"
                    className="w-full px-3.5 py-2.5 text-xs font-mono rounded-xl border border-slate-300 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 bg-slate-50/50"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Password hash is never exposed to client browsers.
                  </span>
                </div>
              </div>

              {/* Assigned Sectors */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Assigned Block Sectors
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {availableBlocks.map((b) => {
                    const checked = editForm.assignedBlocks?.includes(b.id) || false;
                    return (
                      <button
                        type="button"
                        key={b.id}
                        onClick={() => {
                          const current = editForm.assignedBlocks || [];
                          const updated = checked
                            ? current.filter((id) => id !== b.id)
                            : [...current, b.id];
                          setEditForm({ ...editForm, assignedBlocks: updated });
                        }}
                        className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition flex items-center justify-between cursor-pointer ${
                          checked
                            ? 'bg-emerald-50 text-emerald-950 border-emerald-300 shadow-xs'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span className="truncate">{b.name}</span>
                        {checked ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 ml-1" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0 ml-1" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Combined and Standalone Permission Checkboxes (Item 1) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700">
                      Module Access Permissions
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Combined box is checked only when every key in its group is true:
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleAllEditPerms(true)}
                      className="text-[11px] text-emerald-700 font-bold hover:underline cursor-pointer"
                    >
                      Grant All
                    </button>
                    <span className="text-slate-300">&bull;</span>
                    <button
                      type="button"
                      onClick={() => handleToggleAllEditPerms(false)}
                      className="text-[11px] text-rose-700 font-bold hover:underline cursor-pointer"
                    >
                      Revoke All
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  {/* 3 Combined Checkbox Groups */}
                  {COMBINED_PERMISSION_GROUPS.map((grp) => {
                    const isGranted = grp.keys.every(
                      (k) => Boolean((editForm.permissions as Record<string, boolean | undefined>)?.[k])
                    );
                    return (
                      <button
                        type="button"
                        key={grp.id}
                        onClick={() => {
                          const nextVal = !isGranted;
                          const nextPerms = { ...editForm.permissions };
                          grp.keys.forEach((k) => {
                            nextPerms[k] = nextVal;
                          });
                          setEditForm({
                            ...editForm,
                            permissions: nextPerms,
                          });
                        }}
                        className={`p-3 rounded-xl border text-left transition flex items-start gap-2.5 cursor-pointer ${
                          isGranted
                            ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">
                          {isGranted ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold leading-tight">
                            {grp.label}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                            {grp.description}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400 mt-1">
                            Keys: {grp.keys.join(', ')}
                          </div>
                        </div>
                      </button>
                    );
                  })}

                  {/* 3 Standalone Checkboxes */}
                  {STANDALONE_PERMISSIONS.map((mod) => {
                    const isGranted = Boolean(
                      (editForm.permissions as Record<string, boolean | undefined>)?.[mod.key]
                    );
                    return (
                      <button
                        type="button"
                        key={mod.key}
                        onClick={() => {
                          setEditForm({
                            ...editForm,
                            permissions: {
                              ...editForm.permissions,
                              [mod.key]: !isGranted,
                            },
                          });
                        }}
                        className={`p-3 rounded-xl border text-left transition flex items-start gap-2.5 cursor-pointer ${
                          isGranted
                            ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">
                          {isGranted ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold leading-tight">
                            {mod.label}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                            {mod.description}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400 mt-1">
                            Key: {mod.key}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingAdmin(null)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="px-6 py-2.5 bg-[#10251E] hover:bg-[#18392C] disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-md cursor-pointer flex items-center gap-2"
                >
                  {editSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Updating Member...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM STATUS TOGGLE DIALOG */}
      {confirmAdmin && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-md shadow-2xl p-6 sm:p-7 space-y-5 max-h-[100dvh] overflow-y-auto">
            <div className="flex items-start gap-4">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  confirmAdmin.status === 'active'
                    ? 'bg-rose-100 text-rose-700'
                    : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                {confirmAdmin.status === 'active' ? (
                  <ShieldAlert className="w-6 h-6" />
                ) : (
                  <ShieldCheck className="w-6 h-6" />
                )}
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg text-slate-900 leading-tight">
                  {confirmAdmin.status === 'active'
                    ? 'Suspend Team Member?'
                    : 'Re-activate Team Member?'}
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {confirmAdmin.status === 'active'
                    ? `Suspending "${confirmAdmin.fullName}" (@${confirmAdmin.username}) will revoke their administrative session and block any further logins to the portal.`
                    : `Re-activating "${confirmAdmin.fullName}" (@${confirmAdmin.username}) will restore their ability to log in with their assigned permissions.`}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmAdmin(null)}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmStatusToggle}
                disabled={confirmProcessing}
                className={`px-5 py-2.5 text-xs font-bold text-white rounded-xl transition shadow-md cursor-pointer ${
                  confirmAdmin.status === 'active'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {confirmProcessing
                  ? 'Processing...'
                  : confirmAdmin.status === 'active'
                  ? 'Confirm Suspension'
                  : 'Confirm Activation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE SUB-ADMIN DIALOG */}
      {deleteAdmin && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-rose-200 w-full max-w-md shadow-2xl p-6 sm:p-7 space-y-5 animate-in zoom-in-95 duration-200 max-h-[100dvh] overflow-y-auto">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 bg-rose-100 text-rose-700 border border-rose-200 shadow-inner">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-serif font-bold text-lg text-slate-900 leading-tight">
                  Permanently Delete Sub-Admin?
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Are you sure you want to permanently delete <strong className="text-slate-800">{deleteAdmin.fullName}</strong> (<span className="text-slate-500 font-mono">@{deleteAdmin.username}</span>)?
                </p>
                <div className="mt-3 p-3 bg-rose-50/70 border border-rose-100 rounded-xl text-[11px] text-rose-800 space-y-1">
                  <p className="font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    Warning: Irreversible Action
                  </p>
                  <p className="text-rose-700 leading-normal">
                    This account, sector assignments, and module access permissions will be permanently expunged from the database.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteAdmin(null)}
                disabled={deleteProcessing}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteSubAdmin}
                disabled={deleteProcessing}
                className="px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-98 rounded-xl transition shadow-md shadow-rose-600/20 cursor-pointer flex items-center gap-2"
              >
                {deleteProcessing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Account</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: ADMIN DETAILS & PERMISSIONS DOSSIER (Item 4) ── */}
      {selectedAdminDetail && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto cursor-pointer"
          onClick={() => setSelectedAdminDetail(null)}
        >
          <div 
            className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden text-xs animate-in fade-in zoom-in-95 duration-150 my-auto cursor-default flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header: Full-bleed top fill */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-800">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm font-serif">
                    Administrator Details
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Staff identity, scope & granted module permissions
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedAdminDetail(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Modal Content */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1 min-h-0">

            {/* Admin Overview Details */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-bold text-slate-900">
                    {selectedAdminDetail.fullName}
                  </div>
                  <div className="text-xs font-mono text-slate-500 font-semibold">
                    @{selectedAdminDetail.username}
                  </div>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1 ${
                    selectedAdminDetail.status === 'active'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      selectedAdminDetail.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}
                  />
                  {selectedAdminDetail.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 text-[11px]">
                <div>
                  <span className="text-slate-400 block font-medium">Email:</span>
                  <span className="text-slate-700 font-semibold truncate block">
                    {selectedAdminDetail.email || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Role:</span>
                  <span className="text-slate-700 font-semibold capitalize block">
                    {selectedAdminDetail.role.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>

            {/* Assigned Blocks */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Assigned Society Blocks
              </label>
              <div className="flex flex-wrap gap-1.5">
                {!selectedAdminDetail.assignedBlocks || selectedAdminDetail.assignedBlocks.length === 0 ? (
                  <span className="text-slate-400 text-xs italic">All society blocks (unrestricted)</span>
                ) : (
                  selectedAdminDetail.assignedBlocks.map((b) => (
                    <span
                      key={b}
                      className={`text-xs px-2.5 py-1 rounded-lg font-mono font-bold border uppercase tracking-wider ${
                        BLOCK_BADGES[b] || 'bg-slate-100 text-slate-800 border-slate-300'
                      }`}
                    >
                      {availableBlocks.find((blk) => blk.id === b)?.name || DEFAULT_BLOCKS.find((blk) => blk.id === b)?.name || b}
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Permissions List */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Granted Module Permissions
                </label>
                <span className="text-[11px] font-mono text-emerald-800 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                  {MODULE_REGISTRY.filter((m) => Boolean(selectedAdminDetail.permissions?.[m.key as keyof typeof selectedAdminDetail.permissions])).length} / {MODULE_REGISTRY.length} Active
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-1">
                {MODULE_REGISTRY.map((mod) => {
                  const isGranted = Boolean(
                    selectedAdminDetail.permissions?.[mod.key as keyof typeof selectedAdminDetail.permissions]
                  );
                  return (
                    <div
                      key={mod.key}
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 ${
                        isGranted
                          ? 'bg-emerald-50/50 border-emerald-200 text-slate-900'
                          : 'bg-slate-50 border-slate-200 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {isGranted ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <X className="w-4 h-4 text-slate-300 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <div className={`text-xs font-bold truncate ${isGranted ? 'text-slate-900' : 'text-slate-400'}`}>
                            {mod.label}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400 truncate">
                            {mod.key}
                          </div>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider shrink-0 ${
                          isGranted
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : 'bg-slate-100 text-slate-400 border-slate-200'
                        }`}
                      >
                        {isGranted ? 'Granted' : 'Revoked'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end shrink-0">
              <button
                type="button"
                onClick={() => setSelectedAdminDetail(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer shadow-xs"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: CREATED SUB-ADMIN CREDENTIALS (Item 5) ── */}
      {createdCredentials && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden text-xs animate-in fade-in zoom-in-95 duration-150 flex flex-col">
            <div className="px-6 py-4 bg-emerald-50/90 border-b border-emerald-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm font-serif">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Sub-Administrator Created</span>
              </div>
              <button
                onClick={() => setCreatedCredentials(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-emerald-100/60 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              <p className="text-slate-600 leading-relaxed">
              New sub-administrator account created for{' '}
              <strong className="text-slate-900">{createdCredentials.fullName}</strong>. Provide these credentials to the officer:
            </p>

            <div className="space-y-2.5">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">Username</span>
                  <span className="font-mono font-bold text-slate-900 text-sm select-all">
                    {createdCredentials.username}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await navigator.clipboard.writeText(createdCredentials.username);
                    setCreatedCredsCopied('username');
                    setTimeout(() => setCreatedCredsCopied(null), 2000);
                  }}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-300 hover:bg-white text-slate-700 font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                >
                  {createdCredsCopied === 'username' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">Password</span>
                  <span className="font-mono font-bold text-emerald-700 text-sm select-all">
                    {createdCredentials.password}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await navigator.clipboard.writeText(createdCredentials.password);
                    setCreatedCredsCopied('password');
                    setTimeout(() => setCreatedCredsCopied(null), 2000);
                  }}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-300 hover:bg-white text-slate-700 font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                >
                  {createdCredsCopied === 'password' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={async () => {
                  const text = `Username: ${createdCredentials.username}\nPassword: ${createdCredentials.password}`;
                  await navigator.clipboard.writeText(text);
                  setCreatedCredsCopied('all');
                  setTimeout(() => setCreatedCredsCopied(null), 2000);
                }}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                {createdCredsCopied === 'all' ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Copied All Credentials</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-500" />
                    <span>Copy Both</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setCreatedCredentials(null)}
                className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition cursor-pointer"
              >
                Done
              </button>
            </div>

            <p className="text-[11px] text-amber-900 bg-amber-50 border border-amber-200 p-2.5 rounded-xl leading-relaxed">
              This password is shown once. Please copy and store it securely. It will not be displayed again.
            </p>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: RESET SUB-ADMIN CREDENTIALS ── */}
      {resetModalData && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden text-xs flex flex-col">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm font-serif">
                <KeyRound className="w-4 h-4 text-emerald-600" />
                <span>Sub-Administrator Credentials</span>
              </div>
              <button
                onClick={() => setResetModalData(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/60 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              <p className="text-slate-600">
              Administrative credentials generated for Sub-Administrator{' '}
              <strong className="text-slate-900">{resetModalData.admin.fullName}</strong>:
            </p>

            <div className="space-y-2">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <span className="text-slate-500 font-medium">Username:</span>
                <span className="font-mono font-bold text-slate-900 select-all">
                  {resetModalData.admin.username}
                </span>
              </div>

              <div>
                <div className="text-[11px] text-slate-500 font-medium mb-1">New Password:</div>
                <div className="p-3 rounded-xl bg-slate-900 text-emerald-400 font-mono text-center text-sm font-bold tracking-wider select-all break-all">
                  {resetModalData.newPassword}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={async () => {
                  const text = `Username: ${resetModalData.admin.username}\nPassword: ${resetModalData.newPassword}`;
                  await navigator.clipboard.writeText(text);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="flex-1 py-2 rounded-xl border border-slate-300 font-semibold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-500" />
                    <span>Copy Credentials</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setResetModalData(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>

            <p className="text-[11px] text-slate-500 bg-amber-50 border border-amber-200 p-2.5 rounded-xl leading-relaxed">
              This new password is shown once. Provide it securely to the sub-administrator. The previous password has been invalidated immediately.
            </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

