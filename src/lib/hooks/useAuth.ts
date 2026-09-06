'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { MemberSession } from '../mock/types';
import { login as dalLogin, logout as dalLogout, getActiveSession, LoginResult } from '../dal/auth';
import { useMemberStore } from '../store/useMemberStore';

export function useAuth() {
  const [session, setSession] = useState<MemberSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const resetMemberStore = useMemberStore((state) => state.reset);

  const checkSession = useCallback(() => {
    const current = getActiveSession();
    setSession(current);
    setIsLoading(false);
    return current;
  }, []);

  useEffect(() => {
    checkSession();

    // Listen to storage events from other tabs
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'prime_view_member_session') {
        checkSession();
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [checkSession]);

  const login = async (identifier: string, pass: string): Promise<LoginResult> => {
    const result = await dalLogin(identifier, pass);
    if (result.ok && result.session) {
      setSession(result.session);
    }
    return result;
  };

  const logout = async () => {
    await dalLogout();
    setSession(null);
    resetMemberStore();
    router.push('/society-members/login');
  };

  return {
    session,
    currentUser: session,
    isAuthenticated: !!session && session.role === 'customer',
    isLoading,
    login,
    logout,
    checkSession,
  };
}
