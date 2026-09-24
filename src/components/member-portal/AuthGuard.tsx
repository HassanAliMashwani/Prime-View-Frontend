'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { MemberAuthGuardSkeleton } from '@/components/ui/skeleton';

export const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/society-members/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return <MemberAuthGuardSkeleton />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};
