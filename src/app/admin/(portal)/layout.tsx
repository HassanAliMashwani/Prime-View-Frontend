'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getActiveAdminSession } from '@/lib/dal/adminAuth';
import { AdminSession } from '@/lib/mock/types';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';

export default function AdminPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<AdminSession | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const active = getActiveAdminSession();
    if (!active) {
      router.push('/admin/login');
    } else {
      setSession(active);
    }
    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#091510] flex items-center justify-center text-[#A3C692]">
        <div className="animate-pulse font-serif text-lg tracking-wide">
          Authenticating Administrator Session...
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  // Derive header title from pathname
  let pageTitle = 'Dashboard';
  let pageSubtitle = 'Society Overview';
  if (pathname.includes('/admin/master-plan')) {
    pageTitle = 'Master Plan';
    pageSubtitle = 'Inventory & Plot Grid';
  } else if (pathname.includes('/admin/reservations')) {
    pageTitle = 'Sort Reservations';
    pageSubtitle = 'Token Priority & Disputes';
  }

  return (
    <div className="min-h-screen flex bg-[#0A1812] text-[#FAF9F7]">
      <AdminSidebar session={session} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AdminHeader session={session} title={pageTitle} subtitle={pageSubtitle} />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 bg-[#0B1A14]">
          {children}
        </main>
      </div>
    </div>
  );
}
