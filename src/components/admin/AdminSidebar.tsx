'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Map, 
  BookmarkCheck, 
  LogOut, 
  ShieldCheck, 
  ExternalLink,
  Layers,
  Users,
  UserPlus,
  FileEdit,
  ScrollText
} from 'lucide-react';
import { AdminSession } from '@/lib/mock/types';
import { adminLogout } from '@/lib/dal/adminAuth';

interface AdminSidebarProps {
  session: AdminSession | null;
}

const BLOCK_COLORS: Record<string, string> = {
  abbott: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  royal: 'bg-amber-50 text-amber-800 border-amber-200',
  overseas: 'bg-sky-50 text-sky-800 border-sky-200',
  elite: 'bg-purple-50 text-purple-800 border-purple-200',
  chalet: 'bg-rose-50 text-rose-800 border-rose-200',
  commercial: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  'npf-phase-1': 'bg-teal-50 text-teal-800 border-teal-200',
  'npf-phase-2': 'bg-cyan-50 text-cyan-800 border-cyan-200',
};

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ session }) => {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await adminLogout();
    router.push('/admin/login');
  };

  const isSuper = session?.role === 'super_admin';
  const canCreateCustomer = isSuper || Boolean(session?.permissions?.can_create_customer);
  const canEditContent = isSuper || Boolean(session?.permissions?.can_edit_content);

  const coreNavItems = [
    {
      label: 'Admin Dashboard',
      href: '/admin/dashboard',
      icon: LayoutDashboard,
      iconColor: 'text-emerald-600',
      activeColor: 'bg-emerald-50 text-emerald-950 border-emerald-600',
      active: pathname === '/admin/dashboard',
      visible: true,
    },
    {
      label: 'Master Plan',
      href: '/admin/master-plan',
      icon: Map,
      iconColor: 'text-indigo-600',
      activeColor: 'bg-indigo-50 text-indigo-950 border-indigo-600',
      active: pathname.startsWith('/admin/master-plan'),
      visible: true,
    },
    {
      label: 'Sort Reservations',
      href: '/admin/reservations',
      icon: BookmarkCheck,
      iconColor: 'text-amber-600',
      activeColor: 'bg-amber-50 text-amber-950 border-amber-600',
      active: pathname === '/admin/reservations',
      visible: true,
    },
    {
      label: 'Customer Bookings',
      href: '/admin/customers',
      icon: UserPlus,
      iconColor: 'text-blue-600',
      activeColor: 'bg-blue-50 text-blue-950 border-blue-600',
      active: pathname === '/admin/customers',
      visible: canCreateCustomer,
    },
    {
      label: 'Content CMS',
      href: '/admin/content',
      icon: FileEdit,
      iconColor: 'text-violet-600',
      activeColor: 'bg-violet-50 text-violet-950 border-violet-600',
      active: pathname === '/admin/content',
      visible: canEditContent,
    },
  ];

  const adminNavItems = [
    {
      label: 'Sub-Administrators',
      href: '/admin/sub-admins',
      icon: Users,
      iconColor: 'text-rose-600',
      activeColor: 'bg-rose-50 text-rose-950 border-rose-600',
      active: pathname === '/admin/sub-admins',
      visible: isSuper,
    },
    {
      label: 'System Audit Log',
      href: '/admin/audit-log',
      icon: ScrollText,
      iconColor: 'text-slate-700',
      activeColor: 'bg-slate-100 text-slate-950 border-slate-700',
      active: pathname === '/admin/audit-log',
      visible: isSuper,
    },
  ];

  return (
    <aside className="w-64 bg-white text-slate-800 flex flex-col border-r border-slate-200/90 select-none h-screen sticky top-0 shrink-0 shadow-xs z-20">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#10251E] to-[#18392C] border border-[#234F3D] flex items-center justify-center text-[#D4AF37] font-serif font-bold text-xl shadow-md">
            PV
          </div>
          <div>
            <div className="font-serif font-bold text-base tracking-tight text-[#10251E]">
              PRIME VIEW
            </div>
            <div className="text-[10px] uppercase tracking-wider font-bold text-emerald-700">
              Admin Core • Society Management
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
          Core Operations
        </div>
        {coreNavItems.filter((i) => i.visible).map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                item.active
                  ? `${item.activeColor} border-l-4 shadow-xs`
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-4 h-4 ${item.active ? '' : item.iconColor}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}

        {isSuper && (
          <>
            <div className="pt-5 px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Governance & Audit
            </div>
            {adminNavItems.filter((i) => i.visible).map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                    item.active
                      ? `${item.activeColor} border-l-4 shadow-xs`
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${item.active ? '' : item.iconColor}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </>
        )}

        <div className="pt-5 px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
          External Portal
        </div>
        <Link
          href="/society-members/dashboard"
          className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all"
        >
          <div className="flex items-center gap-2.5">
            <ExternalLink className="w-3.5 h-3.5 text-teal-600" />
            <span>Member Portal View</span>
          </div>
          <span className="text-[9px] bg-teal-50 text-teal-800 border border-teal-200 px-1.5 py-0.5 rounded-md font-mono font-bold">
            Phase 1
          </span>
        </Link>
      </nav>

      {/* Admin Scope Panel */}
      <div className="p-3.5 border-t border-slate-100 bg-slate-50/70">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className={`w-4 h-4 ${isSuper ? 'text-[#D4AF37]' : 'text-blue-600'}`} />
            <div className="text-[12px] font-bold text-slate-900 truncate">
              {session?.fullName || 'Administrator'}
            </div>
          </div>

          <div className="flex items-center justify-between gap-1 mb-2">
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                isSuper
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-blue-100 text-blue-900 border border-blue-300'
              }`}
            >
              {isSuper ? 'Super Administrator' : 'Sub-Administrator'}
            </span>
          </div>

          {/* Block Scope Info */}
          <div className="text-[10px] text-slate-500 border-t border-slate-100 pt-2 mt-2">
            <div className="flex items-center gap-1 font-semibold text-slate-600 mb-1">
              <Layers className="w-3 h-3 text-slate-400" />
              <span>Assigned Sectors:</span>
            </div>
            {isSuper ? (
              <span className="text-emerald-800 text-[11px] font-bold">
                Society-wide (All 8 Blocks)
              </span>
            ) : (
              <div className="flex flex-wrap gap-1 mt-1">
                {session?.assignedBlocks?.map((b) => (
                  <span
                    key={b}
                    className={`border text-[9px] px-1.5 py-0.5 rounded-md uppercase font-mono font-bold ${
                      BLOCK_COLORS[b] || 'bg-slate-100 text-slate-800 border-slate-300'
                    }`}
                  >
                    {b}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sign Out Button */}
        <button
          onClick={handleLogout}
          className="w-full mt-2.5 flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-200 transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out Admin</span>
        </button>
      </div>
    </aside>
  );
};
