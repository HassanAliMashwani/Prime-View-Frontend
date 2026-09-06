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
  Layers
} from 'lucide-react';
import { AdminSession } from '@/lib/mock/types';
import { adminLogout } from '@/lib/dal/adminAuth';

interface AdminSidebarProps {
  session: AdminSession | null;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ session }) => {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await adminLogout();
    router.push('/admin/login');
  };

  const navItems = [
    {
      label: 'Admin Dashboard',
      href: '/admin/dashboard',
      icon: LayoutDashboard,
      active: pathname === '/admin/dashboard',
    },
    {
      label: 'Master Plan',
      href: '/admin/master-plan',
      icon: Map,
      active: pathname.startsWith('/admin/master-plan'),
    },
    {
      label: 'Sort Reservations',
      href: '/admin/reservations',
      icon: BookmarkCheck,
      active: pathname === '/admin/reservations',
    },
  ];

  const isSuper = session?.role === 'super_admin';

  return (
    <aside className="w-64 bg-[#0B1A14] text-white flex flex-col border-r border-[#1E3A2F]/60 select-none min-h-screen">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#1E3A2F]/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1E3A2F] to-[#0D1F18] border border-[#2D5A46] flex items-center justify-center text-[#D4AF37] font-serif font-bold text-xl shadow-md">
            PV
          </div>
          <div>
            <div className="font-serif font-bold text-base tracking-wide text-[#FAF9F7] flex items-center gap-1.5">
              PRIME VIEW
            </div>
            <div className="text-[10px] uppercase tracking-wider font-semibold text-[#8FAF7E]">
              Admin Core • Phase 2
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-[#5C7E6F]">
          Management Modules
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                item.active
                  ? 'bg-[#183327] text-[#D4AF37] shadow-sm font-semibold border-l-4 border-[#D4AF37]'
                  : 'text-[#A0B8AD] hover:bg-[#12281F] hover:text-[#FAF9F7]'
              }`}
            >
              <Icon className={`w-4 h-4 ${item.active ? 'text-[#D4AF37]' : 'text-[#6D917F]'}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}

        <div className="pt-6 px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-[#5C7E6F]">
          External Views
        </div>
        <Link
          href="/society-members/dashboard"
          className="flex items-center justify-between px-3.5 py-2 rounded-lg text-xs font-medium text-[#A0B8AD] hover:bg-[#12281F] hover:text-[#FAF9F7] transition-all"
        >
          <div className="flex items-center gap-2.5">
            <ExternalLink className="w-3.5 h-3.5 text-[#6D917F]" />
            <span>Member Portal View</span>
          </div>
          <span className="text-[9px] bg-[#1A382B] text-[#8FAF7E] px-1.5 py-0.5 rounded font-mono">
            Phase 1
          </span>
        </Link>
      </nav>

      {/* Admin Scope Panel */}
      <div className="p-3 border-t border-[#1E3A2F]/80 bg-[#0E2019]">
        <div className="bg-[#142920] border border-[#224436] rounded-xl p-3 shadow-inner">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className={`w-4 h-4 ${isSuper ? 'text-[#D4AF37]' : 'text-[#8FAF7E]'}`} />
            <div className="text-[11px] font-semibold text-white truncate">
              {session?.fullName || 'Administrator'}
            </div>
          </div>

          <div className="flex items-center justify-between gap-1 mb-2">
            <span
              className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                isSuper
                  ? 'bg-[#D4AF37]/20 text-[#F3E29F] border border-[#D4AF37]/40'
                  : 'bg-[#1E4835] text-[#A5D6B6] border border-[#2B6047]'
              }`}
            >
              {isSuper ? 'Super Administrator' : 'Sub-Administrator'}
            </span>
          </div>

          {/* Block Scope Info */}
          <div className="text-[10px] text-[#8FAF7E] border-t border-[#224436] pt-1.5 mt-1.5">
            <div className="flex items-center gap-1 font-semibold text-[#B2CEB8] mb-1">
              <Layers className="w-3 h-3" />
              <span>Assigned Scope:</span>
            </div>
            {isSuper ? (
              <span className="text-[#F3E29F] text-[10px] font-medium">
                Society-wide (All 8 Blocks)
              </span>
            ) : (
              <div className="flex flex-wrap gap-1 mt-1">
                {session?.assignedBlocks?.map((b) => (
                  <span
                    key={b}
                    className="bg-[#1C3A2C] border border-[#2E5844] text-[#D2E7D8] text-[9px] px-1.5 py-0.5 rounded uppercase font-mono"
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
          className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-[#E68A8A] bg-[#2A1717] hover:bg-[#3D1E1E] rounded-lg border border-[#4F2323] transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out Admin</span>
        </button>
      </div>
    </aside>
  );
};
