import React, { useState, useEffect } from 'react';
import './Sidebar.css';

const Sidebar = ({ activeTab, setActiveTab, onLogout, isMobileOpen }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: '📊',
      description: 'Overview and analytics'
    },
    {
      id: 'leads',
      label: 'Leads Management',
      icon: '👥',
      description: 'Manage your leads'
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp Settings',
      icon: '💬',
      description: 'Configure WhatsApp'
    },
    {
      id: 'sheets',
      label: 'Google Sheets',
      icon: '📋',
      description: 'Sheet configuration'
    },
    {
      id: 'knowledgebase',
      label: 'Knowledge Base',
      icon: '📚',
      description: 'AI knowledge setup'
    },
    {
      id: 'settings',
      label: 'Global Settings',
      icon: '⚙️',
      description: 'System configuration'
    }
  ];

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
  };

  const handleToggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
    // Add class to main content for responsive width
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      if (!isCollapsed) {
        mainContent.classList.add('sidebar-collapsed');
      } else {
        mainContent.classList.remove('sidebar-collapsed');
      }
    }
  };

  // Handle mobile responsiveness
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsCollapsed(false);
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
          mainContent.classList.remove('sidebar-collapsed');
        }
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
              <small>{localStorage.getItem("businessName") || "Business CRM"}</small>
            </div>
          )}
        </div>
        <button
          className="sidebar-toggle"
          onClick={handleToggleCollapse}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <div className="collapse-icon">
            {isCollapsed ? '→' : '←'}
          </div>
        </button>
      </div>

      {/* User Info */}
      <div className="sidebar-user">
        <div className="user-avatar">
          <span>👤</span>
        </div>
        {!isCollapsed && (
          <div className="user-info">
            <div className="user-name">{localStorage.getItem("ownerName") || "User"}</div>
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
                title={isCollapsed ? `${item.label} - ${item.description}` : item.description}
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
          title={isCollapsed ? 'Logout' : 'Sign out of your account'}
        >
          <span className="logout-icon">🚪</span>
          {!isCollapsed && <span className="logout-text">Logout</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
