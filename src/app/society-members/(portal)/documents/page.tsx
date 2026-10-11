'use client';

import React, { useEffect, useState } from 'react';
import { MemberHeader } from '@/components/member-portal/MemberHeader';
import { getMyDocuments, PlotDocuments } from '@/lib/dal/documents';
import { FileText, ExternalLink, Building2, Calendar, ShieldCheck, Download, AlertCircle } from 'lucide-react';

function formatDocType(type?: string) {
  if (!type) return 'Society Document';
  switch (type) {
    case 'booking_confirmation':
      return 'Booking Confirmation';
    case 'booking_agreement':
      return 'Allotment Agreement';
    case 'payment_receipt':
      return 'Payment Receipt';
    case 'installment_schedule':
      return 'Installment Schedule';
    case 'applicant_photo':
      return 'Applicant Photograph';
    case 'cnic_copy':
      return 'CNIC Verification Document';
    case 'nok_cnic_copy':
      return 'Next of Kin Document';
    default:
      return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }
}

export default function DocumentsPage() {
  const [plotsData, setPlotsData] = useState<PlotDocuments[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadDocuments() {
      setIsLoading(true);
      setError(null);
      const res = await getMyDocuments();
      if (!isMounted) return;
      if (res.ok && res.data) {
        setPlotsData(res.data);
      } else {
        setError(res.error || 'Unable to load member documents');
      }
      setIsLoading(false);
    }
    loadDocuments();
    return () => {
      isMounted = false;
    };
  }, []);

  const totalDocuments = plotsData.reduce((acc, p) => acc + (p.documents?.length || 0), 0);

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <MemberHeader
        title="Member Documents"
        subtitle="Official registry records, agreements, and installment schedules"
      />

      <main className="px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+5.5rem)] sm:p-6 md:p-8 max-w-7xl w-full mx-auto space-y-4 sm:space-y-6">
        {/* Header Summary */}
        <div className="bg-white rounded-2xl border border-black/[0.08] p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="space-y-1">
            <h3 className="font-display font-bold text-base sm:text-lg text-[#151914]">
              Official Society Documents ({isLoading ? '...' : totalDocuments})
            </h3>
            <p className="text-xs text-[#6B7462]">
              All official contracts, payment slips, and schedules issued to your registered membership.
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#EAF0E7] border border-[#A8BBA2]/40 text-[#43612B] text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-[#43612B]" />
            <span>Verified Society Records</span>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-black/[0.08] p-5 space-y-4 animate-pulse">
                <div className="h-5 w-40 bg-slate-200 rounded" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="h-20 bg-slate-100 rounded-xl" />
                  <div className="h-20 bg-slate-100 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : totalDocuments === 0 ? (
          <div className="bg-white rounded-2xl border border-black/[0.08] p-10 text-center space-y-2">
            <FileText className="w-10 h-10 text-[#6B7462]/50 mx-auto" />
            <h4 className="font-display font-bold text-base text-[#151914]">No Documents Issued Yet</h4>
            <p className="text-xs text-[#6B7462] max-w-md mx-auto">
              Your official allotment agreements and installment schedules will appear here once finalized by society administration.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {plotsData.map((plotGroup) => {
              const docs = plotGroup.documents || [];
              if (docs.length === 0) return null;

              return (
                <div
                  key={plotGroup.plotId}
                  className="bg-white rounded-2xl border border-black/[0.08] p-4 sm:p-6 shadow-xs space-y-4"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[#EAF0E7] border border-[#A8BBA2]/40 flex items-center justify-center text-[#43612B]">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-display font-bold text-sm sm:text-base text-[#151914]">
                          Plot {plotGroup.plotNumber}
                        </h4>
                        <span className="text-[11px] text-[#6B7462]">
                          {docs.length} Official Document{docs.length === 1 ? '' : 's'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {docs.map((doc) => {
                      const hasAddress = Boolean(doc.fileUrl);

                      return (
                        <div
                          key={doc.id}
                          className="bg-[#FAF9F7] rounded-xl border border-black/[0.06] p-4 flex flex-col justify-between hover:border-[#43612B]/40 transition-colors space-y-3"
                        >
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="w-9 h-9 rounded-lg bg-white border border-black/[0.08] flex items-center justify-center text-[#43612B] shrink-0">
                                <FileText className="w-4 h-4" />
                              </div>
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white text-[#43612B] border border-black/[0.06]">
                                {formatDocType(doc.type)}
                              </span>
                            </div>

                            <div>
                              <h5 className="font-display font-bold text-xs text-[#151914] line-clamp-1" title={doc.fileName}>
                                {doc.fileName || formatDocType(doc.type)}
                              </h5>
                              <div className="flex items-center gap-2 text-[10px] text-[#6B7462] mt-0.5">
                                {doc.fileSizeKb && (
                                  <span>{doc.fileSizeKb} KB</span>
                                )}
                                {doc.uploadedAt && (
                                  <>
                                    <span>•</span>
                                    <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-black/[0.06] flex items-center justify-between">
                            {hasAddress ? (
                              <a
                                href={doc.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#43612B] hover:text-[#2e431d] transition-colors"
                              >
                                <span>Open Document</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            ) : (
                              <span className="text-[11px] text-[#6B7462] italic">Document Pending</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
