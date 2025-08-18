import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import MobileMenuToggle from "../components/MobileMenuToggle";
import WhatsAppConnect from "../components/WhatsAppConnect";
import WhatsAppLauncher from "../components/WhatsAppLauncher";
import GlobalMessagingSettings from "../components/GlobalMessagingSettings";
import KnowledgebaseEditor from "../components/KnowledgebaseEditor";
import LeadsTable from "../components/LeadsTable";
import {
  fetchUsage,
  updateSubscription,
  fetchPublicPlans,
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
        fetchPublicPlans(),
      ]);
      
      // Ensure plans is always an array
      const plansArray = Array.isArray(plansData) ? plansData : [];
      if (!Array.isArray(plansData)) {
        console.warn("Plans data is not an array:", plansData);
        setMessage("Warning: Unable to load subscription plans. Please refresh the page.");
      }
      
      if (plansArray.length === 0) {
        console.warn("No plans found");
        setMessage("Warning: No subscription plans found. Please contact support.");
      }
      
      setUsage(usageData);
      setPlans(plansArray);
    } catch (error) {
      console.error("Failed to load data:", error);
      if (error.message?.includes("401") || error.message?.includes("403")) {
        navigate("/login");
      } else {
        setMessage("Error loading data. Please refresh the page.");
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
      setMessage("Subscription plan updation request send");
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
    const res = await updateSheetsConfig(tenantId, sheetId, googleCredentials);
    setSheetConfigMessage(res.message || res.error || "Updated.");
    if (sheetId) setCurrentSheetId(sheetId);
  };

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    // Close mobile menu when tab is changed
    if (window.innerWidth <= 768) {
      setIsMobileMenuOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="main-content">
        <div className="container mt-5">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  if (!usage) {
    return (
      <div className="main-content">
        <div className="container mt-5">
          <div className="text-center">Access denied</div>
        </div>
      </div>
    );
  }

  const currentPlan = Array.isArray(plans) ? plans.find(
    (plan) => plan.planId === usage.tenant.subscriptionPlan
  ) : null;

  return (
    <div className="dashboard-layout">
      {/* Mobile Menu Toggle */}
      <div className="mobile-header">
        <MobileMenuToggle 
          onToggle={handleMobileMenuToggle} 
          isOpen={isMobileMenuOpen} 
        />
      </div>

      {/* Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={handleTabChange} 
        onLogout={handleLogout}
        isMobileOpen={isMobileMenuOpen}
      />

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="sidebar-overlay active" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="main-content">
        <div className="container-fluid p-4">
          {/* Message Alert */}
          {message && (
            <div
              className="alert alert-info alert-dismissible fade show"
              role="alert"
            >
              {message}
              <button
                type="button"
                className="btn-close"
                onClick={() => setMessage("")}
              ></button>
            </div>
          )}

          {/* Usage Overview Cards */}
          <div className="row mb-4">
            <div className="col-md-3">
              <div className="card text-center">
                <div className="card-body">
                  <h5 className="card-title">Current Plan</h5>
                  <h6 className="text-primary">
                    {currentPlan?.planName || "Unknown"}
                  </h6>
                  <small className="text-muted">₹{currentPlan?.price}/month</small>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card text-center">
                <div className="card-body">
                  <h5 className="card-title">Initial Messages</h5>
                  <h6 className="text-info">
                    {usage.usage.initialMessagesSent}/
                    {currentPlan?.initialMessageLimit}
                  </h6>
                  <div className="progress">
                    <div
                      className="progress-bar"
                      style={{
                        width: `${
                          (usage.usage.initialMessagesSent /
                            currentPlan?.initialMessageLimit) *
                          100
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card text-center">
                <div className="card-body">
                  <h5 className="card-title">AI Conversations</h5>
                  <h6 className="text-success">
                    {usage.usage.aiConversations}/{currentPlan?.conversationLimit}
                  </h6>
                  <div className="progress">
                    <div
                      className="progress-bar bg-success"
                      style={{
                        width: `${
                          (usage.usage.aiConversations /
                            currentPlan?.conversationLimit) *
                          100
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card text-center">
                <div className="card-body">
                  <h5 className="card-title">Follow-up Messages</h5>
                  <h6 className="text-warning">
                    {usage.usage.followupMessagesSent}/{currentPlan?.followupLimit}
                  </h6>
                  <div className="progress">
                    <div
                      className="progress-bar bg-warning"
                      style={{
                        width: `${
                          (usage.usage.followupMessagesSent /
                            currentPlan?.followupLimit) *
                          100
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Plan Upgrade Section */}
          <div className="row mb-4">
            <div className="col-12">
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title">Upgrade Plan</h5>
                  <div className="row">
                    {Array.isArray(plans) && plans.map((plan) => (
                      <div key={plan.planId} className="col-md-4 mb-3">
                        <div
                          className={`card ${
                            usage.tenant.subscriptionPlan === plan.planId
                              ? "border-primary"
                              : ""
                          }`}
                        >
                          <div className="card-body text-center">
                            <h6 className="card-title">{plan.planName}</h6>
                            <h5 className="text-primary">₹{plan.price}/month</h5>
                            <ul className="list-unstyled">
                              <li>{plan.initialMessageLimit} Initial Messages</li>
                              <li>{plan.conversationLimit} AI Conversations</li>
                              <li>{plan.followupLimit} Follow-up Messages</li>
                            </ul>
                            {usage.tenant.subscriptionPlan === plan.planId ? (
                              <button className="btn btn-outline-primary" disabled>
                                Current Plan
                              </button>
                            ) : (
                              <button
                                className="btn btn-primary"
                                onClick={() => handlePlanChange(plan.planId)}
                              >
                                Upgrade
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>



          {/* Tab Content */}
          <div className="tab-content">
            {activeTab === "dashboard" && (
              <div className="row">
                <div className="col-12">
                  <div className="card">
                    <div className="card-body">
                      <h5 className="card-title">Welcome to your Dashboard</h5>
                      <p>
                        Manage your WhatsApp autoresponder, leads, and AI responses
                        from here.
                      </p>
                      <div className="row">
                        <div className="col-md-4">
                          <div className="card bg-light">
                            <div className="card-body text-center">
                              <h6>Total Leads</h6>
                              <h4 className="text-primary">-</h4>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="card bg-light">
                            <div className="card-body text-center">
                              <h6>Messages Sent</h6>
                              <h4 className="text-success">
                                {usage.usage.initialMessagesSent}
                              </h4>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="card bg-light">
                            <div className="card-body text-center">
                              <h6>AI Conversations</h6>
                              <h4 className="text-info">
                                {usage.usage.aiConversations}
                              </h4>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "leads" && (
              <div className="card">
                <div className="card-body">
                  <LeadsTable tenantId={tenantId} />
                </div>
              </div>
            )}

            {activeTab === "settings" && (
              <div className="card">
                <div className="card-body">
                  <GlobalMessagingSettings tenantId={tenantId} />
                </div>
              </div>
            )}

            {activeTab === "knowledgebase" && (
              <div className="card">
                <div className="card-body">
                  <KnowledgebaseEditor tenantId={tenantId} />
                </div>
              </div>
            )}

            {activeTab === "whatsapp" && (
              <div className="card whatsapp-card">
                <div className="card-body">
                  <div className="row g-4 align-items-center">
                    <div className="col-md-6 left-pane">
                      {/* <h5 className="card-title mb-3">WhatsApp Connection</h5> */}
                      <WhatsAppConnect tenantId={tenantId} />
                    </div>
                    <div className="col-md-6 right-pane">
                      <h5 className="card-title mb-3">Launch WhatsApp</h5>
                      <p className="text-muted mb-3">
                        Launch WhatsApp Web with your saved session files. This will open WhatsApp in a new browser window with your authenticated session.
                      </p>
                      <WhatsAppLauncher tenantId={tenantId} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "sheets" && (
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title">Google Sheets Configuration</h5>
                  <form onSubmit={handleSheetConfigSubmit}>
                    <div className="mb-3">
                      <label className="form-label">Google Sheet ID</label>
                      <input
                        type="text"
                        className="form-control"
                        value={sheetId}
                        onChange={(e) => setSheetId(e.target.value)}
                        placeholder="Enter your Google Sheet ID"
                        required
                      />
                      {currentSheetId && (
                        <div className="form-text">
                          Current Sheet ID: <b>{currentSheetId}</b>
                        </div>
                      )}
                    </div>
                    <div className="mb-3">
                      <label className="form-label">
                        Google API Credentials (JSON)
                      </label>
                      <input
                        type="file"
                        className="form-control"
                        name="googleCredentials"
                        accept="application/json"
                        required
                      />
                    </div>
                    <button type="submit" className="btn btn-primary">
                      Save Sheets Config
                    </button>
                  </form>
                  {sheetConfigMessage && (
                    <div className="mt-2 text-info">{sheetConfigMessage}</div>
                  )}
                  <div className="form-text mt-2">
                    <b>How to get these details?</b>
                    <br />
                    1.{" "}
                    <a
                      href="https://console.cloud.google.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Google Cloud Console
                    </a>{" "}
                    → Create Project → Enable Google Sheets & Drive API
                    <br />
                    2. Create Service Account, download JSON key, and share your
                    sheet with the service account email.
                    <br />
                    3. Paste your Sheet ID from the Google Sheets URL.
                    <br />
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
