import React from "react";

const Sidebar = ({
  activeTab,
  onSelectTab,
  onLogout,
  businessName,
  ownerName,
  isOpen = true,
}) => {
  const tabs = [
    { 
      id: "dashboard", 
      label: "Dashboard", 
      icon: "bi-speedometer2",
      description: "Overview and analytics"
    },
    { 
      id: "leads", 
      label: "Leads", 
      icon: "bi-people",
      description: "Manage your leads"
    },
    { 
      id: "settings", 
      label: "Settings", 
      icon: "bi-gear",
      description: "Configure preferences"
    },
    { 
      id: "knowledgebase", 
      label: "Knowledge Base", 
      icon: "bi-journal-text",
      description: "Train your AI"
    },
    { 
      id: "whatsapp", 
      label: "WhatsApp", 
      icon: "bi-chat-dots",
      description: "Connect WhatsApp"
    },
    { 
      id: "sheets", 
      label: "Google Sheets", 
      icon: "bi-google",
      description: "Configure integration"
    },
  ];

  return (
    <div
      className={`sidebar ${isOpen ? "show" : ""}`}
    >
      {/* Sidebar Header */}
      <div className="sidebar-header">
        <div className="brand-section">
          <div className="brand-icon">
            <i className="bi bi-robot"></i>
          </div>
          <div className="brand-info">
            <h5 className="brand-name">{businessName || "AiAgenticCRM"}</h5>
            <p className="brand-subtitle">AI-Powered CRM</p>
          </div>
        </div>
        <div className="user-section">
          <div className="user-avatar">
            <i className="bi bi-person-circle"></i>
          </div>
          <div className="user-info">
            <span className="user-name">{ownerName || "User"}</span>
            <span className="user-role">Business Owner</span>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="sidebar-nav">
        <div className="nav-section">
          <h6 className="nav-title">Main Menu</h6>
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
                {activeTab === tab.id && (
                  <div className="nav-indicator">
                    <i className="bi bi-chevron-right"></i>
                  </div>
                )}
              </button>
            ))}
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
          <button className="logout-btn" onClick={onLogout}>
            <i className="bi bi-box-arrow-right"></i>
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;


