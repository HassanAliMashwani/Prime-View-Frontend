'use client';

import React, { useEffect } from 'react';
import { AuthGuard } from '@/components/member-portal/AuthGuard';
import { MemberSidebar } from '@/components/member-portal/MemberSidebar';
import { PortalProvider, usePortal } from '@/components/member-portal/PortalContext';
import { useMemberStore } from '@/lib/store/useMemberStore';

function MemberPortalContent({ children }: { children: React.ReactNode }) {
  const { mobileMenuOpen, closeMobileMenu } = usePortal();
  const initSync = useMemberStore((state) => state.initSync);

  // Initialize cross-tab real-time sync via BroadcastChannel
  useEffect(() => {
    const cleanup = initSync();
    return () => {
      if (cleanup) cleanup();
    };
  }, [initSync]);

  return (
    <div className="min-h-screen bg-[#F8F7F5] flex">
      {/* Navigation Sidebar */}
      <MemberSidebar isOpen={mobileMenuOpen} onClose={closeMobileMenu} />

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-72 flex flex-col min-w-0">{children}</div>
    </div>
  );
}

export default function MemberPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <PortalProvider>
        <MemberPortalContent>{children}</MemberPortalContent>
      </PortalProvider>
    </AuthGuard>
  );
}
