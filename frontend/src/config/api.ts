const API_BASE_URL = 'https://zdi19xbgvh.execute-api.us-east-1.amazonaws.com'; // change the URL to the AWS API Gateway URL
// send the URL enpoint to the 'prod' stage, defualt stage doesn't work for some reason
export const API_ENDPOINTS = {
  BASE_URL: API_BASE_URL,
  
  LOGIN: `${API_BASE_URL}/prod/login`,
  REGISTER: `${API_BASE_URL}/prod/register`,
  
  ADMIN_LOGIN: `${API_BASE_URL}/admin/admin-login`,
  ADMIN_DASHBOARD: `${API_BASE_URL}/admin/dashboard/stats`,
  ADMIN_USERS: `${API_BASE_URL}/admin/users/all`,
  ADMIN_REQUESTS: `${API_BASE_URL}/admin/requests/all`,
  ADMIN_NOTIFICATIONS: `${API_BASE_URL}/admin/notifications`,
  ADMIN_ANNOUNCEMENTS: `${API_BASE_URL}/admin/announcements`,
  PUBLIC_NOTIFICATIONS: `${API_BASE_URL}/admin/public/notifications`,
  PUBLIC_ANNOUNCEMENTS: `${API_BASE_URL}/admin/public/announcements`,
  
  
  USER_REQUESTS: `${API_BASE_URL}/user-requests`,
  UPDATE_USER_PROFILE: `${API_BASE_URL}/update-user-profile`,
  
  POSTS: `${API_BASE_URL}/prod/get_posts`,
  SUBMIT_REQUEST: `${API_BASE_URL}/prod/submit_request`,
  CREATE_POST: `${API_BASE_URL}/prod/create_post`,
  ORG_POSTS: `${API_BASE_URL}/prod/get_org_posts`,
  UPDATE_POST: `${API_BASE_URL}/prod/update_post`,
  DELETE_POST: `${API_BASE_URL}/prod/delete_post`,

  
};

export default API_ENDPOINTS;