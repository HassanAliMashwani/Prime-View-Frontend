"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Cookie, ShieldCheck, X } from "lucide-react";

export const CookieConsentBanner: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const consent = localStorage.getItem("pv_cookie_consent");
      if (!consent) {
        setVisible(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem("pv_cookie_consent", "accepted");
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  const handleReject = () => {
    try {
      localStorage.setItem("pv_cookie_consent", "rejected");
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  if (!mounted || !visible) return null;

  return (
    <div
      role="region"
      aria-label="Cookie consent banner"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="bg-[#151914] text-white p-5 sm:p-6 rounded-2xl shadow-2xl border border-white/[0.1] space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#43612B] text-white flex items-center justify-center shrink-0">
              <Cookie className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm text-white">Cookie & Privacy Preferences</h3>
              <p className="text-[11px] text-[#A8BBA2]">Prime View Housing Society Abbottabad</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleReject}
            aria-label="Dismiss cookie banner"
            className="text-white/60 hover:text-white transition-colors cursor-pointer p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-[#EAF0E7]/80 leading-relaxed">
          We use strictly essential cookies for secure portal authentication. Optional analytics remain completely disabled until you grant consent. Read our{" "}
          <Link href="/cookies" className="underline text-[#A8BBA2] hover:text-white font-medium">
            Cookies Policy
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline text-[#A8BBA2] hover:text-white font-medium">
            Privacy Policy
          </Link>.
        </p>

        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={handleAccept}
            className="flex-1 py-2.5 px-3 bg-[#43612B] hover:bg-[#344D22] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-sm text-center"
          >
            Accept Cookies
          </button>
          <button
            type="button"
            onClick={handleReject}
            className="flex-1 py-2.5 px-3 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer text-center"
          >
            Reject All
          </button>
        </div>
      </div>
    </div>
  );
};
