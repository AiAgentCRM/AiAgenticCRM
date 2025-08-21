import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Sidebar.css";

const Sidebar = ({ activeTab, setActiveTab, onLogout, isMobileOpen, isSidebarCollapsed, onSidebarCollapse }) => {
  const [isCollapsed, setIsCollapsed] = useState(isSidebarCollapsed || false);
  const navigate = useNavigate();

  const handleToggleCollapse = () => {
    const newCollapsedState = !isCollapsed;
    setIsCollapsed(newCollapsedState);
    if (onSidebarCollapse) {
      onSidebarCollapse(newCollapsedState);
    }
  };

  // Sync with parent state
  useEffect(() => {
    if (isSidebarCollapsed !== undefined && isSidebarCollapsed !== isCollapsed) {
      setIsCollapsed(isSidebarCollapsed);
    }
  }, [isSidebarCollapsed, isCollapsed]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("tenantId");
    localStorage.removeItem("ownerName");
    localStorage.removeItem("businessName");
    navigate("/login");
    if (onLogout) onLogout();
  };

  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: "🏠",
      description: "View your dashboard overview",
    },
    {
      id: "leads",
      label: "Leads Management",
      icon: "👥",
      description: "Manage your leads and contacts",
    },
    {
      id: "leadstages",
      label: "Lead Stage Detection",
      icon: "🎯",
      description: "Configure lead conversation stage detection",
    },
    {
      id: "settings",
      label: "Global Settings",
      icon: "🔧",
      description: "Configure global messaging settings",
    },
    {
      id: "knowledgebase",
      label: "Knowledge Base",
      icon: "🧠",
      description: "Manage your AI knowledge base",
    },
    {
      id: "whatsapp",
      label: "WhatsApp Settings",
      icon: "📱",
      description: "Configure WhatsApp integration",
    },
    {
      id: "sheets",
      label: "Google Sheets",
      icon: "📊",
      description: "Configure Google Sheets sync",
    },
  ];

  return (
    <>
      {/* Sidebar */}
      <div className={`sidebar theme-kraya ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>
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
        </div>

        {/* User Info */}
        {/* <div className="sidebar-user">
          <div className="user-avatar">
            <span>👤</span>
          </div>
          {!isCollapsed && (
            <div className="user-info">
              <div className="user-name">{localStorage.getItem("ownerName") || "User"}</div>
              <div className="user-role">Business Owner</div>
            </div>
          )}
        </div> */}

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
                  <span className="nav-icon-circle">
                    <span className="nav-icon">{item.icon}</span>
                  </span>
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

      {/* Floating Collapse Toggle Button - Outside Sidebar */}
      <button
        className={`floating-collapse-toggle ${isCollapsed ? 'collapsed' : ''}`}
        onClick={handleToggleCollapse}
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <div className="collapse-icon">
          {isCollapsed ? '›' : '‹'}
        </div>
      </button>
    </>
  );
};

export default Sidebar;
