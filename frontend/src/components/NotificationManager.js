import React, { useState, useEffect } from 'react';
import {
  fetchNotifications,
  createNotification,
  updateNotification,
  deleteNotification
} from '../services/api';

const NotificationManager = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingNotification, setEditingNotification] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'general',
    priority: 'medium',
    isActive: true,
    isGlobal: false,
    targetAudience: 'all',
    targetTenants: [],
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await fetchNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Failed to load notifications:', error);
      setMessage('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingNotification) {
        await updateNotification(editingNotification._id, formData);
        setMessage('Notification updated successfully');
      } else {
        await createNotification(formData);
        setMessage('Notification created successfully');
      }
      setShowForm(false);
      setEditingNotification(null);
      resetForm();
      loadNotifications();
    } catch (error) {
      setMessage('Failed to save notification');
    }
  };

  const handleEdit = (notification) => {
    setEditingNotification(notification);
    setFormData({
      title: notification.title,
      message: notification.message,
      type: notification.type,
      priority: notification.priority,
      isActive: notification.isActive,
      isGlobal: notification.isGlobal,
      targetAudience: notification.targetAudience,
      targetTenants: notification.targetTenants || [],
      startDate: notification.startDate ? new Date(notification.startDate).toISOString().split('T')[0] : '',
      endDate: notification.endDate ? new Date(notification.endDate).toISOString().split('T')[0] : ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this notification?')) {
      try {
        await deleteNotification(id);
        setMessage('Notification deleted successfully');
        loadNotifications();
      } catch (error) {
        setMessage('Failed to delete notification');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      message: '',
      type: 'general',
      priority: 'medium',
      isActive: true,
      isGlobal: false,
      targetAudience: 'all',
      targetTenants: [],
      startDate: '',
      endDate: ''
    });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'danger';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'announcement': return '📢';
      case 'system_alert': return '⚠️';
      case 'user_registration': return '👤';
      case 'plan_purchase': return '💰';
      default: return '📝';
    }
  };

  if (loading) {
    return <div className="text-center">Loading notifications...</div>;
  }

  return (
    <div className="notification-manager">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>Notification Management</h3>
        <button
          className="btn btn-primary"
          onClick={() => {
            setShowForm(true);
            setEditingNotification(null);
            resetForm();
          }}
        >
          <span>➕</span> Create Notification
        </button>
      </div>

      {message && (
        <div className={`alert alert-${message.includes('success') ? 'success' : 'danger'} alert-dismissible fade show`}>
          {message}
          <button type="button" className="btn-close" onClick={() => setMessage('')}></button>
        </div>
      )}

      {showForm && (
        <div className="card mb-4">
          <div className="card-header">
            <h5>{editingNotification ? 'Edit Notification' : 'Create New Notification'}</h5>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Title *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      required
                      maxLength={200}
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Type</label>
                    <select
                      className="form-select"
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                    >
                      <option value="general">General</option>
                      <option value="announcement">Announcement</option>
                      <option value="system_alert">System Alert</option>
                      <option value="user_registration">User Registration</option>
                      <option value="plan_purchase">Plan Purchase</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Priority</label>
                    <select
                      className="form-select"
                      value={formData.priority}
                      onChange={(e) => setFormData({...formData, priority: e.target.value})}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Target Audience</label>
                    <select
                      className="form-select"
                      value={formData.targetAudience}
                      onChange={(e) => setFormData({...formData, targetAudience: e.target.value})}
                    >
                      <option value="all">All Users</option>
                      <option value="tenants">Tenants Only</option>
                      <option value="admins">Admins Only</option>
                      <option value="specific">Specific Tenants</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">Message *</label>
                <textarea
                  className="form-control"
                  rows="4"
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  required
                  maxLength={2000}
                />
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Start Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={formData.startDate}
                      onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">End Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={formData.endDate}
                      onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                  />
                  <label className="form-check-label" htmlFor="isActive">
                    Active
                  </label>
                </div>
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="isGlobal"
                    checked={formData.isGlobal}
                    onChange={(e) => setFormData({...formData, isGlobal: e.target.checked})}
                  />
                  <label className="form-check-label" htmlFor="isGlobal">
                    Global Notification
                  </label>
                </div>
              </div>

              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-primary">
                  {editingNotification ? 'Update' : 'Create'} Notification
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowForm(false);
                    setEditingNotification(null);
                    resetForm();
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="notifications-list">
        {notifications.length === 0 ? (
          <div className="text-center text-muted">
            <p>No notifications found</p>
          </div>
        ) : (
          <div className="row">
            {notifications.map((notification) => (
              <div key={notification._id} className="col-md-6 col-lg-4 mb-3">
                <div className="card h-100">
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <span className="fs-5">{getTypeIcon(notification.type)}</span>
                    <span className={`badge bg-${getPriorityColor(notification.priority)}`}>
                      {notification.priority}
                    </span>
                  </div>
                  <div className="card-body">
                    <h6 className="card-title">{notification.title}</h6>
                    <p className="card-text text-muted small">
                      {notification.message.length > 100 
                        ? `${notification.message.substring(0, 100)}...` 
                        : notification.message
                      }
                    </p>
                    <div className="small text-muted">
                      <div>Type: {notification.type}</div>
                      <div>Target: {notification.targetAudience}</div>
                      <div>Status: {notification.isActive ? 'Active' : 'Inactive'}</div>
                      {notification.createdBy && (
                        <div>Created by: {notification.createdBy.username}</div>
                      )}
                      <div>Created: {new Date(notification.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div className="card-footer">
                    <div className="btn-group w-100" role="group">
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => handleEdit(notification)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDelete(notification._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationManager;
