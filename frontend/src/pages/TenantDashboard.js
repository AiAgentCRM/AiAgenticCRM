import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import WhatsAppConnect from "../components/WhatsAppConnect";
import WhatsAppLauncher from "../components/WhatsAppLauncher";
import GlobalMessagingSettings from "../components/GlobalMessagingSettings";
import KnowledgebaseEditor from "../components/KnowledgebaseEditor";
import LeadsTable from "../components/LeadsTable";
import {
  fetchUsage,
  updateSubscription,
  fetchPlans,
  updateSheetsConfig,
} from "../services/api";

const TenantDashboard = () => {
  const { tenantId } = useParams();
  const navigate = useNavigate();
  const [usage, setUsage] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [message, setMessage] = useState("");
  const [sheetId, setSheetId] = useState("");
  const [sheetConfigMessage, setSheetConfigMessage] = useState("");
  const [currentSheetId, setCurrentSheetId] = useState("");
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(() => {
    // Check if user is authenticated and has access to this tenant
    const storedTenantId = localStorage.getItem("tenantId");
    const token = localStorage.getItem("token");

    if (!token || storedTenantId !== tenantId) {
      navigate("/login");
      return;
    }

    loadData();
  }, [tenantId, navigate]);

  const loadData = async () => {
    try {
      const [usageData, plansData] = await Promise.all([
        fetchUsage(tenantId),
        fetchPlans(),
      ]);
      if (!usageData || usageData.error || !usageData.tenant) {
        throw new Error("401 Unauthorized");
      }
      setUsage(usageData);
      setPlans(Array.isArray(plansData) ? plansData : []);
    } catch (error) {
      console.error("Failed to load data:", error);
      if (error.message?.includes("401") || error.message?.includes("403")) {
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (usage?.tenant && usage.tenant.googleSheetId) {
      setCurrentSheetId(usage.tenant.googleSheetId);
    }
  }, [usage]);

  const handlePlanChange = async (newPlan) => {
    try {
      await updateSubscription(tenantId, newPlan);
      setMessage("Subscription plan update request sent successfully!");
      loadData();
    } catch (error) {
      setMessage("Failed to update subscription plan");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("tenantId");
    localStorage.removeItem("businessName");
    localStorage.removeItem("ownerName");
    navigate("/login");
  };

  const handleSheetConfigSubmit = async (e) => {
    e.preventDefault();
    setSheetConfigMessage("");
    const fileInput = e.target.elements.googleCredentials;
    let googleCredentials = null;
    if (fileInput.files.length > 0) {
      const file = fileInput.files[0];
      const text = await file.text();
      try {
        googleCredentials = JSON.parse(text);
      } catch (err) {
        setSheetConfigMessage("Invalid JSON in credentials file.");
        return;
      }
    }

    try {
      await updateSheetsConfig(tenantId, {
        googleCredentials,
        sheetId: sheetId,
      });
      setSheetConfigMessage("Google Sheets configuration updated successfully!");
      setSheetId("");
      if (fileInput.files.length > 0) {
        fileInput.value = "";
      }
      loadData();
    } catch (error) {
      setSheetConfigMessage("Failed to update Google Sheets configuration.");
    }
  };

  const getUsagePercentage = (used, total) => {
    if (!total || total === 0) return 0;
    return Math.min((used / total) * 100, 100);
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 90) return "danger";
    if (percentage >= 75) return "warning";
    return "success";
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-container">
          <div className="loading-spinner">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
          <h4 className="loading-text">Loading your dashboard...</h4>
          <p className="loading-subtitle">Preparing your AI-powered CRM experience</p>
        </div>
      </div>
    );
  }

  if (!usage || !usage.tenant) {
    return (
      <div className="dashboard-error">
        <div className="error-container">
          <div className="error-icon">
            <i className="bi bi-exclamation-triangle"></i>
          </div>
          <h4>Unable to load dashboard</h4>
          <p>Please check your connection and try again.</p>
          <button className="btn btn-primary" onClick={loadData}>
            <i className="bi bi-arrow-clockwise me-2"></i>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const currentPlan = plans.find((plan) => plan.planId === usage.tenant.subscriptionPlan);

  return (
    <div className="dashboard-container">
      {/* Mobile Menu Toggle */}
      <div className="mobile-menu-toggle d-md-none">
        <button 
          className="mobile-toggle-btn"
          onClick={() => setShowMobileMenu(!showMobileMenu)}
        >
          <i className={`bi ${showMobileMenu ? 'bi-x-lg' : 'bi-list'}`}></i>
        </button>
      </div>

      <div className="dashboard-layout">
        {/* Sidebar */}
        <div className={`sidebar-container ${showMobileMenu ? 'show' : ''}`}>
          <Sidebar
            activeTab={activeTab}
            onSelectTab={(tab) => {
              setActiveTab(tab);
              setShowMobileMenu(false);
            }}
            onLogout={handleLogout}
            businessName={localStorage.getItem("businessName")}
            ownerName={localStorage.getItem("ownerName")}
          />
        </div>

        {/* Main Content */}
        <div className="main-content">
          {/* Enhanced Header */}
          <div className="dashboard-header">
            <div className="header-content">
              <div className="header-info">
                <div className="header-breadcrumb">
                  <span className="breadcrumb-item">Dashboard</span>
                  <i className="bi bi-chevron-right"></i>
                  <span className="breadcrumb-item active">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</span>
                </div>
                <h2 className="header-title">
                  <i className="bi bi-speedometer2 me-3"></i>
                  {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                </h2>
                <p className="header-subtitle">
                  Welcome back, <strong>{localStorage.getItem("ownerName")}</strong>! Ready to grow your business?
                </p>
              </div>
              <div className="header-actions">
                <div className="user-info">
                  <div className="user-avatar">
                    <i className="bi bi-person-circle"></i>
                  </div>
                  <div className="user-details">
                    <span className="user-name">{localStorage.getItem("ownerName")}</span>
                    <span className="user-role">{localStorage.getItem("businessName")}</span>
                  </div>
                  <div className="user-status">
                    <div className="status-dot online"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Alert Messages */}
          {message && (
            <div className="alert-container">
              <div className="alert alert-success alert-dismissible fade show custom-alert" role="alert">
                <div className="alert-icon">
                  <i className="bi bi-check-circle-fill"></i>
                </div>
                <div className="alert-content">
                  <strong>Success!</strong> {message}
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setMessage("")}
                ></button>
              </div>
            </div>
          )}

          {/* Dashboard Content */}
          <div className="dashboard-content">
            {activeTab === "dashboard" && (
              <div className="dashboard-overview">
                {/* Enhanced Welcome Section */}
                <div className="welcome-section">
                  <div className="welcome-card">
                    <div className="welcome-background">
                      <div className="welcome-pattern"></div>
                    </div>
                    <div className="welcome-content">
                      <div className="welcome-icon">
                        <i className="bi bi-robot"></i>
                      </div>
                      <div className="welcome-text">
                        <h3>Welcome to AiAgenticCRM</h3>
                        <p>Your AI-powered customer relationship management platform is ready to help you grow your business with intelligent automation and personalized customer interactions.</p>
                        <div className="welcome-features">
                          <span className="feature-tag">
                            <i className="bi bi-check-circle"></i>
                            AI-Powered Responses
                          </span>
                          <span className="feature-tag">
                            <i className="bi bi-check-circle"></i>
                            WhatsApp Integration
                          </span>
                          <span className="feature-tag">
                            <i className="bi bi-check-circle"></i>
                            Lead Management
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enhanced Usage Overview Cards */}
                <div className="usage-overview">
                  <div className="section-header">
                    <h4 className="section-title">
                      <i className="bi bi-graph-up me-3"></i>
                      Usage Overview
                    </h4>
                    <p className="section-subtitle">Monitor your current plan usage and limits</p>
                  </div>
                  <div className="usage-cards">
                    <div className="usage-card plan-card">
                      <div className="card-header">
                        <div className="card-icon plan-icon">
                          <i className="bi bi-award"></i>
                        </div>
                        <div className="card-badge current">Current</div>
                      </div>
                      <div className="card-content">
                        <h5>Current Plan</h5>
                        <h3 className="text-primary">{currentPlan?.planName || "Unknown"}</h3>
                        <p className="text-muted">₹{currentPlan?.price}/month</p>
                        <div className="plan-features">
                          <span className="feature">
                            <i className="bi bi-chat-dots"></i>
                            {currentPlan?.initialMessageLimit} Messages
                          </span>
                          <span className="feature">
                            <i className="bi bi-robot"></i>
                            {currentPlan?.conversationLimit} AI Chats
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="usage-card">
                      <div className="card-header">
                        <div className="card-icon messages-icon">
                          <i className="bi bi-chat-dots"></i>
                        </div>
                        <div className="card-badge usage">Usage</div>
                      </div>
                      <div className="card-content">
                        <h5>Initial Messages</h5>
                        <h3 className="text-info">
                          {usage.usage.initialMessagesSent}/{currentPlan?.initialMessageLimit}
                        </h3>
                        <div className="progress-container">
                          <div className="progress">
                            <div
                              className={`progress-bar bg-${getProgressColor(getUsagePercentage(usage.usage.initialMessagesSent, currentPlan?.initialMessageLimit))}`}
                              style={{
                                width: `${getUsagePercentage(usage.usage.initialMessagesSent, currentPlan?.initialMessageLimit)}%`,
                              }}
                            ></div>
                          </div>
                          <span className="progress-text">
                            {Math.round(getUsagePercentage(usage.usage.initialMessagesSent, currentPlan?.initialMessageLimit))}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="usage-card">
                      <div className="card-header">
                        <div className="card-icon ai-icon">
                          <i className="bi bi-cpu"></i>
                        </div>
                        <div className="card-badge usage">Usage</div>
                      </div>
                      <div className="card-content">
                        <h5>AI Conversations</h5>
                        <h3 className="text-success">
                          {usage.usage.aiConversations}/{currentPlan?.conversationLimit}
                        </h3>
                        <div className="progress-container">
                          <div className="progress">
                            <div
                              className={`progress-bar bg-${getProgressColor(getUsagePercentage(usage.usage.aiConversations, currentPlan?.conversationLimit))}`}
                              style={{
                                width: `${getUsagePercentage(usage.usage.aiConversations, currentPlan?.conversationLimit)}%`,
                              }}
                            ></div>
                          </div>
                          <span className="progress-text">
                            {Math.round(getUsagePercentage(usage.usage.aiConversations, currentPlan?.conversationLimit))}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="usage-card">
                      <div className="card-header">
                        <div className="card-icon followup-icon">
                          <i className="bi bi-arrow-repeat"></i>
                        </div>
                        <div className="card-badge usage">Usage</div>
                      </div>
                      <div className="card-content">
                        <h5>Follow-up Messages</h5>
                        <h3 className="text-warning">
                          {usage.usage.followupMessagesSent}/{currentPlan?.followupLimit}
                        </h3>
                        <div className="progress-container">
                          <div className="progress">
                            <div
                              className={`progress-bar bg-${getProgressColor(getUsagePercentage(usage.usage.followupMessagesSent, currentPlan?.followupLimit))}`}
                              style={{
                                width: `${getUsagePercentage(usage.usage.followupMessagesSent, currentPlan?.followupLimit)}%`,
                              }}
                            ></div>
                          </div>
                          <span className="progress-text">
                            {Math.round(getUsagePercentage(usage.usage.followupMessagesSent, currentPlan?.followupLimit))}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enhanced Quick Stats */}
                <div className="quick-stats">
                  <div className="section-header">
                    <h4 className="section-title">
                      <i className="bi bi-bar-chart me-3"></i>
                      Quick Statistics
                    </h4>
                    <p className="section-subtitle">Real-time insights into your business performance</p>
                  </div>
                  <div className="stats-grid">
                    <div className="stat-card">
                      <div className="stat-icon">
                        <i className="bi bi-people"></i>
                      </div>
                      <div className="stat-content">
                        <h3>Total Leads</h3>
                        <h2 className="text-primary">-</h2>
                        <p className="text-muted">Manage your leads</p>
                        <div className="stat-trend">
                          <i className="bi bi-arrow-up text-success"></i>
                          <span className="trend-text">Coming soon</span>
                        </div>
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-icon">
                        <i className="bi bi-chat-square-text"></i>
                      </div>
                      <div className="stat-content">
                        <h3>Messages Sent</h3>
                        <h2 className="text-success">{usage.usage.initialMessagesSent}</h2>
                        <p className="text-muted">This month</p>
                        <div className="stat-trend">
                          <i className="bi bi-arrow-up text-success"></i>
                          <span className="trend-text">Active</span>
                        </div>
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-icon">
                        <i className="bi bi-robot"></i>
                      </div>
                      <div className="stat-content">
                        <h3>AI Conversations</h3>
                        <h2 className="text-info">{usage.usage.aiConversations}</h2>
                        <p className="text-muted">Active conversations</p>
                        <div className="stat-trend">
                          <i className="bi bi-arrow-up text-success"></i>
                          <span className="trend-text">Growing</span>
                        </div>
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-icon">
                        <i className="bi bi-gear"></i>
                      </div>
                      <div className="stat-content">
                        <h3>System Status</h3>
                        <h2 className="text-success">Active</h2>
                        <p className="text-muted">All systems operational</p>
                        <div className="stat-trend">
                          <i className="bi bi-check-circle text-success"></i>
                          <span className="trend-text">Online</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enhanced Plan Upgrade Section */}
                <div className="plan-upgrade-section">
                  <div className="section-header">
                    <h4 className="section-title">
                      <i className="bi bi-star me-3"></i>
                      Upgrade Your Plan
                    </h4>
                    <p className="section-subtitle">Choose the perfect plan for your business growth</p>
                  </div>
                  <div className="plans-grid">
                    {plans.map((plan) => (
                      <div key={plan.planId} className={`plan-card ${usage.tenant.subscriptionPlan === plan.planId ? 'current' : ''}`}>
                        <div className="plan-header">
                          <div className="plan-icon">
                            <i className={`bi ${plan.planId === 'silver' ? 'bi-award' : plan.planId === 'gold' ? 'bi-award-fill' : 'bi-gem'}`}></i>
                          </div>
                          <h5>{plan.planName}</h5>
                          <div className="plan-price">
                            <span className="price">₹{plan.price}</span>
                            <span className="period">/month</span>
                          </div>
                          {usage.tenant.subscriptionPlan === plan.planId && (
                            <div className="current-badge">
                              <i className="bi bi-check-circle"></i>
                              Current Plan
                            </div>
                          )}
                        </div>
                        <div className="plan-features">
                          <ul>
                            <li>
                              <i className="bi bi-check-circle-fill text-success"></i>
                              {plan.initialMessageLimit} Initial Messages
                            </li>
                            <li>
                              <i className="bi bi-check-circle-fill text-success"></i>
                              {plan.conversationLimit} AI Conversations
                            </li>
                            <li>
                              <i className="bi bi-check-circle-fill text-success"></i>
                              {plan.followupLimit} Follow-up Messages
                            </li>
                            {plan.features && plan.features.length > 0 && (
                              <li>
                                <i className="bi bi-check-circle-fill text-success"></i>
                                {plan.features.join(", ")}
                              </li>
                            )}
                          </ul>
                        </div>
                        <div className="plan-action">
                          {usage.tenant.subscriptionPlan === plan.planId ? (
                            <button className="btn btn-outline-primary w-100" disabled>
                              <i className="bi bi-check-circle me-2"></i>
                              Current Plan
                            </button>
                          ) : (
                            <button
                              className="btn btn-primary w-100"
                              onClick={() => handlePlanChange(plan.planId)}
                            >
                              <i className="bi bi-arrow-up-circle me-2"></i>
                              Upgrade
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "leads" && (
              <div className="leads-section">
                <div className="section-header">
                  <h4 className="section-title">
                    <i className="bi bi-people me-3"></i>
                    Lead Management
                  </h4>
                  <p className="section-subtitle">Manage and track your leads efficiently with AI-powered insights</p>
                </div>
                <div className="leads-content">
                  <LeadsTable tenantId={tenantId} />
                </div>
              </div>
            )}

            {activeTab === "settings" && (
              <div className="settings-section">
                <div className="section-header">
                  <h4 className="section-title">
                    <i className="bi bi-gear me-3"></i>
                    Global Settings
                  </h4>
                  <p className="section-subtitle">Configure your messaging preferences and system settings</p>
                </div>
                <div className="settings-content">
                  <GlobalMessagingSettings tenantId={tenantId} />
                </div>
              </div>
            )}

            {activeTab === "knowledgebase" && (
              <div className="knowledgebase-section">
                <div className="section-header">
                  <h4 className="section-title">
                    <i className="bi bi-journal-text me-3"></i>
                    Knowledge Base
                  </h4>
                  <p className="section-subtitle">Train your AI with custom knowledge to provide better responses</p>
                </div>
                <div className="knowledgebase-content">
                  <KnowledgebaseEditor tenantId={tenantId} />
                </div>
              </div>
            )}

            {activeTab === "whatsapp" && (
              <div className="whatsapp-section">
                <div className="section-header">
                  <h4 className="section-title">
                    <i className="bi bi-chat-dots me-3"></i>
                    WhatsApp Integration
                  </h4>
                  <p className="section-subtitle">Connect and manage your WhatsApp business account</p>
                </div>
                <div className="whatsapp-content">
                  <div className="whatsapp-grid">
                    <div className="whatsapp-card">
                      <h5 className="card-title">
                        <i className="bi bi-link-45deg me-2"></i>
                        WhatsApp Connection
                      </h5>
                      <p className="card-subtitle">Connect your WhatsApp account to start automated messaging</p>
                      <WhatsAppConnect tenantId={tenantId} />
                    </div>
                    <div className="whatsapp-card">
                      <h5 className="card-title">
                        <i className="bi bi-play-circle me-2"></i>
                        WhatsApp Launcher
                      </h5>
                      <p className="card-subtitle">Launch WhatsApp Web for manual operations</p>
                      <WhatsAppLauncher tenantId={tenantId} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "sheets" && (
              <div className="sheets-section">
                <div className="section-header">
                  <h4 className="section-title">
                    <i className="bi bi-table me-3"></i>
                    Google Sheets Configuration
                  </h4>
                  <p className="section-subtitle">Sync your leads and data with Google Sheets</p>
                </div>
                <div className="sheets-content">
                  <div className="sheets-card">
                    <div className="card-header">
                      <h5 className="card-title">
                        <i className="bi bi-gear me-2"></i>
                        Configuration Settings
                      </h5>
                      <p className="card-subtitle">Set up Google Sheets integration for seamless data synchronization</p>
                    </div>
                    <form onSubmit={handleSheetConfigSubmit} className="sheets-form">
                      <div className="form-group">
                        <label className="form-label">
                          <i className="bi bi-file-earmark-text me-2"></i>
                          Google Service Account Credentials (JSON)
                        </label>
                        <input
                          type="file"
                          name="googleCredentials"
                          className="form-control"
                          accept=".json"
                        />
                        <small className="form-text">
                          Upload your Google Service Account JSON credentials file
                        </small>
                      </div>
                      <div className="form-group">
                        <label className="form-label">
                          <i className="bi bi-link me-2"></i>
                          Google Sheet ID
                        </label>
                        <input
                          type="text"
                          value={sheetId}
                          onChange={(e) => setSheetId(e.target.value)}
                          className="form-control"
                          placeholder="Enter Google Sheet ID"
                        />
                        <small className="form-text">
                          The ID from your Google Sheet URL (e.g., 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms)
                        </small>
                      </div>
                      {currentSheetId && (
                        <div className="current-sheet-info">
                          <div className="info-badge">
                            <i className="bi bi-info-circle me-2"></i>
                            Current Sheet ID: {currentSheetId}
                          </div>
                        </div>
                      )}
                      <button type="submit" className="btn btn-primary">
                        <i className="bi bi-save me-2"></i>
                        Save Configuration
                      </button>
                    </form>
                    {sheetConfigMessage && (
                      <div className="config-message">
                        <div className={`alert ${sheetConfigMessage.includes('successfully') ? 'alert-success' : 'alert-danger'}`}>
                          <i className={`bi ${sheetConfigMessage.includes('successfully') ? 'bi-check-circle' : 'bi-exclamation-triangle'} me-2`}></i>
                          {sheetConfigMessage}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenantDashboard;
