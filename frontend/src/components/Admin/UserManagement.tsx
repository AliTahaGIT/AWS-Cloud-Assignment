// User Management Component
// Author: TP070572
import React, { useState, useEffect } from 'react';
import './UserManagement.css';
import useToast from '../../hooks/useToast';
import ToastContainer from '../Toast/ToastContainer';

interface User {
  user_id: string;
  username: string;
  email: string;
  full_name?: string;
  role: string;
  is_banned?: boolean;
  created_at?: string;
  updated_at?: string;
}
const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showBanModal, setShowBanModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [editFormData, setEditFormData] = useState<Partial<User>>({});
  const [adminKey] = useState(localStorage.getItem('admin_key') || '');
  const { toasts, removeToast, showSuccess, showError } = useToast();

  const fetchUsers = async () => {
    if (!adminKey) return;

    try {
      setLoading(true);
      let url = `http://localhost:8000/admin/users/all?admin_key=${adminKey}`;
      
      if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;
      if (roleFilter) url += `&role=${roleFilter}`;

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      } else if (response.status === 403) {
        window.location.href = '/admin-login';
      } else {
        showError('Error', 'Failed to fetch users');
      }
    } catch (error) {
      showError('Network Error', 'Unable to connect to server');
    } finally {
      setLoading(false);
    }
  };


  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      const response = await fetch(
        `http://localhost:8000/admin/users/${selectedUser.user_id}?admin_key=${adminKey}`,
        {
          method: 'DELETE'
        }
      );

      if (response.ok) {
        showSuccess('Success', 'User deleted successfully');
        await fetchUsers();
        setShowBanModal(false);
        setSelectedUser(null);
      } else {
        const error = await response.json();
        showError('Error', error.detail || 'Failed to delete user');
      }
    } catch (error) {
      showError('Network Error', 'Unable to delete user');
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser || !newPassword) return;

    try {
      const response = await fetch(
        `http://localhost:8000/admin/users/${selectedUser.user_id}/reset-password?admin_key=${adminKey}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ new_password: newPassword })
        }
      );

      if (response.ok) {
        showSuccess('Success', 'Password reset successfully');
        setShowPasswordModal(false);
        setNewPassword('');
        setSelectedUser(null);
      } else {
        const error = await response.json();
        showError('Error', error.detail || 'Failed to reset password');
      }
    } catch (error) {
      showError('Network Error', 'Unable to reset password');
    }
  };

  const handleUpdateProfile = async () => {
    if (!selectedUser) return;

    try {
      const response = await fetch(
        `http://localhost:8000/admin/users/${selectedUser.user_id}/profile?admin_key=${adminKey}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editFormData)
        }
      );

      if (response.ok) {
        showSuccess('Success', 'User profile updated successfully');
        await fetchUsers();
        setShowEditModal(false);
        setEditFormData({});
        setSelectedUser(null);
      } else {
        const error = await response.json();
        showError('Error', error.detail || 'Failed to update profile');
      }
    } catch (error) {
      showError('Network Error', 'Unable to update profile');
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setEditFormData({
      username: user.username,
      email: user.email
    });
    setShowEditModal(true);
  };

  useEffect(() => {
    fetchUsers();
  }, [searchTerm, roleFilter]);

  return (
    <div className="user-management">
      <div className="management-header">
        <h1>User Management</h1>
        <p>Manage all registered users and their accounts</p>
      </div>

      <div className="management-controls">
        <div className="search-section">
          <input
            type="text"
            placeholder="Search by name, email, or username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filters-section">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">All Roles</option>
            <option value="user">Users</option>
            <option value="expert">Experts</option>
            <option value="admin">Admins</option>
          </select>

          <button 
            className="btn btn-secondary"
            onClick={() => {
              setSearchTerm('');
              setRoleFilter('');
            }}
          >
            Clear Filters
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading users...</p>
        </div>
      ) : (
        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Username</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.user_id} className={user.is_banned ? 'banned-row' : ''}>
                  <td>{user.full_name || user.username}</td>
                  <td>{user.email}</td>
                  <td>{user.username}</td>
                  <td>
                    <span className={`role-badge ${user.role}`}>
                      {user.role.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    {user.is_banned ? (
                      <span className="status-badge banned">BANNED</span>
                    ) : (
                      <span className="status-badge active">ACTIVE</span>
                    )}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-icon"
                        title="Edit Profile"
                        onClick={() => openEditModal(user)}
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                        </svg>
                      </button>
                      <button
                        className="btn-icon"
                        title="Reset Password"
                        onClick={() => {
                          setSelectedUser(user);
                          setShowPasswordModal(true);
                        }}
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
                        </svg>
                      </button>
                      {user.role !== 'admin' && (
                        <button
                          className="btn-icon ban"
                          title="Delete User"
                          onClick={() => {
                            setSelectedUser(user);
                            setShowBanModal(true);
                          }}
                        >
                          <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {users.length === 0 && (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              <h3>No users found</h3>
              <p>Try adjusting your search filters</p>
            </div>
          )}
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit User Profile</h2>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>

            <form className="edit-form" onSubmit={(e) => { e.preventDefault(); handleUpdateProfile(); }}>
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  value={editFormData.username || ''}
                  onChange={(e) => setEditFormData({...editFormData, username: e.target.value})}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={editFormData.email || ''}
                  onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                  className="form-input"
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Update Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {showPasswordModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Reset Password - {selectedUser.full_name}</h2>
              <button className="modal-close" onClick={() => setShowPasswordModal(false)}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>

            <form className="password-form" onSubmit={(e) => { e.preventDefault(); handleResetPassword(); }}>
              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="form-input"
                  placeholder="Enter new password (min. 8 characters)"
                  minLength={8}
                  required
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowPasswordModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Reset Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {showBanModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowBanModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Delete User - {selectedUser.full_name || selectedUser.username}</h2>
              <button className="modal-close" onClick={() => setShowBanModal(false)}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>

            <div className="delete-confirmation">
              <p>Are you sure you want to delete this user? This action cannot be undone.</p>
              <div className="user-info">
                <p><strong>Username:</strong> {selectedUser.username}</p>
                <p><strong>Email:</strong> {selectedUser.email}</p>
                <p><strong>Role:</strong> {selectedUser.role}</p>
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowBanModal(false)}>
                Cancel
              </button>
              <button onClick={handleDeleteUser} className="btn btn-danger">
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </div>
  );
};

export default UserManagement;