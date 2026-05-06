'use client';

import { useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { toast } from 'sonner';
import type { SessionUser } from '@/types/api';

interface AuthSession {
  user: SessionUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

export function useAuth(): AuthSession {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const payload = await api.get<SessionUser>('/auth/me');
      setUser(payload);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setUser(null);
      } else {
        toast.error('Gagal memuat sesi login.');
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await api.post('/auth/logout');
    setUser(null);
  };

  useEffect(() => {
    void refresh();
  }, []);

  return { user, loading, refresh, logout };
}