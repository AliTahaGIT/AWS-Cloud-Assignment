/*
 * Request Management Component
 * Author: Amir (TP070572)
 */
import React, { useState, useEffect } from 'react';
import './RequestManagement.css';
import useToast from '../../hooks/useToast';
import ToastContainer from '../Toast/ToastContainer';

interface Request {
  request_id: string;
  user_id?: string;
  user_email?: string;
  user_name: string;
  phone_number?: string;
  req_type?: string;
  req_details?: string;
  req_region?: string;
  location?: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  status?: 'pending' | 'in_progress' | 'resolved' | 'cancelled';
  created_at: string;
  updated_at?: string;
  assigned_to?: string;
  admin_note?: string;
  admin_notes?: AdminNote[];
}

interface AdminNote {
  note_id: string;
  note: string;
  created_at: string;
  created_by: string;
}

interface Expert {
  user_id: string;
  full_name: string;
  email: string;
}

const RequestManagement: React.FC = () => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('');
  const [adminNote, setAdminNote] = useState('');
  const [newNote, setNewNote] = useState('');
  const [experts, setExperts] = useState<Expert[]>([]);
  const [selectedExpert, setSelectedExpert] = useState('');
  const [adminKey] = useState(localStorage.getItem('admin_key') || '');
  const { toasts, removeToast, showSuccess, showError } = useToast();

  const statusOptions = ['pending', 'in_progress', 'resolved', 'cancelled'];
  const priorityOptions = ['low', 'medium', 'high', 'critical'];

  const fetchRequests = async () => {
    if (!adminKey) {
      console.error('No admin key found');
      return;
    }

    try {
      setLoading(true);
      let url = `http://localhost:8000/admin/requests/all?admin_key=${adminKey}`;
      
      if (statusFilter) {
        url += `&status=${statusFilter}`;
      }
      if (priorityFilter) {
        url += `&priority=${priorityFilter}`;
      }
      if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`;
      }

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setRequests(data.requests);
      } else if (response.status === 403) {
        console.error('Admin session expired or invalid');
        window.location.href = '/admin-login';
      } else {
        console.error('Error fetching requests:', response.status, response.statusText);
        showError('Error', 'Failed to fetch requests');
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      showError('Network Error', 'Unable to connect to the server');
    } finally {
      setLoading(false);
    }
  };

  const fetchExperts = async () => {
    try {
      const response = await fetch(`http://localhost:8000/admin/users/all?admin_key=${adminKey}&role=expert`);
      if (response.ok) {
        const data = await response.json();
        setExperts(data.users);
      }
    } catch (error) {
      console.error('Error fetching experts:', error);
    }
  };

  const updateRequestStatus = async () => {
    if (!selectedRequest || !newStatus) return;

    try {
      const response = await fetch(
        `http://localhost:8000/admin/requests/${selectedRequest.request_id}/status?admin_key=${adminKey}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus, admin_note: adminNote })
        }
      );

      if (response.ok) {
        showSuccess('Success', 'Request status updated successfully');
        await fetchRequests();
        setShowStatusModal(false);
        setNewStatus('');
        setAdminNote('');
        setSelectedRequest(null);
      } else {
        const error = await response.json();
        showError('Error', error.detail || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      showError('Network Error', 'Unable to update status');
    }
  };

  const assignRequestToExpert = async () => {
    if (!selectedRequest || !selectedExpert) return;

    try {
      const response = await fetch(
        `http://localhost:8000/admin/requests/${selectedRequest.request_id}/assign?admin_key=${adminKey}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ expert_id: selectedExpert })
        }
      );

      if (response.ok) {
        showSuccess('Success', 'Request assigned to expert successfully');
        await fetchRequests();
        setShowAssignModal(false);
        setSelectedExpert('');
        setSelectedRequest(null);
      } else {
        const error = await response.json();
        showError('Error', error.detail || 'Failed to assign request');
      }
    } catch (error) {
      console.error('Error assigning request:', error);
      showError('Network Error', 'Unable to assign request');
    }
  };

  const addAdminNote = async () => {
    if (!selectedRequest || !newNote) return;

    try {
      const response = await fetch(
        `http://localhost:8000/admin/requests/${selectedRequest.request_id}/notes?admin_key=${adminKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ note: newNote })
        }
      );

      if (response.ok) {
        showSuccess('Success', 'Note added successfully');
        await fetchRequests();
        setShowNoteModal(false);
        setNewNote('');
        
        // Re-open details modal with updated request
        const updatedRequests = await fetchRequests();
        const updatedRequest = requests.find(r => r.request_id === selectedRequest.request_id);
        if (updatedRequest) {
          setSelectedRequest(updatedRequest);
          setShowDetailsModal(true);
        }
      } else {
        const error = await response.json();
        showError('Error', error.detail || 'Failed to add note');
      }
    } catch (error) {
      console.error('Error adding note:', error);
      showError('Network Error', 'Unable to add note');
    }
  };

  const getPriorityColor = (priority?: string) => {
    if (!priority) return '';
    switch (priority) {
      case 'critical': return 'priority-critical';
      case 'high': return 'priority-high';
      case 'medium': return 'priority-medium';
      case 'low': return 'priority-low';
      default: return '';
    }
  };

  const getStatusColor = (status?: string) => {
    if (!status) return 'status-pending';
    switch (status) {
      case 'resolved': return 'status-resolved';
      case 'in_progress': return 'status-progress';
      case 'pending': return 'status-pending';
      case 'cancelled': return 'status-cancelled';
      default: return 'status-pending';
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchExperts();
  }, [searchTerm, statusFilter, priorityFilter]);

  return (
    <div className="request-management">
      <div className="management-header">
        <h1>Request Management</h1>
        <p>Manage and track all assistance requests</p>
      </div>

      <div className="management-controls">
        <div className="search-section">
          <input
            type="text"
            placeholder="Search by name, location, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filters-section">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">All Status</option>
            {statusOptions.map(status => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
              </option>
            ))}
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">All Priorities</option>
            {priorityOptions.map(priority => (
              <option key={priority} value={priority}>
                {priority.charAt(0).toUpperCase() + priority.slice(1)}
              </option>
            ))}
          </select>

          <button 
            className="btn btn-secondary"
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('');
              setPriorityFilter('');
            }}
          >
            Clear Filters
          </button>

        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading requests...</p>
        </div>
      ) : (
        <div className="requests-grid">
          {requests.map((request) => (
            <div key={request.request_id} className={`request-card ${getStatusColor(request.status)}`}>
              <div className="request-header">
                <div className="request-info">
                  <h3>{request.user_name}</h3>
                  <p className="request-location">{request.req_region || request.location || 'No location'}</p>
                </div>
                <div className="request-badges">
                  {request.priority && (
                    <span className={`priority-badge ${getPriorityColor(request.priority)}`}>
                      {request.priority.toUpperCase()}
                    </span>
                  )}
                  <span className={`status-badge ${getStatusColor(request.status || 'pending')}`}>
                    {(request.status || 'pending').replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="request-body">
                <p className="request-description">{request.req_details || request.description || 'No details provided'}</p>
                <div className="request-meta">
                  {request.phone_number && (
                    <span>
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                      </svg>
                      {request.phone_number}
                    </span>
                  )}
                  <span>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                    </svg>
                    {new Date(request.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="request-actions">
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    setSelectedRequest(request);
                    setNewStatus(request.status || 'pending');
                    setShowStatusModal(true);
                  }}
                >
                  Update Status
                </button>
              </div>
            </div>
          ))}

          {requests.length === 0 && (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 6h-2.18c.11-.31.18-.65.18-1a2.996 2.996 0 00-5.5-1.65l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z"/>
              </svg>
              <h3>No requests found</h3>
              <p>Try adjusting your search filters</p>
            </div>
          )}
        </div>
      )}

      {/* Request Details Modal */}
      {showDetailsModal && selectedRequest && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Request Details</h2>
              <button className="modal-close" onClick={() => setShowDetailsModal(false)}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>

            <div className="request-details">
              <div className="detail-section">
                <h3>Request Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Request ID:</label>
                    <span>{selectedRequest.request_id}</span>
                  </div>
                  <div className="detail-item">
                    <label>User Name:</label>
                    <span>{selectedRequest.user_name}</span>
                  </div>
                  <div className="detail-item">
                    <label>Phone Number:</label>
                    <span>{selectedRequest.phone_number}</span>
                  </div>
                  <div className="detail-item">
                    <label>Location:</label>
                    <span>{selectedRequest.location}</span>
                  </div>
                  <div className="detail-item">
                    <label>Priority:</label>
                    <span className={`priority-badge ${getPriorityColor(selectedRequest.priority)}`}>
                      {selectedRequest.priority.toUpperCase()}
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>Status:</label>
                    <span className={`status-badge ${getStatusColor(selectedRequest.status)}`}>
                      {selectedRequest.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>Created:</label>
                    <span>{new Date(selectedRequest.created_at).toLocaleString()}</span>
                  </div>
                  {selectedRequest.assigned_to && (
                    <div className="detail-item">
                      <label>Assigned To:</label>
                      <span>{experts.find(e => e.user_id === selectedRequest.assigned_to)?.full_name || 'Unknown'}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="detail-section">
                <h3>Description</h3>
                <p className="description-text">{selectedRequest.description}</p>
              </div>

              {selectedRequest.admin_note && (
                <div className="detail-section">
                  <h3>Admin Note</h3>
                  <p className="admin-note-text">{selectedRequest.admin_note}</p>
                </div>
              )}

              {selectedRequest.admin_notes && selectedRequest.admin_notes.length > 0 && (
                <div className="detail-section">
                  <h3>Admin Notes History</h3>
                  <div className="notes-list">
                    {selectedRequest.admin_notes.map((note) => (
                      <div key={note.note_id} className="note-item">
                        <p>{note.note}</p>
                        <span className="note-meta">
                          {new Date(note.created_at).toLocaleString()} by {note.created_by}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="detail-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowDetailsModal(false);
                    setShowAssignModal(true);
                  }}
                >
                  Assign to Expert
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowDetailsModal(false);
                    setShowNoteModal(true);
                  }}
                >
                  Add Note
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setShowDetailsModal(false);
                    setNewStatus(selectedRequest.status);
                    setShowStatusModal(true);
                  }}
                >
                  Update Status
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {showStatusModal && selectedRequest && (
        <div className="modal-overlay" onClick={() => setShowStatusModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Update Request Status</h2>
              <button className="modal-close" onClick={() => setShowStatusModal(false)}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>

            <form className="status-form" onSubmit={(e) => { e.preventDefault(); updateRequestStatus(); }}>
              <div className="form-group">
                <label>New Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="form-select"
                  required
                >
                  {statusOptions.map(status => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Admin Note (Optional)</label>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  className="form-textarea"
                  placeholder="Add any notes about this status change"
                  rows={3}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowStatusModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Update Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Expert Modal */}
      {showAssignModal && selectedRequest && (
        <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Assign to Expert</h2>
              <button className="modal-close" onClick={() => setShowAssignModal(false)}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>

            <form className="assign-form" onSubmit={(e) => { e.preventDefault(); assignRequestToExpert(); }}>
              <div className="form-group">
                <label>Select Expert</label>
                <select
                  value={selectedExpert}
                  onChange={(e) => setSelectedExpert(e.target.value)}
                  className="form-select"
                  required
                >
                  <option value="">Choose an expert...</option>
                  {experts.map(expert => (
                    <option key={expert.user_id} value={expert.user_id}>
                      {expert.full_name} - {expert.email}
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAssignModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Assign Expert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Note Modal */}
      {showNoteModal && selectedRequest && (
        <div className="modal-overlay" onClick={() => setShowNoteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Admin Note</h2>
              <button className="modal-close" onClick={() => setShowNoteModal(false)}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>

            <form className="note-form" onSubmit={(e) => { e.preventDefault(); addAdminNote(); }}>
              <div className="form-group">
                <label>Note</label>
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="form-textarea"
                  placeholder="Enter your note about this request"
                  rows={4}
                  required
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowNoteModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Note
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

export default RequestManagement;