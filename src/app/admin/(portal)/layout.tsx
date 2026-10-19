'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getActiveAdminSession, getAdminProfile, updateActiveAdminSession, adminLogout } from '@/lib/dal/adminAuth';
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
  const [authChecked, setAuthChecked] = useState<boolean>(false);
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const active = getActiveAdminSession();
    if (!active) {
      router.push('/admin/login');
      setAuthChecked(true);
      return;
    }
    setSession(active);
    setAuthChecked(true);

    let isMounted = true;

    const refreshSessionFromProfile = async () => {
      const current = getActiveAdminSession();
      if (!current || !current.token) {
        if (isMounted) {
          router.push('/admin/login');
        }
        return;
      }

      // Send him to login only when the login has truly expired
      const isExpired = Boolean(current.expiresAt && current.expiresAt <= Date.now());
      if (isExpired) {
        if (isMounted) {
          await adminLogout();
          router.push('/admin/login');
        }
        return;
      }

      const res = await getAdminProfile(current);
      if (!isMounted) return;

      // A failed or slow profile check must not clear the login and must not send the admin to the login page
      if (!res.ok || !res.admin) {
        return;
      }

      const { status, permissions, assignedBlocks, fullName } = res.admin;

      // Send him to login only when the account is actually inactive
      if (status === 'inactive' || status === 'suspended') {
        await adminLogout();
        router.push('/admin/login');
        return;
      }

      // The permission refresh must update only the permissions, assigned blocks, name, and status.
      // It must leave the login token and the expiry time in place.
      const updated: AdminSession = {
        ...current,
        fullName: fullName || current.fullName,
        status: status || current.status,
        permissions: (permissions as any) || current.permissions,
        assignedBlocks: assignedBlocks || current.assignedBlocks,
        token: current.token,
        expiresAt: current.expiresAt,
      };

      updateActiveAdminSession(updated);
      setSession(updated);
    };

    // Initial check on mount to ensure fresh state
    refreshSessionFromProfile();

    // Refresh every 30 seconds
    const intervalId = setInterval(refreshSessionFromProfile, 30000);

    // Refresh when tab becomes visible or receives focus
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshSessionFromProfile();
      }
    };
    const handleFocus = () => {
      refreshSessionFromProfile();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [router]);

  // Send the user to login only when the browser has checked and there is no session
  if (authChecked && !session) {
    return null;
  }

  // Derive header title from pathname
  let pageTitle = '';
  let pageSubtitle = '';
  if (pathname.includes('/admin/dashboard')) {
    pageTitle = 'Dashboard';
    pageSubtitle = 'Society Overview';
  } else if (pathname.includes('/admin/master-plan')) {
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
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-[#F4F7F5] print:p-0 print:m-0 print:bg-white print:overflow-visible print:h-auto print:block">
          {children}
        </main>
      </div>
    </div>
  );
}
