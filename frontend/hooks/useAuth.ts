'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export interface AuthState {
  token: string | null;
  userName: string;
  roleName: string;
  userPermissions: string[];
  isLoading: boolean;
}

export function useAuth(): AuthState & {
  hasPermission: (key: string) => boolean;
  getToken: () => string | null;
  handleForceLogout: (message: string) => void;
  handleLogout: () => void;
} {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [roleName, setRoleName] = useState('');
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const getToken = useCallback(() => {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  }, []);

  const handleForceLogout = useCallback((message: string) => {
    alert(`⚠️ ${message}`);
    localStorage.clear();
    sessionStorage.clear();
    router.push('/login');
  }, [router]);

  const handleLogout = useCallback(() => {
    if (confirm('คุณต้องการออกจากระบบใช่หรือไม่?')) {
      localStorage.clear();
      sessionStorage.clear();
      router.push('/login');
    }
  }, [router]);

  const hasPermission = useCallback((key: string) => {
    const roleLower = (roleName || '').toLowerCase();
    if (roleLower.includes('admin') || roleLower.includes('ผู้ดูแลระบบ')) return true;
    return userPermissions.includes(key);
  }, [roleName, userPermissions]);

  useEffect(() => {
    const t = getToken();
    if (!t) {
      router.push('/login');
      return;
    }
    setToken(t);
    setUserName(localStorage.getItem('userName') || sessionStorage.getItem('userName') || '');
    setRoleName(localStorage.getItem('roleName') || sessionStorage.getItem('roleName') || '');
    const permsString = localStorage.getItem('permissions') || sessionStorage.getItem('permissions') || '[]';
    setUserPermissions(JSON.parse(permsString));
    setIsLoading(false);
  }, [router, getToken]);

  return {
    token,
    userName,
    roleName,
    userPermissions,
    isLoading,
    hasPermission,
    getToken,
    handleForceLogout,
    handleLogout,
  };
}
