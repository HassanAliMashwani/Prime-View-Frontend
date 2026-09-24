'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getActiveAdminSession } from '@/lib/dal/adminAuth';
import { AdminSession } from '@/lib/mock/types';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminPortalLayoutSkeleton } from '@/components/ui/skeleton';

export default function AdminPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<AdminSession | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);

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
    return <AdminPortalLayoutSkeleton />;
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
  } else if (pathname.includes('/admin/inventory')) {
    pageTitle = 'Inventory Overview';
    pageSubtitle = 'Category Breakdown & Availability';
  } else if (pathname.includes('/admin/reservations')) {
    pageTitle = 'Sort Reservations';
    pageSubtitle = 'Token Priority & Disputes';
  } else if (pathname.includes('/admin/customers-directory')) {
    pageTitle = 'Customer Directory';
    pageSubtitle = 'Member Dossiers & Compliance Ledger';
  } else if (pathname.includes('/admin/customers')) {
    pageTitle = 'Customer Bookings';
    pageSubtitle = 'Paper Application Form & Accounts';
  } else if (pathname.includes('/admin/sales-history')) {
    pageTitle = 'Sales History';
    pageSubtitle = 'Audit Ledger & Revenue Attribution';
  } else if (pathname.includes('/admin/receipts')) {
    pageTitle = 'Receipt Verification';
    pageSubtitle = 'Payment Approvals & Bank Slips';
  } else if (pathname.includes('/admin/content')) {
    pageTitle = 'Content CMS';
    pageSubtitle = 'Plans & Society Events';
  } else if (pathname.includes('/admin/sub-admins')) {
    pageTitle = 'Teams & Access';
    pageSubtitle = 'Access Delegation & Sector Scopes';
  } else if (pathname.includes('/admin/audit-log')) {
    pageTitle = 'Audit Trail';
    pageSubtitle = 'Activity Logs & Modification Diffs';
  }

  return (
    <div className="h-screen flex overflow-hidden bg-[#F8FAF9] text-slate-900 print:h-auto print:overflow-visible print:bg-white print:block">
      <div className="print:hidden shrink-0">
        <AdminSidebar session={session} isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      </div>
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden print:h-auto print:overflow-visible print:block">
        <div className="print:hidden">
          <AdminHeader
            session={session}
            title={pageTitle}
            subtitle={pageSubtitle}
            onOpenMobileMenu={() => setMobileOpen(true)}
          />
        </div>
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 bg-[#F4F7F5] print:p-0 print:m-0 print:bg-white print:overflow-visible print:h-auto print:block">
          {children}
        </main>
      </div>
    </div>
  );
}
