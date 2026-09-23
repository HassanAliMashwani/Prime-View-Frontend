'use client';

import React, { useEffect } from 'react';
import { Ban } from 'lucide-react';
import { AuthGuard } from '@/components/member-portal/AuthGuard';
import { MemberSidebar } from '@/components/member-portal/MemberSidebar';
import { PortalProvider, usePortal } from '@/components/member-portal/PortalContext';
import { useMemberStore } from '@/lib/store/useMemberStore';
import { TermsAgreementModal } from '@/components/member-portal/TermsAgreementModal';

function MemberPortalContent({ children }: { children: React.ReactNode }) {
  const { mobileMenuOpen, closeMobileMenu } = usePortal();
  const { initSync, profile, fetchProfile, termsModalOpen } = useMemberStore();

  // Ensure profile is loaded so terms agreement gate is active
  useEffect(() => {
    if (!profile) {
      fetchProfile();
    }
  }, [profile, fetchProfile]);

  // Initialize cross-tab real-time sync via BroadcastChannel
  useEffect(() => {
    const cleanup = initSync();
    return () => {
      if (cleanup) cleanup();
    };
  }, [initSync]);

  // Suspended Account Blocking Gate: Exact single consistent notice
  if (profile?.accountStatus === 'suspended') {
    return (
      <div className="min-h-screen bg-[#F8F7F5] flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-rose-200 shadow-xl p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
            <Ban className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="font-display font-bold text-xl text-slate-900">
              Your account is suspended. Please contact admin.
            </h1>
            <p className="text-xs text-slate-600 leading-relaxed">
              Your society membership access ({profile.membershipNo}) has been placed on administrative suspension. All portal actions, document requests, and installment submissions are disabled.
            </p>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-left text-slate-600 space-y-2">
            <div className="font-bold text-slate-800">Prime View Society Secretariat:</div>
            <div>📍 Main Boulevard, Sector B, Prime View Housing Society</div>
            <div>📞 (051) 111-PRIME / +92 51 9876543</div>
            <div>✉️ secretariat@primeview.org</div>
          </div>
          <button
            type="button"
            onClick={() => {
              sessionStorage.clear();
              document.cookie = 'pv_member_token=; path=/; max-age=0;';
              window.location.href = '/society-members/login';
            }}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Logout to Login Screen
          </button>
        </div>
      </div>
    );
  }

  // Determine if terms modal is active (either first-login gate or review modal)
  const isTermsActive = profile ? profile.termsAccepted === false || termsModalOpen : false;

  return (
    <div className="relative min-h-screen bg-[#F8F7F5]">
      {/* Background Member Portal - softly blurred and non-interactive when terms popup is active */}
      <div
        className={`min-h-screen flex transition-all duration-300 ${
          isTermsActive ? 'filter blur-[5px] pointer-events-none select-none' : ''
        }`}
        aria-hidden={isTermsActive}
      >
        {/* Navigation Sidebar */}
        <MemberSidebar isOpen={mobileMenuOpen} onClose={closeMobileMenu} />

        {/* Main Content Area */}
        <div className="flex-1 lg:ml-72 flex flex-col min-w-0">{children}</div>
      </div>

      {/* Fixed Terms & Conditions Popup Modal Container Centered Over Blurred Portal */}
      <TermsAgreementModal />
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
