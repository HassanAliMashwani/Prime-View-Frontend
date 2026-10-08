'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';

export const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/society-members/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Send the user to login only when the browser has checked and there is no session
  if (!isLoading && !isAuthenticated) {
    return null;
  }

  // Draw the real sidebar labels on that first paint
  return <>{children}</>;
};
