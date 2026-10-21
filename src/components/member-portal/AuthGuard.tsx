'use client';

import React, { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';

const THIRTY_MINUTES_MS = 30 * 60 * 1000;

export const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const lastActivityRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/society-members/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // 30-minute idle timer & session expiry watcher
  useEffect(() => {
    if (!isAuthenticated) return;

    lastActivityRef.current = Date.now();

    const resetIdleTimer = () => {
      lastActivityRef.current = Date.now();
    };

    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    activityEvents.forEach((evt) => {
      window.addEventListener(evt, resetIdleTimer, { passive: true });
    });

    const checkInterval = setInterval(() => {
      const now = Date.now();
      const isIdle = now - lastActivityRef.current >= THIRTY_MINUTES_MS;
      const isExpired = session?.expiresAt ? now >= session.expiresAt : false;

      if (isIdle || isExpired) {
        clearInterval(checkInterval);
        logout();
      }
    }, 5000);

    return () => {
      clearInterval(checkInterval);
      activityEvents.forEach((evt) => {
        window.removeEventListener(evt, resetIdleTimer);
      });
    };
  }, [isAuthenticated, session?.expiresAt, logout]);

  // Send the user to login only when the browser has checked and there is no session
  if (!isLoading && !isAuthenticated) {
    return null;
  }

  // Draw the real sidebar labels on that first paint
  return <>{children}</>;
};
