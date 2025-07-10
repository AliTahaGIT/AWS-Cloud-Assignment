/*
 * Emergency Contacts Manager Component
 * Author: Amir (TP070572)
 */
import React, { useState, useEffect } from 'react';
import './ContactsManager.css';

interface EmergencyContact {
  contact_id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  region: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ContactFormData {
  name: string;
  role: string;
  phone: string;
  email: string;
  region: string;
  is_active: boolean;
}

const ContactsManager: React.FC = () => {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    role: '',
    phone: '',
    email: '',
    region: '',
    is_active: true
  });
  const [filterRegion, setFilterRegion] = useState<string>('');
  const [adminKey] = useState(localStorage.getItem('admin_key') || '');

  const regions = [
    'Johor', 'Kedah', 'Kelantan', 'Kuala Lumpur', 'Labuan', 'Malacca', 'Negeri Sembilan', 
    'Pahang', 'Penang', 'Perak', 'Perlis', 'Putrajaya', 'Sabah', 'Sarawak', 'Selangor', 'Terengganu'
  ];
  const roles = [
    'Emergency Response Team Lead',
    'Fire Department Chief',
    'Police Captain',
    'Medical Emergency Coordinator',
    'Disaster Management Officer',
    'Rescue Team Leader',
    'Emergency Communications Officer',
    'Regional Coordinator'
  ];

  const fetchContacts = async () => {
    try {
      setLoading(true);
      let url = `http://localhost:8000/admin/emergency-contacts?admin_key=${adminKey}`;
      
      if (filterRegion) {
        url += `&region=${filterRegion}`;
      }

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setContacts(data.contacts);
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const createContact = async () => {
    try {
      const response = await fetch(`http://localhost:8000/admin/emergency-contacts?admin_key=${adminKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchContacts();
        setShowCreateModal(false);
        resetForm();
      }
    } catch (error) {
      console.error('Error creating contact:', error);
    }
  };

  const updateContact = async () => {
    if (!editingContact) return;

    try {
      const response = await fetch(
        `http://localhost:8000/admin/emergency-contacts/${editingContact.contact_id}?admin_key=${adminKey}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        }
      );

      if (response.ok) {
        await fetchContacts();
        setEditingContact(null);
        resetForm();
      }
    } catch (error) {
      console.error('Error updating contact:', error);
    }
  };

  const deleteContact = async (id: string) => {
    if (!confirm('Are you sure you want to delete this contact?')) return;

    try {
      const response = await fetch(
        `http://localhost:8000/admin/emergency-contacts/${id}?admin_key=${adminKey}`,
        {
          method: 'DELETE',
        }
      );

      if (response.ok) {
        await fetchContacts();
      }
    } catch (error) {
      console.error('Error deleting contact:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      role: '',
      phone: '',
      email: '',
      region: '',
      is_active: true
    });
  };

  const openEditModal = (contact: EmergencyContact) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name,
      role: contact.role,
      phone: contact.phone,
      email: contact.email,
      region: contact.region,
      is_active: contact.is_active
    });
  };

  useEffect(() => {
    fetchContacts();
  }, [filterRegion]);

  return (
    <div className="contacts-manager">
      <div className="manager-header">
        <h1>Emergency Contacts Management</h1>
        <p>Manage emergency response team contacts for all regions</p>
      </div>

      <div className="manager-actions">
        <button 
          className="btn btn-primary btn-large"
          onClick={() => setShowCreateModal(true)}
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
          </svg>
          Add New Contact
        </button>

        <div className="filters">
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
            onClick={() => setFilterRegion('')}
          >
            Clear Filters
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading contacts...</p>
        </div>
      ) : (
        <div className="contacts-grid">
          {contacts.map((contact) => (
            <div 
              key={contact.contact_id} 
              className={`contact-card ${!contact.is_active ? 'inactive' : ''}`}
            >
              <div className="contact-header">
                <div className="contact-avatar">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                </div>
                <div className="contact-info">
                  <h3>{contact.name}</h3>
                  <p className="contact-role">{contact.role}</p>
                  <span className={`region-badge ${contact.region}`}>
                    {contact.region.toUpperCase()}
                  </span>
                </div>
                {!contact.is_active && (
                  <span className="status-badge inactive">INACTIVE</span>
                )}
              </div>

              <div className="contact-details">
                <div className="contact-item">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                  </svg>
                  <span>{contact.phone}</span>
                </div>

                <div className="contact-item">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                  </svg>
                  <span>{contact.email}</span>
                </div>
              </div>

              <div className="contact-meta">
                <span>Added: {new Date(contact.created_at).toLocaleDateString()}</span>
                <span>Updated: {new Date(contact.updated_at).toLocaleDateString()}</span>
              </div>

              <div className="card-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => openEditModal(contact)}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                  </svg>
                  Edit
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => deleteContact(contact.contact_id)}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                  </svg>
                  Delete
                </button>
              </div>
            </div>
          ))}

          {contacts.length === 0 && (
            <div className="empty-state">
              <h3>No emergency contacts found</h3>
              <p>Add your first emergency contact to get started</p>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || editingContact) && (
        <div className="modal-overlay" onClick={() => {
          setShowCreateModal(false);
          setEditingContact(null);
          resetForm();
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingContact ? 'Edit Contact' : 'Add New Contact'}</h2>
              <button
                className="modal-close"
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingContact(null);
                  resetForm();
                }}
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>
            </div>

            <form className="contact-form" onSubmit={(e) => {
              e.preventDefault();
              editingContact ? updateContact() : createContact();
            }}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="form-input"
                  required
                  placeholder="Enter contact's full name"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Role/Position *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                  className="form-select"
                  required
                >
                  <option value="">Select role</option>
                  {roles.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Phone Number *</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="form-input"
                    required
                    placeholder="+60123456789"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Region *</label>
                  <select
                    value={formData.region}
                    onChange={(e) => setFormData(prev => ({ ...prev, region: e.target.value }))}
                    className="form-select"
                    required
                  >
                    <option value="">Select region</option>
                    {regions.map(region => (
                      <option key={region} value={region}>
                        {region.charAt(0).toUpperCase() + region.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="form-input"
                  required
                  placeholder="contact@emergency.gov.my"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  />
                  Active Contact
                </label>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingContact(null);
                    resetForm();
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingContact ? 'Update Contact' : 'Add Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactsManager;