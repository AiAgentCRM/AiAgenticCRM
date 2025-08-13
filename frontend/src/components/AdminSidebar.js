import React, { useState, useEffect } from 'react';
import './AdminSidebar.css';

const AdminSidebar = ({ activeTab, setActiveTab, onLogout, isMobileOpen }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    {
      id: 'tenants',
      label: 'Tenants',
      icon: '🏢',
      description: 'Manage tenant accounts'
    },
    {
      id: 'plans',
      label: 'Subscription Plans',
      icon: '📋',
      description: 'Manage subscription plans'
    },
    {
      id: 'planRequests',
      label: 'Plan Requests',
      icon: '📝',
      description: 'Review plan change requests'
    },
    {
      id: 'paymentGateways',
      label: 'Payment Gateways',
      icon: '💳',
      description: 'Configure payment gateways'
    },
    {
      id: 'paymentHistory',
      label: 'Payment History',
      icon: '📊',
      description: 'View payment transactions'
    }
  ];

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
  };

  // Handle mobile responsiveness
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsCollapsed(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className={`admin-sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>
      {/* Sidebar Header */}
      <div className="admin-sidebar-header">
        <div className="admin-sidebar-brand">
          <div className="admin-brand-icon">👑</div>
          {!isCollapsed && (
            <div className="admin-brand-text">
              <h3>Admin Panel</h3>
              <small>AiAgenticCRM</small>
            </div>
          )}
        </div>
        <button
          className="admin-sidebar-toggle"
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? '→' : '←'}
        </button>
      </div>

      {/* User Info */}
      <div className="admin-sidebar-user">
        <div className="admin-user-avatar">
          <span>👤</span>
        </div>
        {!isCollapsed && (
          <div className="admin-user-info">
            <div className="admin-user-name">Super Admin</div>
            <div className="admin-user-role">System Administrator</div>
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="admin-sidebar-nav">
        <ul className="admin-nav-list">
          {menuItems.map((item) => (
            <li key={item.id} className="admin-nav-item">
              <button
                className={`admin-nav-link ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab(item.id);
                }}
                title={isCollapsed ? item.description : ''}
              >
                <span className="admin-nav-icon">{item.icon}</span>
                {!isCollapsed && (
                  <>
                    <span className="admin-nav-label">{item.label}</span>
                    <span className="admin-nav-description">{item.description}</span>
                  </>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Sidebar Footer */}
      <div className="admin-sidebar-footer">
        <button
          className="admin-logout-button"
          onClick={handleLogout}
          title={isCollapsed ? 'Logout' : ''}
        >
          <span className="admin-logout-icon">🚪</span>
          {!isCollapsed && <span className="admin-logout-text">Logout</span>}
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;
