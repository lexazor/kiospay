'use client';

import { api, ApiError } from '@/lib/api';

export async function tryRefreshToken() {
  try {
    await api.post('/auth/refresh-token');
    return true;
  } catch (error) {
    if (error instanceof ApiError) {
      return false;
    }

    return false;
  }
}