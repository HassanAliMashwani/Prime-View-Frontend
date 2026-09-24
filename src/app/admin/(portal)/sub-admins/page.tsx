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
} from 'lucide-react';
import { AdminSession, AdminUser, BlockId } from '@/lib/mock/types';
import { AdminTableSkeleton } from '@/components/ui/skeleton';
import { getActiveAdminSession } from '@/lib/dal/adminAuth';
import { getSubAdmins, createSubAdmin, updateSubAdmin, CreateSubAdminInput, UpdateSubAdminInput } from '@/lib/dal/users';
import { MODULE_REGISTRY, ModuleRegistryItem } from '@/lib/constants/moduleRegistry';

const ALL_BLOCKS: { id: BlockId; name: string }[] = [
  { id: 'abbott', name: 'Abbott Block' },
  { id: 'royal', name: 'Royal Block' },
  { id: 'overseas', name: 'Overseas Block' },
  { id: 'elite', name: 'Elite Block' },
  { id: 'chalet', name: 'Chalet Block' },
  { id: 'commercial', name: 'Commercial Block' },
  { id: 'npf-phase-1', name: 'NPF Phase 1' },
  { id: 'npf-phase-2', name: 'NPF Phase 2' },
];

const BLOCK_BADGES: Record<string, string> = {
  abbott: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  royal: 'bg-amber-50 text-amber-800 border-amber-200',
  overseas: 'bg-sky-50 text-sky-800 border-sky-200',
  elite: 'bg-purple-50 text-purple-800 border-purple-200',
  chalet: 'bg-rose-50 text-rose-800 border-rose-200',
  commercial: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  'npf-phase-1': 'bg-teal-50 text-teal-800 border-teal-200',
  'npf-phase-2': 'bg-cyan-50 text-cyan-800 border-cyan-200',
};

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
  const [session, setSession] = useState<AdminSession | null>(null);
  const [subAdmins, setSubAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  const [confirmAdmin, setConfirmAdmin] = useState<AdminUser | null>(null);
  const [confirmProcessing, setConfirmProcessing] = useState(false);

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

  // Load Sub Admins
  const loadData = useCallback(async (currentSession: AdminSession) => {
    if (currentSession.role !== 'super_admin') {
      setLoading(false);
      return;
    }
    setFetchError(null);
    try {
      const res = await getSubAdmins(currentSession);
      if (res.ok) {
        setSubAdmins(res.subAdmins);
      } else {
        setFetchError(res.message || 'Failed to retrieve team members.');
      }
    } catch {
      setFetchError('Network communication error while loading team members.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const cur = getActiveAdminSession();
    if (!cur) {
      router.push('/admin/login');
      return;
    }
    setSession(cur);
    loadData(cur);

    // Auto-refresh via polling
    const intervalId = setInterval(() => {
      const s = getActiveAdminSession();
      if (s) loadData(s);
    }, 30000);

    return () => clearInterval(intervalId);
  }, [loadData, router]);

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

    const res = await createSubAdmin(session, createForm);
    setCreateSubmitting(false);

    if (!res.ok) {
      if (res.error === 'USERNAME_TAKEN') {
        setFormError('This username is already taken. Please choose another.');
      } else if (res.error === 'EMAIL_ALREADY_IN_USE') {
        setFormError('This email address is already assigned to an admin.');
      } else {
        setFormError(res.error || res.message || 'Failed to create sub-admin.');
      }
      return;
    }

    setIsCreateOpen(false);
    setFeedback({
      type: 'success',
      message: `Sub-Administrator "${res.subAdmin?.fullName}" added to the team successfully.`,
    });
    setCreateForm({
      fullName: '',
      email: '',
      username: '',
      password: '',
      assignedBlocks: ['abbott', 'royal'],
      permissions: getDefaultCreatePermissions(),
    });
    loadData(session);
  };

  // Open Edit Modal
  const handleOpenEdit = (admin: AdminUser) => {
    setEditingAdmin(admin);
    setEditForm({
      fullName: admin.fullName,
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

    // Filter out empty password so we don't accidentally blank it
    const payload: UpdateSubAdminInput = {
      fullName: editForm.fullName,
      status: editForm.status,
      assignedBlocks: editForm.assignedBlocks,
      permissions: editForm.permissions,
    };
    if (editForm.password && editForm.password.trim().length > 0) {
      payload.password = editForm.password.trim();
    }

    const res = await updateSubAdmin(session, editingAdmin.id, payload);
    setEditSubmitting(false);

    if (!res.ok) {
      setEditError(res.error || res.message || 'Failed to update sub-admin.');
      return;
    }

    setEditingAdmin(null);
    setFeedback({
      type: 'success',
      message: `Team member "${res.subAdmin?.fullName}" updated successfully.`,
    });
    loadData(session);
  };

  // Confirm Status Toggle (Suspend / Activate)
  const handleConfirmStatusToggle = async () => {
    if (!session || !confirmAdmin) return;
    setConfirmProcessing(true);
    const newStatus = confirmAdmin.status === 'active' ? 'suspended' : 'active';
    const res = await updateSubAdmin(session, confirmAdmin.id, { status: newStatus });
    setConfirmProcessing(false);
    setConfirmAdmin(null);

    if (res.ok) {
      setFeedback({
        type: 'success',
        message: `Account for "${confirmAdmin.fullName}" has been ${newStatus === 'active' ? 'activated' : 'suspended'}.`,
      });
      loadData(session);
    } else {
      setFeedback({
        type: 'error',
        message: res.error || res.message || 'Failed to update status.',
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

  // Filtered members list
  const filteredAdmins = subAdmins.filter((a) => {
    const matchesSearch =
      a.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' ? true : a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Guard: Super Admin only
  if (session && session.role !== 'super_admin') {
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
      {/* Toast Feedback Banner */}
      {feedback && (
        <div
          className={`flex items-center gap-3 p-4 rounded-2xl border text-sm font-medium transition-all shadow-sm ${
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
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, username, or email..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-500 font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none cursor-pointer"
          >
            <option value="all">All Members ({subAdmins.length})</option>
            <option value="active">Active Only</option>
            <option value="suspended">Suspended Only</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {loading && <AdminTableSkeleton rows={4} columns={5} />}

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
                setSearchTerm('');
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

      {/* Responsive Teams Grid (Desktop: 2/3 cols; Mobile: 1 col) */}
      {!loading && !fetchError && filteredAdmins.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredAdmins.map((admin) => {
            // Count granted module permissions
            const grantedCount = MODULE_REGISTRY.filter(
              (m) => Boolean(admin.permissions?.[m.key as keyof typeof admin.permissions])
            ).length;
            const isSelf = session?.username === admin.username;

            return (
              <div
                key={admin.id}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
              >
                {/* Card Header & Profile */}
                <div className="p-6 pb-4">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#10251E] to-[#18392C] text-[#D4AF37] font-serif font-bold text-lg flex items-center justify-center shadow-md shrink-0">
                        {admin.fullName ? admin.fullName.charAt(0).toUpperCase() : 'A'}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-tight">
                          {admin.fullName}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-[11px] text-slate-500 font-semibold">
                            @{admin.username}
                          </span>
                          {isSelf && (
                            <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[9px] font-bold px-1.5 py-0.2 rounded-md">
                              You
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border shrink-0 ${
                        admin.status === 'active'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-rose-50 text-rose-800 border-rose-200'
                      }`}
                    >
                      {admin.status}
                    </span>
                  </div>

                  {/* Email & Role Info */}
                  <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50/80 rounded-2xl p-3 border border-slate-100">
                    <div className="flex items-center gap-2 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{admin.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-medium text-slate-700">Sub-Administrator</span>
                      {admin.createdDate && (
                        <span className="text-[10px] text-slate-400 ml-auto">
                          Since {admin.createdDate}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Assigned Blocks */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 mb-1.5">
                      <div className="flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-slate-400" />
                        <span>Assigned Sectors:</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-normal">
                        {admin.assignedBlocks?.length || 0} Block{admin.assignedBlocks?.length === 1 ? '' : 's'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 min-h-[26px]">
                      {!admin.assignedBlocks || admin.assignedBlocks.length === 0 ? (
                        <span className="text-slate-400 text-xs italic">
                          No sector constraints assigned.
                        </span>
                      ) : (
                        admin.assignedBlocks.map((b) => (
                          <span
                            key={b}
                            className={`text-[10px] px-2 py-0.5 rounded-lg font-mono font-bold border uppercase tracking-wider ${
                              BLOCK_BADGES[b] || 'bg-slate-100 text-slate-800 border-slate-300'
                            }`}
                          >
                            {b}
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Module Permissions Summary */}
                  <div className="mt-4 pt-3.5 border-t border-slate-100">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 mb-2">
                      <span>Module Access:</span>
                      <span className="font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-[10px]">
                        {grantedCount} / {MODULE_REGISTRY.length} Granted
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {MODULE_REGISTRY.map((mod) => {
                        const isGranted = Boolean(
                          admin.permissions?.[mod.key as keyof typeof admin.permissions]
                        );
                        return (
                          <span
                            key={mod.key}
                            className={`text-[9px] px-1.5 py-0.5 rounded-md font-medium border flex items-center gap-1 ${
                              isGranted
                                ? 'bg-slate-100 text-slate-800 border-slate-200'
                                : 'bg-slate-50/50 text-slate-300 border-slate-100 line-through'
                            }`}
                            title={`${mod.label}: ${isGranted ? 'Enabled' : 'Disabled'}`}
                          >
                            {isGranted ? (
                              <Check className="w-2.5 h-2.5 text-emerald-600" />
                            ) : (
                              <X className="w-2.5 h-2.5 text-slate-300" />
                            )}
                            <span className="truncate max-w-[130px]">{mod.label}</span>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleOpenEdit(admin)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>Edit Permissions</span>
                  </button>

                  <button
                    onClick={() => setConfirmAdmin(admin)}
                    disabled={isSelf}
                    className={`px-3 py-2 text-xs font-bold rounded-xl border transition cursor-pointer ${
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
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE SUB-ADMIN MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-2xl shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
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
                  {ALL_BLOCKS.map((b) => {
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

              {/* 10 MODULE_REGISTRY Permission Checkboxes */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700">
                      Module Access Permissions ({MODULE_REGISTRY.length} Modules)
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Explicit permissions mapped directly from MODULE_REGISTRY:
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {MODULE_REGISTRY.map((mod) => {
                    const isGranted = Boolean((createForm.permissions as Record<string, boolean | undefined>)[mod.key]);
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
                          <div className="text-xs font-bold truncate leading-tight">
                            {mod.label}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                            {mod.key}
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
          <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-2xl shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
            <div className="p-6 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-700 shadow-xs">
                  <Edit2 className="w-5 h-5" />
                </div>
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
                  {ALL_BLOCKS.map((b) => {
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

              {/* 10 MODULE_REGISTRY Permission Checkboxes */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700">
                      Module Access Permissions ({MODULE_REGISTRY.length} Modules)
                    </label>
                    <p className="text-[11px] text-slate-500">
                      D8 semantics preserved: existing false values remain false until explicitly granted.
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {MODULE_REGISTRY.map((mod) => {
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
                          <div className="text-xs font-bold truncate leading-tight">
                            {mod.label}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                            {mod.key}
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
          <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-md shadow-2xl p-6 sm:p-7 space-y-5">
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
    </div>
  );
}
