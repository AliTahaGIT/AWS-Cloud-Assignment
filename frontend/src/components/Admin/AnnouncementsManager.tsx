import React, { useState, useEffect } from 'react';
import './AnnouncementsManager.css';
import API_ENDPOINTS from '../../config/api';
import useToast from '../../hooks/useToast';
import ToastContainer from '../Toast/ToastContainer';
import apiService from '../../services/api';

interface Announcement {
  announcement_id: string;
  title: string;
  content: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
}

interface AnnouncementFormData {
  title: string;
  content: string;
  is_active: boolean;
}

const AnnouncementsManager: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [formData, setFormData] = useState<AnnouncementFormData>({
    title: '',
    content: '',
    is_active: true
  });
  const [activeOnly, setActiveOnly] = useState(true);
  const { toasts, removeToast, showSuccess, showError } = useToast();

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const url = `${API_ENDPOINTS.ADMIN_ANNOUNCEMENTS}?active_only=${activeOnly}`;
      
      const data = await apiService.get<any>(url);
      setAnnouncements(data.announcements || []);
    } catch (error) {
      showError('Error', 'Failed to fetch announcements');
    } finally {
      setLoading(false);
    }
  };

  const createAnnouncement = async () => {
    try {
      await apiService.post<any>(API_ENDPOINTS.ADMIN_ANNOUNCEMENTS, formData);

      showSuccess('Announcement Created', 'Global announcement has been created successfully.');
      await fetchAnnouncements();
      setShowCreateModal(false);
      resetForm();
    } catch (error) {
      showError('Network Error', 'Unable to connect to server.');
    }
  };

  const updateAnnouncement = async () => {
    if (!editingAnnouncement) return;

    try {
      await apiService.put<any>(
        `${API_ENDPOINTS.ADMIN_ANNOUNCEMENTS}/${editingAnnouncement.announcement_id}`,
        formData
      );

      showSuccess('Success', 'Announcement updated successfully');
      await fetchAnnouncements();
      setEditingAnnouncement(null);
      resetForm();
    } catch (error) {
      showError('Network Error', 'Unable to update announcement');
    }
  };

  const deleteAnnouncement = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;

    try {
      await apiService.delete(`${API_ENDPOINTS.ADMIN_ANNOUNCEMENTS}/${id}`);

      showSuccess('Success', 'Announcement deleted successfully');
      await fetchAnnouncements();
    } catch (error) {
      showError('Network Error', 'Unable to delete announcement');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      is_active: true
    });
  };

  const openEditModal = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      is_active: announcement.is_active
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [activeOnly]);

  return (
    <div className="announcements-manager">
      <div className="manager-header">
        <h1>Announcements</h1>
        <p>Manage site announcements</p>
      </div>

      <div className="manager-actions">
        <button 
          className="btn btn-primary btn-large"
          onClick={() => setShowCreateModal(true)}
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
          </svg>
          Create New Announcement
        </button>

        <div className="filter-toggle">
          <label>
            <input
              type="checkbox"
              checked={activeOnly}
              onChange={(e) => setActiveOnly(e.target.checked)}
            />
            Show active only
          </label>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading announcements...</p>
        </div>
      ) : (
        <div className="announcements-grid">
          {announcements.map((announcement) => (
            <div 
              key={announcement.announcement_id} 
              className={`announcement-card ${!announcement.is_active ? 'inactive' : ''}`}
            >
              <div className="card-header">
                <div className="announcement-info">
                  <h3>{announcement.title}</h3>
                  <div className="announcement-badges">
                    {!announcement.is_active && (
                      <span className="status-badge inactive">INACTIVE</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="announcement-content">
                <p>{announcement.content}</p>
              </div>

              <div className="announcement-meta">
                <span className="created-date">
                  Created: {formatDate(announcement.created_at)}
                </span>
              </div>

              <div className="card-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => openEditModal(announcement)}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                  </svg>
                  Edit
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => deleteAnnouncement(announcement.announcement_id)}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                  </svg>
                  Delete
                </button>
              </div>
            </div>
          ))}

          {announcements.length === 0 && (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 18h10v-2H7v2zm0-4h10v-2H7v2zm0-4h10V8H7v2zM4 6v14h16V6H4zm0-2h16c1.1 0 2 .9 2 2v14c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              </svg>
              <h3>No announcements</h3>
              <p>Create an announcement to get started</p>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit  */}
      {(showCreateModal || editingAnnouncement) && (
        <div className="modal-overlay" onClick={() => {
          setShowCreateModal(false);
          setEditingAnnouncement(null);
          resetForm();
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingAnnouncement ? 'Edit Announcement' : 'Create New Announcement'}</h2>
              <button
                className="modal-close"
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingAnnouncement(null);
                  resetForm();
                }}
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>
            </div>

            <form className="announcement-form" onSubmit={(e) => {
              e.preventDefault();
              editingAnnouncement ? updateAnnouncement() : createAnnouncement();
            }}>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="form-input"
                  required
                  placeholder="Enter announcement title"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Content *</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  className="form-textarea"
                  required
                  placeholder="Enter announcement content"
                  rows={4}
                />
              </div>

              <div className="form-group">
                <label className="form-label checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  />
                  Active (Show on main page)
                </label>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingAnnouncement(null);
                    resetForm();
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingAnnouncement ? 'Update Announcement' : 'Create Announcement'}
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

export default AnnouncementsManager;