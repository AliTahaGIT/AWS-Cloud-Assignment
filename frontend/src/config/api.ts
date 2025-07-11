const API_BASE_URL = 'http://3.239.220.23:8000';

export const API_ENDPOINTS = {
  BASE_URL: API_BASE_URL,
  
  LOGIN: `${API_BASE_URL}/login`,
  REGISTER: `${API_BASE_URL}/register`,
  
  ADMIN_LOGIN: `${API_BASE_URL}/admin/admin-login`,
  ADMIN_DASHBOARD: `${API_BASE_URL}/admin/dashboard/stats`,
  ADMIN_USERS: `${API_BASE_URL}/admin/users/all`,
  ADMIN_REQUESTS: `${API_BASE_URL}/admin/requests/all`,
  ADMIN_NOTIFICATIONS: `${API_BASE_URL}/admin/notifications`,
  ADMIN_ANNOUNCEMENTS: `${API_BASE_URL}/admin/announcements`,
  
  POSTS: `${API_BASE_URL}/posts`,
  
  USER_REQUESTS: `${API_BASE_URL}/user-requests`,
  UPDATE_USER_PROFILE: `${API_BASE_URL}/update-user-profile`,
  
  SUBMIT_REQUEST: `${API_BASE_URL}/submit-request`,
  CREATE_POST: `${API_BASE_URL}/create-post`,
  ORG_POSTS: `${API_BASE_URL}/org-posts`,
  UPDATE_POST: `${API_BASE_URL}/update-post`,
  DELETE_POST: `${API_BASE_URL}/delete-post`,
  PUBLIC_NOTIFICATIONS: `${API_BASE_URL}/admin/public/notifications`,
  PUBLIC_ANNOUNCEMENTS: `${API_BASE_URL}/admin/public/announcements`,
};

export default API_ENDPOINTS;