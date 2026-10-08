import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface AdminTableShellProps {
  children: React.ReactNode;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  isTable?: boolean;
  loading?: boolean;
}

export function AdminTableShell({
  children,
  page,
  pageSize,
  total,
  onPageChange,
  isTable = true,
  loading = false,
}: AdminTableShellProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  
  const from = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to = Math.min(safePage * pageSize, total);

  return (
    <div className="flex flex-col bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden h-[600px] print:h-auto print:overflow-visible">
      <div className="flex-1 overflow-auto relative print:overflow-visible">
        {isTable ? (
          <table className="w-full text-left border-collapse min-w-[800px]">
            {children}
          </table>
        ) : (
          <div className="w-full h-full">
            {children}
          </div>
        )}
      </div>
      <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-3 shrink-0 print:hidden">
        <div className="text-xs text-slate-500 font-semibold">
          {loading && total === 0 ? (
            <span>
              Showing <span className="inline-block w-6 h-3 bg-slate-200 animate-pulse rounded align-middle" />–<span className="inline-block w-6 h-3 bg-slate-200 animate-pulse rounded align-middle" /> of <span className="inline-block w-8 h-3 bg-slate-200 animate-pulse rounded align-middle" />
            </span>
          ) : (
            <span>
              Showing <span className="text-slate-900 font-bold">{from}</span>–<span className="text-slate-900 font-bold">{to}</span> of <span className="text-slate-900 font-bold">{total}</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(safePage - 1)}
            disabled={safePage <= 1}
            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => onPageChange(safePage + 1)}
            disabled={safePage >= totalPages}
            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
