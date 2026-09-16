'use client';

import React, { useState } from 'react';
import { useMemberStore } from '@/lib/store/useMemberStore';
import { acceptTermsAndConditions } from '@/lib/dal/customers';
import { useAuth } from '@/lib/hooks/useAuth';
import { Shield, FileCheck, CheckCircle, AlertCircle, LogOut } from 'lucide-react';

interface TermsAgreementModalProps {
  standalone?: boolean;
}

export const TermsAgreementModal: React.FC<TermsAgreementModalProps> = ({ standalone = false }) => {
  const { profile, fetchProfile, termsModalOpen, closeTermsModal } = useMemberStore();
  const { logout } = useAuth();
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mandatory first-login check (when profile.termsAccepted is strictly false)
  const isMandatory = profile ? profile.termsAccepted === false : false;
  const isVisible = standalone || isMandatory || termsModalOpen;

  // If not mandatory and not explicitly triggered, do not render
  if (!isVisible) {
    return null;
  }

  const handleAccept = async () => {
    if (!agreed && isMandatory) return;
    setIsSubmitting(true);
    setError(null);

    try {
      if (profile) {
        const res = await acceptTermsAndConditions(profile.id);
        if (res.ok) {
          useMemberStore.setState((state) => ({
            ...state,
            profile: state.profile
              ? { ...state.profile, termsAccepted: true, termsAcceptedAt: new Date().toISOString() }
              : null,
            termsModalOpen: false,
          }));
          await fetchProfile();
          closeTermsModal();
        } else {
          setError(res.error || 'Failed to record acceptance. Please try again.');
        }
      } else {
        closeTermsModal();
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const cardContent = (
    <div className="max-w-2xl w-full bg-white rounded-3xl border border-black/[0.08] shadow-[0_24px_60px_rgba(0,0,0,0.1)] p-6 sm:p-8 space-y-6 animate-scale-in mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-black/[0.06]">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#EAF0E7] text-[#43612B] flex items-center justify-center shrink-0">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#43612B] block">
                {isMandatory ? 'Mandatory First-Login Agreement' : 'Official Society Bylaws • Verified Agreement'}
              </span>
              <h2 className="font-display font-bold text-xl sm:text-2xl text-[#151914]">
                Society Terms &amp; Conditions
              </h2>
              <p className="text-xs text-[#6B7462] mt-0.5">
                {isMandatory
                  ? 'Welcome to the Prime View Member Portal. Please review and agree to the society bylaws before proceeding to your dashboard.'
                  : 'Official registered bylaws and governance policies of Prime View Co-Operative Housing Society Ltd.'}
              </p>
            </div>
          </div>
          {!isMandatory && (
            <button
              type="button"
              onClick={closeTermsModal}
              className="text-[#6B7462] hover:text-[#151914] p-1.5 rounded-lg hover:bg-black/5 transition-colors"
              title="Close"
            >
              ✕
            </button>
          )}
        </div>

        {/* Scrollable Terms Content */}
        <div className="max-h-64 sm:max-h-72 overflow-y-auto pr-3 space-y-4 text-xs text-[#4A5347] leading-relaxed border border-black/[0.06] rounded-2xl p-4 bg-[#FAF9F7]">
          <div>
            <h4 className="font-bold text-[#151914] mb-1">
              1. Statutory Jurisdiction &amp; Society Bylaws
            </h4>
            <p>
              By accessing this member portal, you affirm that you are an authorized allotment holder or provisional member of Prime View Co-operative Housing Society Ltd. You agree to be governed by the Co-operative Societies Act 1925, the KPK Co-operative Societies Rules 1927, and the approved society constitution and bylaws.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-[#151914] mb-1">
              2. Installment Schedules &amp; Surcharge Obligations
            </h4>
            <p>
              Installment amounts, down payments, and developmental surcharges must be cleared on or before their stipulated due dates. Any failure to deposit dues within the prescribed grace period may incur administrative surcharges or subject the allotment file to executive review pursuant to society bylaws.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-[#151914] mb-1">
              3. Payment Receipt Upload &amp; Verification Protocol
            </h4>
            <p>
              All online deposit slips and banking receipts uploaded via this portal are subject to administrative clearance with the society&apos;s designated scheduled bank accounts. Digital receipts become legally binding only upon the generation and issuance of the official two-part verified slip bearing the cryptographic seal.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-[#151914] mb-1">
              4. Digital Security &amp; Member Confidentiality
            </h4>
            <p>
              You are strictly responsible for maintaining the confidentiality of your member credentials. Passwords must be at least 8 characters. Any activity performed using your member credentials will be presumed authorized by you unless promptly reported to the society secretariat.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-[#151914] mb-1">
              5. File Transfer &amp; Allotment Integrity
            </h4>
            <p>
              Digital plot allotment files and member records remain the exclusive property of Prime View Housing Society until official physical execution of the sub-lease/allotment certificate following 100% financial settlement and society clearance.
            </p>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Checkbox */}
        <label className="flex items-start gap-3 cursor-pointer select-none bg-[#FAF9F5] p-3.5 rounded-xl border border-black/[0.06]">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 w-4 h-4 text-[#43612B] rounded-sm focus:ring-[#43612B] border-black/20"
          />
          <span className="text-xs font-semibold text-[#151914] leading-snug">
            I hereby confirm that I have read, understood, and solemnly accept all Terms &amp; Conditions, society bylaws, and digital portal policies of Prime View Housing Society.
          </span>
        </label>

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-2">
          {isMandatory ? (
            <button
              type="button"
              onClick={() => logout()}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors text-center cursor-pointer"
            >
              Log Out
            </button>
          ) : (
            <button
              type="button"
              onClick={closeTermsModal}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center transition-colors text-center cursor-pointer"
            >
              Close
            </button>
          )}

          <button
            type="button"
            disabled={(!agreed && isMandatory) || isSubmitting}
            onClick={handleAccept}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#43612B] hover:bg-[#365222] disabled:opacity-40 text-white font-bold text-xs tracking-wide flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(67,97,43,0.3)] transition-all cursor-pointer disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Recording Agreement...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>{isMandatory ? 'Agree & Enter Member Portal' : 'Accept Terms & Save'}</span>
              </>
            )}
          </button>
        </div>
    </div>
  );

  if (standalone) {
    return cardContent;
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {cardContent}
    </div>
  );
};
