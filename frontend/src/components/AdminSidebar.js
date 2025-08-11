import React from 'react';

const AdminSidebar = ({
  activeTab,
  onSelectTab,
  onLogout,
  isOpen = true,
  stats = {}
}) => {
  const tabs = [
    { 
      id: "overview", 
      label: "Overview", 
      icon: "bi-speedometer2",
      description: "Dashboard overview",
      badge: null
    },
    { 
      id: "tenants", 
      label: "Tenants", 
      icon: "bi-people",
      description: "Manage business tenants",
      badge: stats.totalTenants || 0
    },
    { 
      id: "plans", 
      label: "Plans", 
      icon: "bi-credit-card",
      description: "Subscription plans",
      badge: stats.totalPlans || 0
    },
    { 
      id: "requests", 
      label: "Requests", 
      icon: "bi-clock-history",
      description: "Plan change requests",
      badge: stats.pendingRequests || 0
    },
    { 
      id: "analytics", 
      label: "Analytics", 
      icon: "bi-graph-up",
      description: "System analytics",
      badge: null
    },
    { 
      id: "settings", 
      label: "Settings", 
      icon: "bi-gear",
      description: "Admin settings",
      badge: null
    },
    { 
      id: "company", 
      label: "Company", 
      icon: "bi-building",
      description: "Company details",
      badge: null
    }
  ];

  return (
    <div className={`admin-sidebar ${isOpen ? "show" : ""}`}>
      {/* Sidebar Header */}
      <div className="sidebar-header">
        <div className="brand-section">
          <div className="brand-icon">
            <i className="bi bi-shield-check"></i>
          </div>
          <div className="brand-info">
            <h5 className="brand-name">AiAgenticCRM</h5>
            <p className="brand-subtitle">Admin Panel</p>
          </div>
        </div>
        <div className="admin-info">
          <div className="admin-avatar">
            <i className="bi bi-person-circle"></i>
          </div>
          <div className="admin-details">
            <span className="admin-name">Super Admin</span>
            <span className="admin-role">System Administrator</span>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="sidebar-nav">
        <div className="nav-section">
          <h6 className="nav-title">Main Navigation</h6>
          <div className="nav-items">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`nav-item ${activeTab === tab.id ? "active" : ""}`}
                onClick={() => onSelectTab(tab.id)}
              >
                <div className="nav-icon">
                  <i className={`bi ${tab.icon}`}></i>
                </div>
                <div className="nav-content">
                  <span className="nav-label">{tab.label}</span>
                  <span className="nav-description">{tab.description}</span>
                </div>
                {tab.badge && (
                  <div className="nav-badge">
                    <span className="badge-count">{tab.badge}</span>
                  </div>
                )}
                {activeTab === tab.id && (
                  <div className="nav-indicator">
                    <i className="bi bi-chevron-right"></i>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="nav-section">
          <h6 className="nav-title">Quick Stats</h6>
          <div className="quick-stats">
            <div className="stat-item">
              <div className="stat-icon active">
                <i className="bi bi-check-circle"></i>
              </div>
              <div className="stat-info">
                <span className="stat-value">{stats.activeTenants || 0}</span>
                <span className="stat-label">Active</span>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon pending">
                <i className="bi bi-clock"></i>
              </div>
              <div className="stat-info">
                <span className="stat-value">{stats.pendingTenants || 0}</span>
                <span className="stat-label">Pending</span>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon requests">
                <i className="bi bi-exclamation-circle"></i>
              </div>
              <div className="stat-info">
                <span className="stat-value">{stats.pendingRequests || 0}</span>
                <span className="stat-label">Requests</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar Footer */}
      <div className="sidebar-footer">
        <div className="footer-section">
          <div className="system-status">
            <div className="status-indicator">
              <div className="status-dot online"></div>
              <span className="status-text">System Online</span>
            </div>
          </div>
          <div className="footer-actions">
            <button className="refresh-btn" onClick={() => window.location.reload()}>
              <i className="bi bi-arrow-clockwise"></i>
              <span>Refresh</span>
            </button>
            <button className="logout-btn" onClick={onLogout}>
              <i className="bi bi-box-arrow-right"></i>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSidebar;
