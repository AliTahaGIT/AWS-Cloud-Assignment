/*
 * Admin Dashboard Component
 * Author: Amir (TP070572)
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminDash.css';
import NotificationsManager from '../../components/Admin/NotificationsManager';
import ContactsManager from '../../components/Admin/ContactsManager';

interface DashboardStats {
  total_users: number;
  total_posts: number;
  total_requests: number;
  active_notifications: number;
  emergency_contacts: number;
}

interface FloodNotification {
  notification_id: string;
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  affected_regions: string[];
  is_active: boolean;
  created_at: string;
}

const AdminDash: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'notifications' | 'contacts'>('dashboard');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [notifications, setNotifications] = useState<FloodNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [adminKey, setAdminKey] = useState<string>('');
  const [adminName, setAdminName] = useState<string>('');

  useEffect(() => {
    const storedAdminKey = localStorage.getItem('admin_key');
    const storedAdminName = localStorage.getItem('admin_name');
    
    if (!storedAdminKey) {
      navigate('/admin-login');
      return;
    }
    
    setAdminKey(storedAdminKey);
    setAdminName(storedAdminName || 'Admin');
    
    // Fetch data only after authentication is verified
    fetchDashboardStats(storedAdminKey);
    fetchNotifications(storedAdminKey);
  }, [navigate]);

  const fetchDashboardStats = async (key: string) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8000/admin/dashboard/stats?admin_key=${key}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data.dashboard_stats);
      } else if (response.status === 403) {
        // Session expired, redirect to login
        localStorage.removeItem('admin_key');
        localStorage.removeItem('admin_name');
        navigate('/admin-login');
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async (key: string) => {
    try {
      const response = await fetch(`http://localhost:8000/admin/notifications?admin_key=${key}`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
      } else if (response.status === 403) {
        // Session expired, redirect to login
        localStorage.removeItem('admin_key');
        localStorage.removeItem('admin_name');
        navigate('/admin-login');
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_key');
    localStorage.removeItem('admin_name');
    navigate('/admin-login');
  };

  const renderDashboard = () => (
    <div className="dashboard-content">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <p>Monitor and manage the Cloud60 Flood Management System</p>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading dashboard data...</p>
        </div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-card users">
              <div className="stat-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="stat-content">
                <h3>Total Users</h3>
                <p className="stat-number">{stats?.total_users || 0}</p>
              </div>
            </div>

            <div className="stat-card posts">
              <div className="stat-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                </svg>
              </div>
              <div className="stat-content">
                <h3>Total Posts</h3>
                <p className="stat-number">{stats?.total_posts || 0}</p>
              </div>
            </div>

            <div className="stat-card requests">
              <div className="stat-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 6h-2.18c.11-.31.18-.65.18-1a2.996 2.996 0 00-5.5-1.65l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z" />
                </svg>
              </div>
              <div className="stat-content">
                <h3>Total Requests</h3>
                <p className="stat-number">{stats?.total_requests || 0}</p>
              </div>
            </div>

            <div className="stat-card notifications">
              <div className="stat-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
                </svg>
              </div>
              <div className="stat-content">
                <h3>Active Notifications</h3>
                <p className="stat-number">{stats?.active_notifications || 0}</p>
              </div>
            </div>
          </div>

          <div className="recent-activity">
            <h2>Recent Flood Notifications</h2>
            <div className="notifications-list">
              {notifications.slice(0, 5).map((notification) => (
                <div key={notification.notification_id} className={`notification-item ${notification.severity}`}>
                  <div className="notification-header">
                    <h4>{notification.title}</h4>
                    <span className={`severity-badge ${notification.severity}`}>
                      {notification.severity.toUpperCase()}
                    </span>
                  </div>
                  <p className="notification-message">{notification.message}</p>
                  <div className="notification-footer">
                    <span className="regions">Regions: {notification.affected_regions.join(', ')}</span>
                    <span className="timestamp">{new Date(notification.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
              {notifications.length === 0 && (
                <p className="no-notifications">No notifications found</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="admin-dashboard">
      <nav className="admin-sidebar">
        <div className="admin-brand">
          <h2>Cloud60 Admin</h2>
          <p>Welcome, {adminName}</p>
        </div>
        
        <ul className="admin-nav">
          <li>
            <button
              className={activeTab === 'dashboard' ? 'active' : ''}
              onClick={() => setActiveTab('dashboard')}
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
              </svg>
              Dashboard
            </button>
          </li>
          <li>
            <button
              className={activeTab === 'notifications' ? 'active' : ''}
              onClick={() => setActiveTab('notifications')}
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
              </svg>
              Flood Notifications
            </button>
          </li>
          <li>
            <button
              className={activeTab === 'contacts' ? 'active' : ''}
              onClick={() => setActiveTab('contacts')}
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
              </svg>
              Emergency Contacts
            </button>
          </li>
        </ul>

        <div className="admin-footer">
          <button className="logout-btn btn btn-secondary" onClick={handleLogout}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.59L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
            </svg>
            Logout
          </button>
        </div>
      </nav>

      <main className="admin-main">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'notifications' && <NotificationsManager />}
        {activeTab === 'contacts' && <ContactsManager />}
      </main>
    </div>
  );
};

export default AdminDash;