import React, { useState } from "react";
import "./GoogleSheets.css";

const GoogleSheets = ({ tenantId }) => {
  const [activeTab, setActiveTab] = useState("sync");
  const [isConnected, setIsConnected] = useState(true);
  const [lastSync, setLastSync] = useState("2 hours ago");
  const [syncStatus, setSyncStatus] = useState("idle");

  const tabs = [
    { id: "sync", label: "Data Sync", icon: "🔄" },
    { id: "mapping", label: "Field Mapping", icon: "🗺️" },
    { id: "history", label: "Sync History", icon: "📋" },
    { id: "settings", label: "Settings", icon: "⚙️" }
  ];

  const syncHistory = [
    {
      id: 1,
      date: "2024-01-15 14:30",
      status: "success",
      records: 156,
      duration: "2.3s"
    },
    {
      id: 2,
      date: "2024-01-15 10:15",
      status: "success",
      records: 142,
      duration: "1.8s"
    },
    {
      id: 3,
      date: "2024-01-14 16:45",
      status: "error",
      records: 0,
      duration: "0s",
      error: "Authentication failed"
    }
  ];

  const fieldMappings = [
    { crmField: "Name", sheetColumn: "A", status: "mapped" },
    { crmField: "Email", sheetColumn: "B", status: "mapped" },
    { crmField: "Phone", sheetColumn: "C", status: "mapped" },
    { crmField: "Company", sheetColumn: "D", status: "mapped" },
    { crmField: "Status", sheetColumn: "E", status: "unmapped" },
    { crmField: "Source", sheetColumn: "F", status: "unmapped" }
  ];

  const handleSync = async () => {
    setSyncStatus("syncing");
    // Simulate sync operation
    await new Promise(resolve => setTimeout(resolve, 3000));
    setSyncStatus("success");
    setLastSync("Just now");
    setTimeout(() => setSyncStatus("idle"), 2000);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "sync":
        return <SyncTab isConnected={isConnected} onSync={handleSync} syncStatus={syncStatus} lastSync={lastSync} />;
      case "mapping":
        return <MappingTab fieldMappings={fieldMappings} />;
      case "history":
        return <HistoryTab syncHistory={syncHistory} />;
      case "settings":
        return <SettingsTab />;
      default:
        return <SyncTab isConnected={isConnected} onSync={handleSync} syncStatus={syncStatus} lastSync={lastSync} />;
    }
  };

  return (
    <div className="google-sheets">
      {/* Header Section */}
      <div className="gs-header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="page-title">Google Sheets Integration</h1>
            <p className="page-subtitle">Sync your CRM data with Google Sheets</p>
          </div>
          <div className="header-actions">
            <button className="btn btn-outline">
              <span className="btn-icon">📊</span>
              View Sheet
            </button>
            <button className="btn btn-primary">
              <span className="btn-icon">🔗</span>
              {isConnected ? 'Reconnect' : 'Connect'}
            </button>
          </div>
        </div>
      </div>

      {/* Connection Status */}
      <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
        <div className="status-indicator">
          <span className="status-dot"></span>
          <span className="status-text">
            {isConnected ? 'Connected to Google Sheets' : 'Not connected to Google Sheets'}
          </span>
        </div>
        {isConnected && (
          <div className="connection-info">
            <span className="info-item">
              <span className="info-label">Sheet ID:</span>
              <span className="info-value">1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms</span>
            </span>
            <span className="info-item">
              <span className="info-label">Last Sync:</span>
              <span className="info-value">{lastSync}</span>
            </span>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="gs-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`gs-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="gs-content">
        {renderContent()}
      </div>
    </div>
  );
};

// Sync Tab Component
const SyncTab = ({ isConnected, onSync, syncStatus, lastSync }) => (
  <div className="sync-tab">
    <div className="sync-status">
      <div className="status-card">
        <span className="status-icon">
          {isConnected ? '📊' : '❌'}
        </span>
        <h3 className="status-title">
          {isConnected ? 'Google Sheets Connected' : 'Not Connected'}
        </h3>
        <p className="status-description">
          {isConnected 
            ? 'Your CRM is connected to Google Sheets. You can sync data between both platforms.'
            : 'Connect your Google Sheets account to start syncing data with your CRM.'
          }
        </p>
        {isConnected && (
          <button
            className={`sync-button ${syncStatus}`}
            onClick={onSync}
            disabled={syncStatus === 'syncing'}
          >
            <span className="btn-icon">
              {syncStatus === 'syncing' ? '⏳' : '🔄'}
            </span>
            {syncStatus === 'syncing' ? 'Syncing...' : 'Sync Now'}
          </button>
        )}
      </div>
    </div>
    
    {isConnected && (
      <div className="sync-info">
        <div className="info-card">
          <span className="info-icon">📅</span>
          <div className="info-value">{lastSync}</div>
          <div className="info-label">Last Sync</div>
        </div>
        <div className="info-card">
          <span className="info-icon">📊</span>
          <div className="info-value">156</div>
          <div className="info-label">Records Synced</div>
        </div>
        <div className="info-card">
          <span className="info-icon">⚡</span>
          <div className="info-value">2.3s</div>
          <div className="info-label">Avg Sync Time</div>
        </div>
        <div className="info-card">
          <span className="info-icon">✅</span>
          <div className="info-value">98%</div>
          <div className="info-label">Success Rate</div>
        </div>
      </div>
    )}
  </div>
);

// Mapping Tab Component
const MappingTab = ({ fieldMappings }) => (
  <div className="mapping-tab">
    <div className="mapping-header">
      <h3>Field Mapping Configuration</h3>
      <p>Map your CRM fields to Google Sheets columns for accurate data synchronization</p>
    </div>
    
    <table className="mapping-table">
      <thead>
        <tr>
          <th>CRM Field</th>
          <th>Sheet Column</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {fieldMappings.map((mapping, index) => (
          <tr key={index}>
            <td>{mapping.crmField}</td>
            <td>{mapping.sheetColumn}</td>
            <td>
              <span className={`status-badge ${mapping.status}`}>
                {mapping.status}
              </span>
            </td>
            <td>
              <button className="btn btn-sm btn-outline">Edit</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    
    <div className="mapping-actions">
      <button className="btn">Add New Mapping</button>
      <button className="btn">Auto-Detect Fields</button>
      <button className="btn">Test Mapping</button>
    </div>
  </div>
);

// History Tab Component
const HistoryTab = ({ syncHistory }) => (
  <div className="history-tab">
    <div className="history-header">
      <h3>Sync History</h3>
      <p>Track all your data synchronization activities and identify any issues</p>
    </div>
    
    <div className="history-list">
      {syncHistory.map((item) => (
        <div key={item.id} className={`history-item ${item.status}`}>
          <div className="item-left">
            <div className="item-icon">
              {item.status === 'success' ? '✅' : '❌'}
            </div>
            <div className="item-details">
              <h4>Data Sync #{item.id}</h4>
              <p>
                {item.status === 'success' 
                  ? 'Successfully synced data to Google Sheets'
                  : `Error: ${item.error}`
                }
              </p>
            </div>
          </div>
          
          <div className="item-right">
            <div className="item-stats">
              <div className="stat">
                <span className="stat-value">{item.records}</span>
                <span className="stat-label">Records</span>
              </div>
              <div className="stat">
                <span className="stat-value">{item.duration}</span>
                <span className="stat-label">Duration</span>
              </div>
            </div>
            <div className="item-time">{item.date}</div>
            {item.status === 'error' && (
              <div className="error-message">{item.error}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Settings Tab Component
const SettingsTab = () => (
  <div className="settings-tab">
    <div className="settings-header">
      <h3>Integration Settings</h3>
      <p>Configure your Google Sheets integration preferences and automation rules</p>
    </div>
    
    <form className="settings-form">
      <div className="form-group">
        <label>Google Account</label>
        <input 
          type="email" 
          placeholder="your-email@gmail.com" 
          defaultValue="admin@company.com"
        />
      </div>
      
      <div className="form-row">
        <div className="form-group">
          <label>Sync Frequency</label>
          <select defaultValue="hourly">
            <option value="realtime">Real-time</option>
            <option value="hourly">Every Hour</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="manual">Manual Only</option>
          </select>
        </div>
        
        <div className="form-group">
          <label>Conflict Resolution</label>
          <select defaultValue="crm-wins">
            <option value="crm-wins">CRM Wins</option>
            <option value="sheet-wins">Sheet Wins</option>
            <option value="newest-wins">Newest Wins</option>
            <option value="manual">Manual Resolution</option>
          </select>
        </div>
      </div>
      
      <div className="form-group">
        <label>Sheet ID</label>
        <input 
          type="text" 
          placeholder="Enter Google Sheet ID" 
          defaultValue="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
        />
      </div>
      
      <div className="form-group">
        <label>Sync Rules</label>
        <textarea 
          rows="4" 
          placeholder="Define custom sync rules..."
          defaultValue="Sync all leads with status 'new' or 'contacted'"
        />
      </div>
      
      <div className="form-group">
        <div className="checkbox-group">
          <input type="checkbox" id="auto-sync" defaultChecked />
          <label htmlFor="auto-sync">Enable automatic synchronization</label>
        </div>
        
        <div className="checkbox-group">
          <input type="checkbox" id="notifications" defaultChecked />
          <label htmlFor="notifications">Send sync notifications</label>
        </div>
        
        <div className="checkbox-group">
          <input type="checkbox" id="backup" />
          <label htmlFor="backup">Create backup before sync</label>
        </div>
      </div>
      
      <div className="settings-actions">
        <button type="button" className="btn">Save Settings</button>
        <button type="button" className="btn btn-outline">Reset to Default</button>
      </div>
    </form>
  </div>
);

export default GoogleSheets;
