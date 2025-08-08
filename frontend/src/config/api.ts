const API_BASE_URL = 'https://zdi19xbgvh.execute-api.us-east-1.amazonaws.com'; // change the URL to the AWS API Gateway URL
// send the URL enpoint to the 'prod' stage, defualt stage doesn't work for some reason
export const API_ENDPOINTS = {
  BASE_URL: API_BASE_URL,
  
  LOGIN: `${API_BASE_URL}/prod/login`,
  REGISTER: `${API_BASE_URL}/prod/register`,
  
  ADMIN_LOGIN: `${API_BASE_URL}/prod/admin/login`,
  ADMIN_DASHBOARD: `${API_BASE_URL}/prod/admin/dashboard/stats`,
  ADMIN_USERS: `${API_BASE_URL}/prod/admin/users`,
  ADMIN_REQUESTS: `${API_BASE_URL}/prod/admin/requests`,
  ADMIN_NOTIFICATIONS: `${API_BASE_URL}/prod/admin/notifications`,
  ADMIN_ANNOUNCEMENTS: `${API_BASE_URL}/prod/admin/announcements`,
  PUBLIC_NOTIFICATIONS: `${API_BASE_URL}/prod/notifications`,
  PUBLIC_ANNOUNCEMENTS: `${API_BASE_URL}/prod/public/announcements`,
  
  
  USER_REQUESTS: `${API_BASE_URL}/prod/get_user_requests`,
  UPDATE_USER_PROFILE: `${API_BASE_URL}/prod/update_user_profile`,
  
  POSTS: `${API_BASE_URL}/prod/get_posts`,
  SUBMIT_REQUEST: `${API_BASE_URL}/prod/submit_request`,
  CREATE_POST: `${API_BASE_URL}/prod/create_post`,
  ORG_POSTS: `${API_BASE_URL}/prod/get_org_posts`,
  UPDATE_POST: `${API_BASE_URL}/prod/update_post`,
  DELETE_POST: `${API_BASE_URL}/prod/delete_post`,

  
};

export default API_ENDPOINTS;