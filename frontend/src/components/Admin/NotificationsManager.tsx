// Flood Notifications Manager Component
// Author: TP070572
import React, { useState, useEffect } from 'react';
import './NotificationsManager.css';
import useToast from '../../hooks/useToast';
import ToastContainer from '../Toast/ToastContainer';

interface FloodNotification {
  notification_id: string;
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  affected_regions: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface NotificationFormData {
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  affected_regions: string[];
  is_active: boolean;
}

const NotificationsManager: React.FC = () => {
  const [notifications, setNotifications] = useState<FloodNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingNotification, setEditingNotification] = useState<FloodNotification | null>(null);
  const [formData, setFormData] = useState<NotificationFormData>({
    title: '',
    message: '',
    severity: 'medium',
    affected_regions: [],
    is_active: true
  });
  const [filterSeverity, setFilterSeverity] = useState<string>('');
  const [filterRegion, setFilterRegion] = useState<string>('');
  const [adminKey] = useState(localStorage.getItem('admin_key') || '');
  const { toasts, removeToast, showSuccess, showError } = useToast();

  const regions = [
    'Johor', 'Kedah', 'Kelantan', 'Kuala Lumpur', 'Labuan', 'Malacca', 'Negeri Sembilan', 
    'Pahang', 'Penang', 'Perak', 'Perlis', 'Putrajaya', 'Sabah', 'Sarawak', 'Selangor', 'Terengganu'
  ];
  const severityLevels = ['low', 'medium', 'high', 'critical'];

  const fetchNotifications = async () => {
    if (!adminKey) {
      console.error('No admin key found');
      return;
    }

    try {
      setLoading(true);
      let url = `http://localhost:8000/admin/notifications?admin_key=${adminKey}`;
      
      if (filterSeverity) {
        url += `&severity=${filterSeverity}`;
      }
      if (filterRegion) {
        url += `&region=${filterRegion}`;
      }

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
      } else if (response.status === 403) {
        console.error('Admin session expired or invalid');
        // Redirect to login page
        window.location.href = '/admin-login';
      } else {
        console.error('Error fetching notifications:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const createNotification = async () => {
    if (!adminKey) {
      console.error('No admin key found');
      return;
    }

    try {
      console.log('Creating notification with data:', formData);
      const response = await fetch(`http://localhost:8000/admin/notifications?admin_key=${adminKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        console.log('Notification created successfully');
        showSuccess('Notification Created', 'Flood notification has been created and published successfully.');
        await fetchNotifications();
        setShowCreateModal(false);
        resetForm();
      } else {
        const errorData = await response.json();
        console.error('Error creating notification:', response.status, errorData);
        showError('Creation Failed', errorData.detail || 'Unable to create notification. Please try again.');
      }
    } catch (error) {
      console.error('Error creating notification:', error);
      showError('Network Error', 'Unable to connect to the server. Please check your connection and try again.');
    }
  };

  const updateNotification = async () => {
    if (!editingNotification) return;

    try {
      const response = await fetch(
        `http://localhost:8000/admin/notifications/${editingNotification.notification_id}?admin_key=${adminKey}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        }
      );

      if (response.ok) {
        await fetchNotifications();
        setEditingNotification(null);
        resetForm();
      }
    } catch (error) {
      console.error('Error updating notification:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    if (!confirm('Are you sure you want to delete this notification?')) return;

    try {
      const response = await fetch(
        `http://localhost:8000/admin/notifications/${id}?admin_key=${adminKey}`,
        {
          method: 'DELETE',
        }
      );

      if (response.ok) {
        await fetchNotifications();
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      message: '',
      severity: 'medium',
      affected_regions: [],
      is_active: true
    });
  };

  const openEditModal = (notification: FloodNotification) => {
    setEditingNotification(notification);
    setFormData({
      title: notification.title,
      message: notification.message,
      severity: notification.severity,
      affected_regions: notification.affected_regions,
      is_active: notification.is_active
    });
  };

  const handleRegionToggle = (region: string) => {
    setFormData(prev => ({
      ...prev,
      affected_regions: prev.affected_regions.includes(region)
        ? prev.affected_regions.filter(r => r !== region)
        : [...prev.affected_regions, region]
    }));
  };

  useEffect(() => {
    fetchNotifications();
  }, [filterSeverity, filterRegion]);

  return (
    <div className="notifications-manager">
      <div className="manager-header">
        <h1>Flood Alerts</h1>
        <p>Manage flood notifications</p>
      </div>

      <div className="manager-actions">
        <button 
          className="btn btn-primary btn-large"
          onClick={() => setShowCreateModal(true)}
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
          </svg>
          Create New Notification
        </button>

        <div className="filters">
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="form-select"
          >
            <option value="">All Severities</option>
            {severityLevels.map(level => (
              <option key={level} value={level}>
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </option>
            ))}
          </select>

          <select
            value={filterRegion}
            onChange={(e) => setFilterRegion(e.target.value)}
            className="form-select"
          >
            <option value="">All Regions</option>
            {regions.map(region => (
              <option key={region} value={region}>
                {region.charAt(0).toUpperCase() + region.slice(1)}
              </option>
            ))}
          </select>

          <button 
            className="btn btn-secondary"
            onClick={() => {
              setFilterSeverity('');
              setFilterRegion('');
            }}
          >
            Clear
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading notifications...</p>
        </div>
      ) : (
        <div className="notifications-grid">
          {notifications.map((notification) => (
            <div 
              key={notification.notification_id} 
              className={`notification-card ${notification.severity} ${!notification.is_active ? 'inactive' : ''}`}
            >
              <div className="card-header">
                <h3>{notification.title}</h3>
                <div className="card-badges">
                  <span className={`severity-badge ${notification.severity}`}>
                    {notification.severity.toUpperCase()}
                  </span>
                  {!notification.is_active && (
                    <span className="status-badge inactive">INACTIVE</span>
                  )}
                </div>
              </div>

              <p className="notification-message">{notification.message}</p>

              <div className="notification-regions">
                <strong>Affected Regions:</strong>
                <div className="region-tags">
                  {notification.affected_regions.map(region => (
                    <span key={region} className="region-tag">
                      {region}
                    </span>
                  ))}
                </div>
              </div>

              <div className="notification-meta">
                <span className="created-date">
                  Created: {new Date(notification.created_at).toLocaleDateString()}
                </span>
                <span className="updated-date">
                  Updated: {new Date(notification.updated_at).toLocaleDateString()}
                </span>
              </div>

              <div className="card-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => openEditModal(notification)}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                  </svg>
                  Edit
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => deleteNotification(notification.notification_id)}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                  </svg>
                  Delete
                </button>
              </div>
            </div>
          ))}

          {notifications.length === 0 && (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
              </svg>
              <h3>No notifications found</h3>
              <p>Create your first flood notification to get started</p>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || editingNotification) && (
        <div className="modal-overlay" onClick={() => {
          setShowCreateModal(false);
          setEditingNotification(null);
          resetForm();
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingNotification ? 'Edit Notification' : 'Create New Notification'}</h2>
              <button
                className="modal-close"
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingNotification(null);
                  resetForm();
                }}
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>
            </div>

            <form className="notification-form" onSubmit={(e) => {
              e.preventDefault();
              editingNotification ? updateNotification() : createNotification();
            }}>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="form-input"
                  required
                  placeholder="Enter notification title"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Message *</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  className="form-textarea"
                  required
                  placeholder="Enter detailed notification message"
                  rows={4}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Severity Level *</label>
                  <select
                    value={formData.severity}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      severity: e.target.value as 'low' | 'medium' | 'high' | 'critical'
                    }))}
                    className="form-select"
                    required
                  >
                    {severityLevels.map(level => (
                      <option key={level} value={level}>
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                    />
                    Active Notification
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Affected Regions *</label>
                <div className="region-checkboxes">
                  {regions.map(region => (
                    <label key={region} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.affected_regions.includes(region)}
                        onChange={() => handleRegionToggle(region)}
                      />
                      {region.charAt(0).toUpperCase() + region.slice(1)}
                    </label>
                  ))}
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingNotification(null);
                    resetForm();
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingNotification ? 'Update Notification' : 'Create Notification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </div>
  );
};

export default NotificationsManager;