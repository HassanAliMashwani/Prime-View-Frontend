'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DocumentsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/society-members/dashboard');
  }, [router]);

  return (
    <div className="flex-1 flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="w-8 h-8 border-2 border-[#43612B]/20 border-t-[#43612B] rounded-full animate-spin" />
        <p className="text-xs text-[#6B7462]">Redirecting to dashboard...</p>
      </div>
    </div>
  );
}

