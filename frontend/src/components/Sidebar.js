import React, { useState, useEffect } from 'react';
import './Sidebar.css';

const Sidebar = ({ activeTab, setActiveTab, onLogout, isMobileOpen }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: '📊'
    },
    {
      id: 'leads',
      label: 'Leads',
      icon: '👥'
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp Settings',
      icon: '💬'
    },
    {
      id: 'sheets',
      label: 'Google Sheets Configuration',
      icon: '📋'
    },
    {
      id: 'knowledgebase',
      label: 'Knowledgebase Setup',
      icon: '📚'
    },
    {
      id: 'settings',
      label: 'Global Messaging Settings',
      icon: '⚙️'
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
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>
      {/* Sidebar Header */}
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <div className="brand-icon">🤖</div>
          {!isCollapsed && (
            <div className="brand-text">
              <h3>AiAgenticCRM</h3>
              <small>{localStorage.getItem("businessName")}</small>
            </div>
          )}
        </div>
        <button
          className="sidebar-toggle"
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? '→' : '←'}
        </button>
      </div>

      {/* User Info */}
      <div className="sidebar-user">
        <div className="user-avatar">
          <span>👤</span>
        </div>
        {!isCollapsed && (
          <div className="user-info">
            <div className="user-name">{localStorage.getItem("ownerName")}</div>
            <div className="user-role">Business Owner</div>
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="sidebar-nav">
        <ul className="nav-list">
          {menuItems.map((item) => (
            <li key={item.id} className="nav-item">
              <button
                className={`nav-link ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab(item.id);
                }}
                title={isCollapsed ? item.label : ''}
              >
                <span className="nav-icon">{item.icon}</span>
                {!isCollapsed && (
                  <span className="nav-label">{item.label}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Sidebar Footer */}
      <div className="sidebar-footer">
        <button
          className="logout-button"
          onClick={handleLogout}
          title={isCollapsed ? 'Logout' : ''}
        >
          <span className="logout-icon">🚪</span>
          {!isCollapsed && <span className="logout-text">Logout</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
