import authUtils from '../utils/auth';

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

class APIService {
  private async request<T>(url: string, options: RequestOptions = {}): Promise<T> {
    const { requiresAuth = true, ...fetchOptions } = options;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    };

    if (requiresAuth) {
      const authHeader = authUtils.getAuthHeader();
      Object.assign(headers, authHeader);
    }

    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    });

    if (response.status === 401) {
      authUtils.clearAuth();
      window.location.href = '/admin-login';
      throw new Error('Authentication expired');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(error.detail || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async get<T>(url: string, requiresAuth = true): Promise<T> {
    return this.request<T>(url, { method: 'GET', requiresAuth });
  }

  async post<T>(url: string, data?: any, requiresAuth = true): Promise<T> {
    return this.request<T>(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      requiresAuth,
    });
  }

  async put<T>(url: string, data?: any, requiresAuth = true): Promise<T> {
    return this.request<T>(url, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      requiresAuth,
    });
  }

  async delete<T>(url: string, requiresAuth = true): Promise<T> {
    return this.request<T>(url, { method: 'DELETE', requiresAuth });
  }

  async patch<T>(url: string, data?: any, requiresAuth = true): Promise<T> {
    return this.request<T>(url, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
      requiresAuth,
    });
  }
}

export const apiService = new APIService();
export default apiService;