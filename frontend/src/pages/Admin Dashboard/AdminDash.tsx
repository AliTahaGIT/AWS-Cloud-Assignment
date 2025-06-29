// TP070572
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminDash.css';
import API_ENDPOINTS from '../../config/api';
import NotificationsManager from '../../components/Admin/NotificationsManager';
import UserManagement from '../../components/Admin/UserManagement';
import RequestManagement from '../../components/Admin/RequestManagement';
import AnnouncementsManager from '../../components/Admin/AnnouncementsManager';

interface DashboardStats {
  total_users: number;
  total_posts: number;
  total_requests: number;
  active_notifications: number;
}

const AdminDash: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'notifications' | 'users' | 'requests' | 'announcements'>('dashboard');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [adminName, setAdminName] = useState<string>('');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  useEffect(() => {
    const storedAdminKey = localStorage.getItem('admin_key');
    const storedAdminName = localStorage.getItem('admin_name');
    
    if (!storedAdminKey) {
      navigate('/admin-login');
      return;
    }
    
    setAdminName(storedAdminName || 'Admin');
    
    fetchDashboardStats(storedAdminKey);
  }, [navigate]);

  const fetchDashboardStats = async (key: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_ENDPOINTS.ADMIN_DASHBOARD}?admin_key=${key}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data.dashboard_stats);
      } else if (response.status === 403) {
        localStorage.removeItem('admin_key');
        localStorage.removeItem('admin_name');
        navigate('/admin-login');
      }
    } catch (error) {
      console.error('Stats fetch failed:', error);
    }
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_key');
    localStorage.removeItem('admin_name');
    navigate('/admin-login');
  };

  const toggleMobileNav = () => {
    setIsMobileNavOpen(!isMobileNavOpen);
  };

  const closeMobileNav = () => {
    setIsMobileNavOpen(false);
  };

  const handleTabChange = (tab: 'dashboard' | 'notifications' | 'users' | 'requests' | 'announcements') => {
    setActiveTab(tab);
    closeMobileNav();
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
          <p>Loading...</p>
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

        </>
      )}
    </div>
  );

  return (
    <div className="admin-dashboard">
      <button className="mobile-nav-toggle" onClick={toggleMobileNav}>
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
        </svg>
      </button>

      {isMobileNavOpen && (
        <div className="mobile-nav-overlay show" onClick={closeMobileNav}></div>
      )}

      <nav className={`admin-sidebar ${isMobileNavOpen ? 'mobile-open' : ''}`}>
        <div className="admin-brand">
          <h2>Admin</h2>
          <p>Welcome, {adminName}</p>
        </div>
        
        <ul className="admin-nav">
          <li>
            <button
              className={activeTab === 'dashboard' ? 'active' : ''}
              onClick={() => handleTabChange('dashboard')}
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
              onClick={() => handleTabChange('notifications')}
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
              </svg>
              Flood Notifications
            </button>
          </li>
          <li>
            <button
              className={activeTab === 'users' ? 'active' : ''}
              onClick={() => handleTabChange('users')}
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
              </svg>
              User Management
            </button>
          </li>
          <li>
            <button
              className={activeTab === 'requests' ? 'active' : ''}
              onClick={() => handleTabChange('requests')}
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 6h-2.18c.11-.31.18-.65.18-1a2.996 2.996 0 00-5.5-1.65l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z" />
              </svg>
              Request Management
            </button>
          </li>
          <li>
            <button
              className={activeTab === 'announcements' ? 'active' : ''}
              onClick={() => handleTabChange('announcements')}
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 18h10v-2H7v2zm0-4h10v-2H7v2zm0-4h10V8H7v2zM4 6v14h16V6H4zm0-2h16c1.1 0 2 .9 2 2v14c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              </svg>
              Announcements
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
        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'requests' && <RequestManagement />}
        {activeTab === 'announcements' && <AnnouncementsManager />}
      </main>
    </div>
  );
};

export default AdminDash;