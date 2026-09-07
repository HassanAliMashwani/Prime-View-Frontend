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
  XCircle,
  AlertTriangle,
  Lock,
  Mail,
  User,
  Check,
  X,
  Layers,
  KeyRound,
  RefreshCw,
} from 'lucide-react';
import { AdminSession, AdminUser, BlockId } from '@/lib/mock/types';
import { getActiveAdminSession } from '@/lib/dal/adminAuth';
import { getSubAdmins, createSubAdmin, updateSubAdmin, CreateSubAdminInput, UpdateSubAdminInput } from '@/lib/dal/users';
import { mockStore } from '@/lib/mock/store';

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

export default function SubAdminsPage() {
  const router = useRouter();
  const [session, setSession] = useState<AdminSession | null>(null);
  const [subAdmins, setSubAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);

  // Form states
  const [createForm, setCreateForm] = useState<CreateSubAdminInput>({
    fullName: '',
    email: '',
    username: '',
    password: '',
    assignedBlocks: ['abbott', 'royal'],
    permissions: {
      can_reserve: true,
      can_book: false,
      can_create_customer: false,
      can_edit_content: false,
    },
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
    const res = await getSubAdmins(currentSession);
    if (res.ok) {
      setSubAdmins(res.subAdmins);
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
    loadData(cur);

    // Cross-tab broadcast listener
    const unsubscribe = mockStore.onBroadcast((event) => {
      if (event.type === 'SUB_ADMIN_CREATED' || event.type === 'SUB_ADMIN_UPDATED') {
        const latestSession = getActiveAdminSession();
        if (latestSession && latestSession.role === 'super_admin') {
          loadData(latestSession);
        }
      }
    });

    return () => unsubscribe();
  }, [router, loadData]);

  // Flash feedback timer
  useEffect(() => {
    if (feedback) {
      const t = setTimeout(() => setFeedback(null), 4000);
      return () => clearTimeout(t);
    }
  }, [feedback]);

  // Handle create
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
        setFormError(res.error || 'Failed to create sub-admin.');
      }
      return;
    }

    setIsCreateOpen(false);
    setFeedback({
      type: 'success',
      message: `Sub-Administrator "${res.subAdmin?.fullName}" created successfully.`,
    });
    setCreateForm({
      fullName: '',
      email: '',
      username: '',
      password: '',
      assignedBlocks: ['abbott', 'royal'],
      permissions: {
        can_reserve: true,
        can_book: false,
        can_create_customer: false,
        can_edit_content: false,
      },
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
    });
    setEditError(null);
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !editingAdmin) return;
    setEditError(null);
    setEditSubmitting(true);

    const res = await updateSubAdmin(session, editingAdmin.id, editForm);
    setEditSubmitting(false);

    if (!res.ok) {
      setEditError(res.error || 'Failed to update sub-admin.');
      return;
    }

    setEditingAdmin(null);
    setFeedback({
      type: 'success',
      message: `Sub-Administrator "${res.subAdmin?.fullName}" updated successfully.`,
    });
    loadData(session);
  };

  // Quick Suspend/Activate Toggle
  const handleToggleStatus = async (admin: AdminUser) => {
    if (!session) return;
    const newStatus = admin.status === 'active' ? 'suspended' : 'active';
    const res = await updateSubAdmin(session, admin.id, { status: newStatus });
    if (res.ok) {
      setFeedback({
        type: 'success',
        message: `Sub-admin "${admin.fullName}" has been ${newStatus}.`,
      });
      loadData(session);
    } else {
      setFeedback({
        type: 'error',
        message: res.error || 'Failed to change sub-admin status.',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16">
        <RefreshCw className="w-6 h-6 animate-spin text-emerald-700" />
        <span className="ml-3 text-sm font-medium text-slate-600">Loading sub-administrators...</span>
      </div>
    );
  }

  // Super Admin Strict Access Check
  if (session?.role !== 'super_admin') {
    return (
      <div className="max-w-2xl mx-auto mt-12 bg-white rounded-2xl border border-rose-200 p-8 shadow-sm text-center">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2 font-serif">Access Denied: Super Admin Only</h2>
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          Delegated Sub-Administrator management is strictly restricted to Super Administrators. Your current role does not possess authorization to view or edit administrative credentials.
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
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Toast feedback banner */}
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

      {/* Header section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 font-serif tracking-tight">
                Delegated Sub-Administrators
              </h1>
              <p className="text-xs text-slate-500">
                Grant staff scoped sector access and restricted administrative permissions.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            setIsCreateOpen(true);
            setFormError(null);
          }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#10251E] hover:bg-[#18392C] text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
        >
          <UserPlus className="w-4 h-4 text-[#D4AF37]" />
          <span>Create New Sub-Admin</span>
        </button>
      </div>

      {/* Sub Admins Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Active Accounts ({subAdmins.length})
          </div>
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Super Admin Gated • Sub-Admin creation permission permanently omitted</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/70 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                <th className="py-3 px-4">Administrator</th>
                <th className="py-3 px-4">Username & Email</th>
                <th className="py-3 px-4">Assigned Sectors</th>
                <th className="py-3 px-4">Permissions</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {subAdmins.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No delegated sub-administrators configured yet.
                  </td>
                </tr>
              ) : (
                subAdmins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-[11px] text-slate-700">
                          {admin.fullName.charAt(0)}
                        </div>
                        <div>
                          <div>{admin.fullName}</div>
                          <div className="text-[10px] text-slate-400 font-normal">
                            Added on {admin.createdDate}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-semibold text-slate-800">{admin.username}</div>
                      <div className="text-slate-500 text-[11px]">{admin.email}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {admin.assignedBlocks.length === 0 ? (
                          <span className="text-slate-400 text-[10px] italic">None</span>
                        ) : (
                          admin.assignedBlocks.map((b) => (
                            <span
                              key={b}
                              className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold border uppercase ${
                                BLOCK_BADGES[b] || 'bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              {b}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5">
                          {admin.permissions.can_reserve ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <X className="w-3.5 h-3.5 text-slate-300" />
                          )}
                          <span className={admin.permissions.can_reserve ? 'text-slate-800' : 'text-slate-400'}>
                            Reserve
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {admin.permissions.can_book ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <X className="w-3.5 h-3.5 text-slate-300" />
                          )}
                          <span className={admin.permissions.can_book ? 'text-slate-800' : 'text-slate-400'}>
                            Book
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {admin.permissions.can_create_customer ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <X className="w-3.5 h-3.5 text-slate-300" />
                          )}
                          <span className={admin.permissions.can_create_customer ? 'text-slate-800' : 'text-slate-400'}>
                            Customer Bookings
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {admin.permissions.can_edit_content ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <X className="w-3.5 h-3.5 text-slate-300" />
                          )}
                          <span className={admin.permissions.can_edit_content ? 'text-slate-800' : 'text-slate-400'}>
                            Edit CMS Content
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          admin.status === 'active'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-rose-50 text-rose-800 border-rose-200'
                        }`}
                      >
                        {admin.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(admin)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center gap-1"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleToggleStatus(admin)}
                          className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition cursor-pointer ${
                            admin.status === 'active'
                              ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {admin.status === 'active' ? 'Suspend' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE SUB-ADMIN MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-lg shadow-xl overflow-hidden my-8">
            <div className="p-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center text-rose-700">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="font-serif font-bold text-base text-slate-900">
                  Create Sub-Administrator
                </h3>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-5">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-900 rounded-xl text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Basic Fields */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={createForm.fullName}
                      onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                      placeholder="e.g. Tariq Mehmood"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Username *
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        value={createForm.username}
                        onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                        placeholder="e.g. tariq_admin"
                        className="w-full pl-9 pr-3 py-2 text-xs font-mono rounded-xl border border-slate-300 focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Initial Password *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        value={createForm.password}
                        onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                        placeholder="Min 6 characters"
                        className="w-full pl-9 pr-3 py-2 text-xs font-mono rounded-xl border border-slate-300 focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      value={createForm.email}
                      onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                      placeholder="e.g. tariq@primeview.pk"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                    />
                  </div>
                </div>
              </div>

              {/* Block Scoping */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Assigned Block Scope</span>
                  </label>
                  <div className="flex gap-2 text-[10px]">
                    <button
                      type="button"
                      onClick={() =>
                        setCreateForm({
                          ...createForm,
                          assignedBlocks: ALL_BLOCKS.map((b) => b.id),
                        })
                      }
                      className="text-emerald-700 font-bold hover:underline"
                    >
                      Select All
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setCreateForm({ ...createForm, assignedBlocks: [] })}
                      className="text-slate-500 hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  {ALL_BLOCKS.map((b) => {
                    const checked = createForm.assignedBlocks.includes(b.id);
                    return (
                      <label
                        key={b.id}
                        className="flex items-center gap-2 text-xs text-slate-700 select-none cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCreateForm({
                                ...createForm,
                                assignedBlocks: [...createForm.assignedBlocks, b.id],
                              });
                            } else {
                              setCreateForm({
                                ...createForm,
                                assignedBlocks: createForm.assignedBlocks.filter((id) => id !== b.id),
                              });
                            }
                          }}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="truncate">{b.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Permissions Checklist (Notice: can_create_sub_admin is omitted permanently) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Operational Permissions
                </label>
                <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-slate-700 font-medium">Reserve Plots (Sort Reservations)</span>
                    <input
                      type="checkbox"
                      checked={Boolean(createForm.permissions.can_reserve)}
                      onChange={(e) =>
                        setCreateForm({
                          ...createForm,
                          permissions: { ...createForm.permissions, can_reserve: e.target.checked },
                        })
                      }
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-slate-700 font-medium">Book Plots Directly</span>
                    <input
                      type="checkbox"
                      checked={Boolean(createForm.permissions.can_book)}
                      onChange={(e) =>
                        setCreateForm({
                          ...createForm,
                          permissions: { ...createForm.permissions, can_book: e.target.checked },
                        })
                      }
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-slate-700 font-medium">Create Customer Accounts & Bookings</span>
                    <input
                      type="checkbox"
                      checked={Boolean(createForm.permissions.can_create_customer)}
                      onChange={(e) =>
                        setCreateForm({
                          ...createForm,
                          permissions: { ...createForm.permissions, can_create_customer: e.target.checked },
                        })
                      }
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-slate-700 font-medium">Edit Website Plans & Events (CMS)</span>
                    <input
                      type="checkbox"
                      checked={Boolean(createForm.permissions.can_edit_content)}
                      onChange={(e) =>
                        setCreateForm({
                          ...createForm,
                          permissions: { ...createForm.permissions, can_edit_content: e.target.checked },
                        })
                      }
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                  </label>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  className="px-5 py-2 bg-[#10251E] hover:bg-[#18392C] text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  {createSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create Sub-Admin</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT SUB-ADMIN MODAL */}
      {editingAdmin && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-lg shadow-xl overflow-hidden my-8">
            <div className="p-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700">
                  <Edit2 className="w-4 h-4" />
                </div>
                <h3 className="font-serif font-bold text-base text-slate-900">
                  Edit Sub-Admin: {editingAdmin.username}
                </h3>
              </div>
              <button
                onClick={() => setEditingAdmin(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-5">
              {editError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-900 rounded-xl text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editForm.fullName || ''}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Account Status
                </label>
                <select
                  value={editForm.status || 'active'}
                  onChange={(e) =>
                    setEditForm({ ...editForm, status: e.target.value as 'active' | 'suspended' })
                  }
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:border-emerald-600"
                >
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>

              {/* Block Scope */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Assigned Block Scope
                </label>
                <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  {ALL_BLOCKS.map((b) => {
                    const currentBlocks = editForm.assignedBlocks || [];
                    const checked = currentBlocks.includes(b.id);
                    return (
                      <label
                        key={b.id}
                        className="flex items-center gap-2 text-xs text-slate-700 select-none cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditForm({
                                ...editForm,
                                assignedBlocks: [...currentBlocks, b.id],
                              });
                            } else {
                              setEditForm({
                                ...editForm,
                                assignedBlocks: currentBlocks.filter((id) => id !== b.id),
                              });
                            }
                          }}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="truncate">{b.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Permissions */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Permissions Checklist
                </label>
                <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-slate-700">Reserve Plots</span>
                    <input
                      type="checkbox"
                      checked={Boolean(editForm.permissions?.can_reserve)}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          permissions: { ...editForm.permissions, can_reserve: e.target.checked },
                        })
                      }
                      className="rounded text-emerald-600"
                    />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-slate-700">Book Plots</span>
                    <input
                      type="checkbox"
                      checked={Boolean(editForm.permissions?.can_book)}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          permissions: { ...editForm.permissions, can_book: e.target.checked },
                        })
                      }
                      className="rounded text-emerald-600"
                    />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-slate-700">Create Customer Accounts & Bookings</span>
                    <input
                      type="checkbox"
                      checked={Boolean(editForm.permissions?.can_create_customer)}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          permissions: { ...editForm.permissions, can_create_customer: e.target.checked },
                        })
                      }
                      className="rounded text-emerald-600"
                    />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-slate-700">Edit Website Plans & Events (CMS)</span>
                    <input
                      type="checkbox"
                      checked={Boolean(editForm.permissions?.can_edit_content)}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          permissions: { ...editForm.permissions, can_edit_content: e.target.checked },
                        })
                      }
                      className="rounded text-emerald-600"
                    />
                  </label>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingAdmin(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  {editSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
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
    </div>
  );
}
