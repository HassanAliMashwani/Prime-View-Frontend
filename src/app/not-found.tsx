import React from "react";
import Link from "next/link";
import { ArrowLeft, Home, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-16 bg-[#F8F7F5]">
      <div className="max-w-xl w-full text-center space-y-8 bg-white p-8 sm:p-12 rounded-3xl border border-black/[0.08] shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
        <div className="w-16 h-16 rounded-2xl bg-[#EAF0E7] text-[#43612B] flex items-center justify-center mx-auto">
          <Compass className="w-8 h-8 animate-pulse" />
        </div>

        <div className="space-y-3">
          <p className="text-xs uppercase tracking-widest font-bold text-[#43612B]">Error 404</p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#151914] tracking-tight">
            Page Not Found
          </h1>
          <p className="text-sm text-[#6B7462] leading-relaxed max-w-md mx-auto">
            The society page or plot resource you are looking for does not exist or has been relocated within the Prime View master plan.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#43612B] hover:bg-[#344D22] text-white text-sm font-semibold rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Return to Home</span>
          </Link>
          <Link
            href="/contact"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-[#F2F1ED] text-[#151914] border border-black/[0.12] text-sm font-semibold rounded-xl transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Contact Office</span>
          </Link>
        </div>

        <div className="pt-6 border-t border-black/[0.06] text-xs text-[#6B7462]">
          Prime View Cooperative Housing Society • Supply Road, Abbottabad, Pakistan
        </div>
      </div>
    </div>
  );
}
