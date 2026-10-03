import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookies Policy | Prime View Housing Society Abbottabad",
  description: "Cookies Policy for Prime View Housing Society portal explaining essential session cookies and privacy choices.",
  alternates: {
    canonical: "https://prime-view-livid.vercel.app/cookies",
  },
};

export default function CookiesPolicyPage() {
  return (
    <div className="py-16 sm:py-24 bg-[#F8F7F5] min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Mandatory owner review disclaimer */}
        <div className="mb-8 p-4 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs sm:text-sm font-semibold flex items-center justify-between">
          <span>Draft for owner review. The society owner will confirm the final legal text.</span>
          <span className="text-[11px] uppercase tracking-wider text-amber-800 bg-amber-200/60 px-2 py-0.5 rounded">Jurisdiction: Pakistan</span>
        </div>

        <div className="bg-white p-8 sm:p-12 rounded-3xl border border-black/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.04)] space-y-8 font-sans text-[#151914]">
          <div className="border-b border-black/[0.08] pb-6">
            <p className="text-xs uppercase tracking-widest font-bold text-[#43612B] mb-2">Transparency & Privacy</p>
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#151914]">
              Cookies Policy
            </h1>
            <p className="text-xs text-[#6B7462] mt-2">
              Last updated: October 2026 • Prime View Cooperative Housing Society Abbottabad
            </p>
          </div>

          <section className="space-y-3">
            <h2 className="font-display text-xl font-bold text-[#151914]">1. What Are Cookies?</h2>
            <p className="text-sm leading-relaxed text-[#4A5542]">
              Cookies are compact text files stored on your computer or mobile device when you browse websites. They enable digital portals to maintain active logins, remember user preferences, and ensure responsive navigation.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl font-bold text-[#151914]">2. Categories of Cookies We Use</h2>
            <div className="space-y-4 text-sm text-[#4A5542]">
              <div className="p-4 bg-[#FAF9F7] rounded-xl border border-black/[0.06]">
                <h3 className="font-bold text-[#151914] mb-1">Strictly Essential Technical Cookies</h3>
                <p className="text-xs leading-relaxed">
                  These cookies are vital for the security and fundamental operation of our portal. They include session tokens (e.g., <code>pv_admin_token</code>, <code>pv_member_token</code>) and CSRF/state keys. These cookies cannot be turned off as the portal cannot function without them.
                </p>
              </div>

              <div className="p-4 bg-[#FAF9F7] rounded-xl border border-black/[0.06]">
                <h3 className="font-bold text-[#151914] mb-1">Consent & Preference Storage</h3>
                <p className="text-xs leading-relaxed">
                  We use a local browser flag (<code>pv_cookie_consent</code>) solely to remember whether you accepted or declined optional cookies, preventing repeated banners on subsequent visits.
                </p>
              </div>

              <div className="p-4 bg-[#FAF9F7] rounded-xl border border-black/[0.06]">
                <h3 className="font-bold text-[#151914] mb-1">Analytics & Performance Cookies (Optional)</h3>
                <p className="text-xs leading-relaxed">
                  Optional telemetry used to analyze visitor counts and traffic routes. <strong>No analytics cookies are ever loaded before you explicitly click &quot;Accept&quot; on our cookie consent banner.</strong> If you select &quot;Reject All&quot;, no analytics scripts or cookies are set.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl font-bold text-[#151914]">3. Managing Your Cookie Choices</h2>
            <p className="text-sm leading-relaxed text-[#4A5542]">
              You can adjust your cookie settings at any time by clearing your browser cache and cookies, or resetting your preferences via the banner prompt on our homepage.
            </p>
          </section>

          <section className="space-y-3 border-t border-black/[0.08] pt-6">
            <h2 className="font-display text-xl font-bold text-[#151914]">4. Contact Our Data Desk</h2>
            <p className="text-sm leading-relaxed text-[#4A5542]">
              For inquiries regarding cookies or technical data handling, contact the Prime View IT and Secretariat Desk at <a href="mailto:secretariat@primeview.org" className="text-[#43612B] underline font-medium">secretariat@primeview.org</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
