import { useAuthStore } from '../store/authStore';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface RequestOptions extends RequestInit {
  params?: Record<string, any>;
}

class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

async function performRefresh(): Promise<string> {
  const store = useAuthStore.getState();
  const refreshToken = store.refreshToken;

  if (!refreshToken) {
    store.clearAuth();
    throw new Error('No refresh token available');
  }

  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    store.clearAuth();
    throw new Error('Refresh token expired or invalid');
  }

  const data = await response.json();
  if (data.accessToken) {
    store.setAccessToken(data.accessToken);
    return data.accessToken;
  }

  throw new Error('Invalid refresh response');
}

export async function request(path: string, options: RequestOptions = {}): Promise<any> {
  const { params, headers, ...restOptions } = options;

  // Construct URL with query parameters
  let url = `${API_BASE_URL}${path}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        searchParams.append(key, String(val));
      }
    });
    const queryStr = searchParams.toString();
    if (queryStr) {
      url += `?${queryStr}`;
    }
  }

  // Get current access token
  const { accessToken, clearAuth } = useAuthStore.getState();

  const defaultHeaders: Record<string, string> = {};
  // Don't set Content-Type for FormData — the browser sets multipart boundary automatically
  if (!(options.body instanceof FormData)) {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  if (accessToken) {
    defaultHeaders['Authorization'] = `Bearer ${accessToken}`;
  }

  const mergedHeaders = {
    ...defaultHeaders,
    ...headers,
  };

  // Remove Content-Type header if FormData (browser sets it with boundary)
  if (options.body instanceof FormData) {
    delete (mergedHeaders as any)['Content-Type'];
  }

  const config: RequestInit = {
    ...restOptions,
    headers: mergedHeaders,
    credentials: 'include',
  };

  try {
    const response = await fetch(url, config);

    // Handle token refresh on 401 Unauthorized
    if (response.status === 401 && accessToken) {
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const newAccessToken = await performRefresh();
          isRefreshing = false;
          onRefreshed(newAccessToken);
        } catch (refreshErr) {
          isRefreshing = false;
          clearAuth();
          throw new ApiError('Session expired. Please log in again.', 401, null);
        }
      }

      // Queue the current request to retry after refresh completes
      return new Promise((resolve, reject) => {
        subscribeTokenRefresh(async (newToken) => {
          try {
            const retryHeaders = {
              ...mergedHeaders,
              'Authorization': `Bearer ${newToken}`,
            };
            const retryResponse = await fetch(url, { ...config, headers: retryHeaders });
            if (!retryResponse.ok) {
              const errData = await retryResponse.json().catch(() => ({}));
              reject(new ApiError(errData.message || 'API request failed after refresh', retryResponse.status, errData));
            } else {
              const contentType = retryResponse.headers.get('content-type');
              if (contentType && contentType.includes('application/json')) {
                resolve(await retryResponse.json());
              } else {
                resolve(retryResponse);
              }
            }
          } catch (err) {
            reject(err);
          }
        });
      });
    }

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new ApiError(errData.message || 'API request failed', response.status, errData);
    }

    // Check if the response is JSON, otherwise return blob or text
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }

    // For downloads like PDF/Excel
    return response;
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError((err as Error).message || 'Network error', 500, null);
  }
}

export const api = {
  get: (path: string, params?: Record<string, any>, options?: RequestOptions) =>
    request(path, { ...options, method: 'GET', params }),
  post: (path: string, body?: any, options?: RequestOptions) =>
    request(path, { ...options, method: 'POST', body: body instanceof FormData ? body : JSON.stringify(body) }),
  put: (path: string, body?: any, options?: RequestOptions) =>
    request(path, { ...options, method: 'PUT', body: body instanceof FormData ? body : JSON.stringify(body) }),
  patch: (path: string, body?: any, options?: RequestOptions) =>
    request(path, { ...options, method: 'PATCH', body: body instanceof FormData ? body : JSON.stringify(body) }),
  delete: (path: string, options?: RequestOptions) =>
    request(path, { ...options, method: 'DELETE' }),
};
