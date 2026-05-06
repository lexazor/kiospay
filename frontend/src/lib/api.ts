import { APP_CONFIG } from './config';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

interface RequestOptions extends RequestInit {
  skipJson?: boolean;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(`${APP_CONFIG.backendUrl}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    let message = 'Terjadi kesalahan pada server.';
    try {
      const payload = await response.json();
      if (payload?.message) {
        message = Array.isArray(payload.message)
          ? payload.message[0]
          : payload.message;
      }
    } catch {
      // ignore
    }

    throw new ApiError(message, response.status);
  }

  if (options.skipJson) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(path: string) =>
    request<T>(path, {
      method: 'DELETE',
    }),
  upload: async <T>(path: string, formData: FormData) => {
    const response = await fetch(`${APP_CONFIG.backendUrl}${path}`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      throw new ApiError(payload?.message ?? 'Upload gagal.', response.status);
    }

    return (await response.json()) as T;
  },
};