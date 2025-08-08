const TOKEN_KEY = 'auth_token';
const ADMIN_NAME_KEY = 'admin_name';
const USER_ID_KEY = 'user_id';

export interface AuthTokenData {
  token: string;
  expires_in: number;
  token_type: string;
}

export const authUtils = {
  saveToken: (tokenData: AuthTokenData) => {
    localStorage.setItem(TOKEN_KEY, tokenData.token);
    const expirationTime = Date.now() + (tokenData.expires_in * 1000);
    localStorage.setItem('token_expiration', expirationTime.toString());
  },

  getToken: (): string | null => {
    const token = localStorage.getItem(TOKEN_KEY);
    const expiration = localStorage.getItem('token_expiration');
    
    if (token && expiration) {
      const expirationTime = parseInt(expiration);
      if (Date.now() > expirationTime) {
        authUtils.clearAuth();
        return null;
      }
    }
    
    return token;
  },

  saveAdminInfo: (username: string, userId: string) => {
    localStorage.setItem(ADMIN_NAME_KEY, username);
    localStorage.setItem(USER_ID_KEY, userId);
  },

  getAdminName: (): string | null => {
    return localStorage.getItem(ADMIN_NAME_KEY);
  },

  getUserId: (): string | null => {
    return localStorage.getItem(USER_ID_KEY);
  },

  isAuthenticated: (): boolean => {
    return authUtils.getToken() !== null;
  },

  clearAuth: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('token_expiration');
    localStorage.removeItem(ADMIN_NAME_KEY);
    localStorage.removeItem(USER_ID_KEY);
  },

  getAuthHeader: (): { Authorization: string } | {} => {
    const token = authUtils.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
};

export default authUtils;