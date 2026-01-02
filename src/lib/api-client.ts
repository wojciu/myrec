import { useAuthStore } from '@/store/auth';

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
  skipRefresh?: boolean;
}

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function subscribeTokenRefresh(callback: (token: string) => void) {
  refreshSubscribers.push(callback);
}

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
}

async function refreshToken(): Promise<string | null> {
  const refreshToken = useAuthStore.getState().refreshToken;

  if (!refreshToken) {
    return null;
  }

  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const { user, accessToken, refreshToken: newRefreshToken } = data;

    useAuthStore.getState().setAuth(user, accessToken, newRefreshToken);
    return accessToken;
  } catch {
    return null;
  }
}

export async function apiRequest<T = any>(
  url: string,
  options: RequestOptions = {}
): Promise<T> {
  const { skipAuth = false, skipRefresh = false, ...fetchOptions } = options;

  let token = useAuthStore.getState().accessToken;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string> || {}),
  };

  if (!skipAuth && token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response = await fetch(url, {
    ...fetchOptions,
    headers,
  });

  if (response.status === 401 && !skipAuth && !skipRefresh) {
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        subscribeTokenRefresh((newToken: string) => {
          apiRequest<T>(url, options)
            .then(resolve)
            .catch(reject);
        });
      });
    }

    isRefreshing = true;

    try {
      const newToken = await refreshToken();

      if (newToken) {
        onTokenRefreshed(newToken);

        response = await fetch(url, {
          ...fetchOptions,
          headers: {
            ...(fetchOptions.headers as Record<string, string> || {}),
            'Authorization': `Bearer ${newToken}`,
          },
        });
      } else {
        useAuthStore.getState().logout();
        window.dispatchEvent(new CustomEvent('auth-expired'));
        throw new Error('Session expired');
      }
    } finally {
      isRefreshing = false;
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || error.message || 'Request failed');
  }

  return response.json();
}

export const api = {
  get: <T = any>(url: string, options?: RequestOptions) =>
    apiRequest<T>(url, { ...options, method: 'GET' }),

  post: <T = any>(url: string, data?: any, options?: RequestOptions) =>
    apiRequest<T>(url, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    }),

  patch: <T = any>(url: string, data?: any, options?: RequestOptions) =>
    apiRequest<T>(url, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: <T = any>(url: string, options?: RequestOptions) =>
    apiRequest<T>(url, { ...options, method: 'DELETE' }),

  postForm: <T = any>(url: string, formData: FormData, options?: RequestOptions) => {
    const token = useAuthStore.getState().accessToken;
    const headers: Record<string, string> = {
      ...(options?.headers as Record<string, string> || {}),
    };

    if (!options?.skipAuth && token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return apiRequest<T>(url, {
      ...options,
      method: 'POST',
      headers,
      body: formData as any,
    });
  },
};
