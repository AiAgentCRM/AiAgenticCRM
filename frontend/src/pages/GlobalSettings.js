import React, { useState } from "react";
import GlobalMessagingSettings from "../components/GlobalMessagingSettings";
import "./GlobalSettings.css";

const GlobalSettings = ({ tenantId }) => {
  const [activeTab, setActiveTab] = useState("messaging");
  const [isSaving, setIsSaving] = useState(false);

  const settingsTabs = [
    { id: "messaging", label: "Messaging", icon: "💬", component: "messaging" },
    { id: "notifications", label: "Notifications", icon: "🔔", component: "notifications" },
    { id: "integrations", label: "Integrations", icon: "🔗", component: "integrations" },
    { id: "security", label: "Security", icon: "🔒", component: "security" },
    { id: "appearance", label: "Appearance", icon: "🎨", component: "appearance" },
    { id: "advanced", label: "Advanced", icon: "⚙️", component: "advanced" }
  ];

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate save operation
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
    // Show success message
  };

  const renderSettingsContent = () => {
    switch (activeTab) {
      case "messaging":
        return <GlobalMessagingSettings tenantId={tenantId} />;
      case "notifications":
        return <NotificationSettings />;
      case "integrations":
        return <IntegrationSettings />;
      case "security":
        return <SecuritySettings />;
      case "appearance":
        return <AppearanceSettings />;
      case "advanced":
        return <AdvancedSettings />;
      default:
        return <GlobalMessagingSettings tenantId={tenantId} />;
    }
  };

  return (
    <div className="global-settings">
      {/* Header Section */}
      {/* <div className="settings-header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="page-title">Global Settings</h1>
            <p className="page-subtitle">Configure your CRM system settings</p>
          </div>
          <div className="header-actions">
            <button 
              className={`btn btn-primary ${isSaving ? 'saving' : ''}`}
              onClick={handleSave}
              disabled={isSaving}
            >
              <span className="btn-icon">
                {isSaving ? '⏳' : '💾'}
              </span>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
            <button className="btn btn-outline">
              <span className="btn-icon">🔄</span>
              Reset to Default
            </button>
          </div>
        </div>
      </div> */}

      {/* Settings Navigation */}
      {/* <div className="settings-navigation">
        {settingsTabs.map((tab) => (
          <button
            key={tab.id}
            className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div> */}

      {/* Settings Content */}
      <div className="settings-content">
        {renderSettingsContent()}
      </div>
    </div>
  );
};

// Placeholder components for other settings tabs
const NotificationSettings = () => (
  <div className="settings-section">
    <h3>Notification Preferences</h3>
    <p>Configure how and when you receive notifications.</p>
    <div className="setting-item">
      <label className="setting-label">
        <input type="checkbox" defaultChecked />
        Email notifications for new leads
      </label>
    </div>
    <div className="setting-item">
      <label className="setting-label">
        <input type="checkbox" defaultChecked />
        SMS notifications for urgent messages
      </label>
    </div>
    <div className="setting-item">
      <label className="setting-label">
        <input type="checkbox" />
        Push notifications in browser
      </label>
    </div>
  </div>
);

const IntegrationSettings = () => (
  <div className="settings-section">
    <h3>Third-party Integrations</h3>
    <p>Connect your CRM with external services and tools.</p>
    <div className="integration-card">
      <div className="integration-info">
        <h4>Google Workspace</h4>
        <p>Sync with Gmail, Calendar, and Drive</p>
      </div>
      <button className="btn btn-outline">Connect</button>
    </div>
    <div className="integration-card">
      <div className="integration-info">
        <h4>Slack</h4>
        <p>Get notifications in your Slack channels</p>
      </div>
      <button className="btn btn-outline">Connect</button>
    </div>
  </div>
);

const SecuritySettings = () => (
  <div className="settings-section">
    <h3>Security & Privacy</h3>
    <p>Manage your account security settings.</p>
    <div className="setting-item">
      <label className="setting-label">Two-Factor Authentication</label>
      <button className="btn btn-outline">Enable</button>
    </div>
    <div className="setting-item">
      <label className="setting-label">Session Timeout</label>
      <select className="setting-input">
        <option>30 minutes</option>
        <option>1 hour</option>
        <option>4 hours</option>
        <option>24 hours</option>
      </select>
    </div>
  </div>
);

const AppearanceSettings = () => (
  <div className="settings-section">
    <h3>Theme & Appearance</h3>
    <p>Customize the look and feel of your CRM.</p>
    <div className="setting-item">
      <label className="setting-label">Theme</label>
      <select className="setting-input">
        <option>Light</option>
        <option>Dark</option>
        <option>Auto</option>
      </select>
    </div>
    <div className="setting-item">
      <label className="setting-label">Primary Color</label>
      <input type="color" className="setting-input" defaultValue="#2563eb" />
    </div>
  </div>
);

const AdvancedSettings = () => (
  <div className="settings-section">
    <h3>Advanced Configuration</h3>
    <p>Advanced settings for power users.</p>
    <div className="setting-item">
      <label className="setting-label">API Rate Limiting</label>
      <input type="number" className="setting-input" defaultValue="100" />
    </div>
    <div className="setting-item">
      <label className="setting-label">Debug Mode</label>
      <input type="checkbox" />
    </div>
  </div>
);

export default GlobalSettings;
