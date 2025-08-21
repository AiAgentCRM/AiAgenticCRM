import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import MobileMenuToggle from "../components/MobileMenuToggle";
import WhatsAppConnect from "../components/WhatsAppConnect";
import WhatsAppLauncher from "../components/WhatsAppLauncher";
// Import new page components
import LeadsManagement from "./LeadsManagement";
import GlobalSettings from "./GlobalSettings";
import KnowledgeBase from "./KnowledgeBase";
import GoogleSheets from "./GoogleSheets";
import useToast from "../hooks/useToast";
import {
  fetchUsage,
  updateSubscription,
  fetchPublicPlans,
  updateSheetsConfig
} from "../services/api";

const TenantDashboard = () => {
  const { tenantId } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError, showWarning, showInfo } = useToast();
  const [usage, setUsage] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
   const [sheetId, setSheetId] = useState("");
  const [currentSheetId, setCurrentSheetId] = useState("");
  const [sheetConfigMessage, setSheetConfigMessage] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Handle sidebar collapse state
  const handleSidebarCollapse = (collapsed) => {
    setIsSidebarCollapsed(collapsed);
  };

  // Handle mobile menu toggle
  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };



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

  useEffect(() => {
    if (usage?.tenant && usage.tenant.googleSheetId) {
      setCurrentSheetId(usage.tenant.googleSheetId);
    }
  }, [usage]);


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
        showWarning("Unable to load subscription plans. Please refresh the page.");
      }
      
      if (plansArray.length === 0) {
        console.warn("No plans found");
        showWarning("No subscription plans found. Please contact support.");
      }
      
      setUsage(usageData);
      setPlans(plansArray);
    } catch (error) {
      console.error("Failed to load data:", error);
      if (error.message?.includes("401") || error.message?.includes("403")) {
        navigate("/login");
      } else {
        showError("Error loading data. Please refresh the page.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePlanChange = async (newPlan) => {
    try {
      await updateSubscription(tenantId, newPlan);
      showSuccess("Subscription plan update request sent successfully!");
      loadData();
    } catch (error) {
      showError("Failed to update subscription plan. Please try again.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("tenantId");
    localStorage.removeItem("businessName");
    localStorage.removeItem("ownerName");
    navigate("/login");
  };

  // handleSheetConfigSubmit function is removed
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
      {/* Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={handleTabChange} 
        onLogout={handleLogout}
        isMobileOpen={isMobileMenuOpen}
        isSidebarCollapsed={isSidebarCollapsed}
        onSidebarCollapse={handleSidebarCollapse}
      />

      {/* Mobile Menu Toggle */}
      <div className="mobile-header">
        <MobileMenuToggle 
          onToggle={handleMobileMenuToggle} 
          isOpen={isMobileMenuOpen} 
        />
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="sidebar-overlay active" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className={`main-content ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <div className="container-fluid p-4" style={{marginTop:"2%"}}>


          {/* Dashboard Content - Only show when dashboard tab is active */}
          {activeTab === "dashboard" && (
            <>
              {/* Dashboard Header */}
              <div className="dashboard-header mb-4">
                <div className="row align-items-center">
                  <div className="col-md-8">
                    <h1 className="dashboard-title">Welcome back, {localStorage.getItem("ownerName") || "User"}! 👋</h1>
                    <p className="dashboard-subtitle">Here's what's happening with your CRM today</p>
                  </div>
                  <div className="col-md-4 text-end">
                    <div className="current-date">
                      <span className="date-icon">📅</span>
                      <span className="date-text">{new Date().toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}</span>
                    </div>
                  </div>
                </div>
              </div>

                             {/* Usage Overview Cards */}
               <div className="row mb-4">
                                   <div className="col-lg-3 col-md-6 mb-3">
                    <div 
                      className="dashboard-card current-plan"
                      style={{
                        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                        borderRadius: '16px',
                        padding: '16px',
                        boxShadow: '0 6px 24px rgba(245, 158, 11, 0.15)',
                        border: '2px solid #f59e0b',
                        transition: 'all 0.3s ease',
                        height: '100%',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                    >
                      <div 
                        style={{
                          position: 'absolute',
                          top: '0',
                          left: '0',
                          right: '0',
                          height: '4px',
                          background: 'linear-gradient(90deg, #f59e0b, #d97706)'
                        }}
                      ></div>
                      <div 
                        className="card-icon"
                        style={{
                          marginBottom: '12px',
                          textAlign: 'center'
                        }}
                      >
                        <span 
                          className="icon"
                          style={{
                            fontSize: '2rem',
                            display: 'block',
                            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text'
                          }}
                        >💎</span>
                      </div>
                      <div className="card-content">
                        <h6 
                          className="card-title"
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            color: '#6b7280',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            marginBottom: '8px'
                          }}
                        >Current Plan</h6>
                        <h4 
                          className="card-value"
                          style={{
                            fontSize: '1.8rem',
                            fontWeight: '700',
                            color: '#1f2937',
                            marginBottom: '6px'
                          }}
                        >{currentPlan?.planName || "Unknown"}</h4>
                        <p 
                          className="card-subtitle"
                          style={{
                            color: '#6b7280',
                            fontSize: '0.9rem',
                            marginBottom: '12px',
                            fontWeight: '500'
                          }}
                        >₹{currentPlan?.price}/month</p>
                        <div 
                          className="plan-badge"
                          style={{
                            display: 'inline-block',
                            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                            color: 'white',
                            padding: '6px 12px',
                            borderRadius: '20px',
                            fontSize: '0.7rem',
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            boxShadow: '0 4px 15px rgba(245, 158, 11, 0.3)'
                          }}
                        >
                          <span className="badge-text">Active</span>
                        </div>
                      </div>
                    </div>
                  </div>
                 
                                   <div className="col-lg-3 col-md-6 mb-3">
                    <div 
                      className="dashboard-card messages-card"
                      style={{
                        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                        borderRadius: '16px',
                        padding: '16px',
                        boxShadow: '0 6px 24px rgba(59, 130, 246, 0.15)',
                        border: '2px solid #3b82f6',
                        transition: 'all 0.3s ease',
                        height: '100%',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                    >
                      <div 
                        style={{
                          position: 'absolute',
                          top: '0',
                          left: '0',
                          right: '0',
                          height: '4px',
                          background: 'linear-gradient(90deg, #3b82f6, #1d4ed8)'
                        }}
                      ></div>
                      <div 
                        className="card-icon"
                        style={{
                          marginBottom: '12px',
                          textAlign: 'center'
                        }}
                      >
                        <span 
                          className="icon"
                          style={{
                            fontSize: '2rem',
                            display: 'block',
                            background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text'
                          }}
                        >📨</span>
                      </div>
                      <div className="card-content">
                        <h6 
                          className="card-title"
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            color: '#6b7280',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            marginBottom: '8px'
                          }}
                        >Initial Messages</h6>
                        <h4 
                          className="card-value"
                          style={{
                            fontSize: '1.8rem',
                            fontWeight: '700',
                            color: '#1f2937',
                            marginBottom: '6px'
                          }}
                        >
                          {usage.usage.initialMessagesSent}
                          <span 
                            className="limit-text"
                            style={{
                              fontSize: '1rem',
                              color: '#9ca3af',
                              fontWeight: '500'
                            }}
                          >/{currentPlan?.initialMessageLimit}</span>
                        </h4>
                        <div 
                          className="progress-container"
                          style={{
                            marginTop: '12px'
                          }}
                        >
                          <div 
                            className="progress"
                            style={{
                              height: '8px',
                              background: '#f3f4f6',
                              borderRadius: '6px',
                              overflow: 'hidden',
                              marginBottom: '8px',
                              border: '1px solid #e5e7eb'
                            }}
                          >
                            <div
                              className="progress-bar"
                              style={{
                                height: '100%',
                                background: 'linear-gradient(90deg, #3b82f6, #1d4ed8)',
                                borderRadius: '6px',
                                transition: 'width 0.6s ease',
                                width: `${Math.min(
                                  (usage.usage.initialMessagesSent /
                                    currentPlan?.initialMessageLimit) *
                                  100, 100
                                )}%`,
                              }}
                            ></div>
                          </div>
                          <span 
                            className="progress-text"
                            style={{
                              fontSize: '0.7rem',
                              color: '#6b7280',
                              fontWeight: '600'
                            }}
                          >
                            {Math.round(
                              (usage.usage.initialMessagesSent /
                                currentPlan?.initialMessageLimit) *
                              100
                            )}% used
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                 
                                   <div className="col-lg-3 col-md-6 mb-3">
                    <div 
                      className="dashboard-card conversations-card"
                      style={{
                        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                        borderRadius: '16px',
                        padding: '16px',
                        boxShadow: '0 6px 24px rgba(16, 185, 129, 0.15)',
                        border: '2px solid #10b981',
                        transition: 'all 0.3s ease',
                        height: '100%',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                    >
                      <div 
                        style={{
                          position: 'absolute',
                          top: '0',
                          left: '0',
                          right: '0',
                          height: '4px',
                          background: 'linear-gradient(90deg, #10b981, #059669)'
                        }}
                      ></div>
                      <div 
                        className="card-icon"
                        style={{
                          marginBottom: '12px',
                          textAlign: 'center'
                        }}
                      >
                        <span 
                          className="icon"
                          style={{
                            fontSize: '2rem',
                            display: 'block',
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text'
                          }}
                        >🤖</span>
                      </div>
                      <div className="card-content">
                        <h6 
                          className="card-title"
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            color: '#6b7280',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            marginBottom: '8px'
                          }}
                        >AI Conversations</h6>
                        <h4 
                          className="card-value"
                          style={{
                            fontSize: '1.8rem',
                            fontWeight: '700',
                            color: '#1f2937',
                            marginBottom: '6px'
                          }}
                        >
                          {usage.usage.aiConversations}
                          <span 
                            className="limit-text"
                            style={{
                              fontSize: '1rem',
                              color: '#9ca3af',
                              fontWeight: '500'
                            }}
                          >/{currentPlan?.conversationLimit}</span>
                        </h4>
                        <div 
                          className="progress-container"
                          style={{
                            marginTop: '12px'
                          }}
                        >
                          <div 
                            className="progress"
                            style={{
                              height: '8px',
                              background: '#f3f4f6',
                              borderRadius: '6px',
                              overflow: 'hidden',
                              marginBottom: '8px',
                              border: '1px solid #e5e7eb'
                            }}
                          >
                            <div
                              className="progress-bar bg-success"
                              style={{
                                height: '100%',
                                background: 'linear-gradient(90deg, #10b981, #059669)',
                                borderRadius: '6px',
                                transition: 'width 0.6s ease',
                                width: `${Math.min(
                                  (usage.usage.aiConversations /
                                    currentPlan?.conversationLimit) *
                                  100, 100
                                )}%`,
                              }}
                            ></div>
                          </div>
                          <span 
                            className="progress-text"
                            style={{
                              fontSize: '0.7rem',
                              color: '#6b7280',
                              fontWeight: '600'
                            }}
                          >
                            {Math.round(
                              (usage.usage.aiConversations /
                                currentPlan?.conversationLimit) *
                              100
                            )}% used
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                 
                                   <div className="col-lg-3 col-md-6 mb-3">
                    <div 
                      className="dashboard-card followup-card"
                      style={{
                        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                        borderRadius: '16px',
                        padding: '16px',
                        boxShadow: '0 6px 24px rgba(245, 158, 11, 0.15)',
                        border: '2px solid #f59e0b',
                        transition: 'all 0.3s ease',
                        height: '100%',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                    >
                      <div 
                        style={{
                          position: 'absolute',
                          top: '0',
                          left: '0',
                          right: '0',
                          height: '4px',
                          background: 'linear-gradient(90deg, #f59e0b, #d97706)'
                        }}
                      ></div>
                      <div 
                        className="card-icon"
                        style={{
                          marginBottom: '12px',
                          textAlign: 'center'
                        }}
                      >
                        <span 
                          className="icon"
                          style={{
                            fontSize: '2rem',
                            display: 'block',
                            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text'
                          }}
                        >🔄</span>
                      </div>
                      <div className="card-content">
                        <h6 
                          className="card-title"
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            color: '#6b7280',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            marginBottom: '8px'
                          }}
                        >Follow-up Messages</h6>
                        <h4 
                          className="card-value"
                          style={{
                            fontSize: '1.8rem',
                            fontWeight: '700',
                            color: '#1f2937',
                            marginBottom: '6px'
                          }}
                        >
                          {usage.usage.followupMessagesSent}
                          <span 
                            className="limit-text"
                            style={{
                              fontSize: '1rem',
                              color: '#9ca3af',
                              fontWeight: '500'
                            }}
                          >/{currentPlan?.followupLimit}</span>
                        </h4>
                        <div 
                          className="progress-container"
                          style={{
                            marginTop: '12px'
                          }}
                        >
                          <div 
                            className="progress"
                            style={{
                              height: '8px',
                              background: '#f3f4f6',
                              borderRadius: '6px',
                              overflow: 'hidden',
                              marginBottom: '8px',
                              border: '1px solid #e5e7eb'
                            }}
                          >
                            <div
                              className="progress-bar bg-warning"
                              style={{
                                height: '100%',
                                background: 'linear-gradient(90deg, #f59e0b, #d97706)',
                                borderRadius: '6px',
                                transition: 'width 0.6s ease',
                                width: `${Math.min(
                                  (usage.usage.followupMessagesSent /
                                    currentPlan?.followupLimit) *
                                  100, 100
                                )}%`,
                              }}
                            ></div>
                          </div>
                          <span 
                            className="progress-text"
                            style={{
                              fontSize: '0.7rem',
                              color: '#6b7280',
                              fontWeight: '600'
                            }}
                          >
                            {Math.round(
                              (usage.usage.followupMessagesSent /
                                currentPlan?.followupLimit) *
                              100
                            )}% used
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
               </div>

              {/* Quick Stats Row */}
              <div className="row mb-4">
                <div className="col-md-4 mb-3">
                  <div className="quick-stat-card">
                    <div className="stat-icon">📊</div>
                    <div className="stat-content">
                      <h5 className="stat-number">24</h5>
                      <p className="stat-label">New Leads This Week</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-4 mb-3">
                  <div className="quick-stat-card">
                    <div className="stat-icon">💬</div>
                    <div className="stat-content">
                      <h5 className="stat-number">156</h5>
                      <p className="stat-label">Total Conversations</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-4 mb-3">
                  <div className="quick-stat-card">
                    <div className="stat-icon">📈</div>
                    <div className="stat-content">
                      <h5 className="stat-number">89%</h5>
                      <p className="stat-label">Response Rate</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Plan Upgrade Section */}
              <div className="row mb-4">
                <div className="col-12">
                  <div className="upgrade-section">
                    <div className="section-header">
                      <h3 className="section-title">📦 Subscription Plans</h3>
                      <p className="section-subtitle">Choose the perfect plan for your business needs</p>
                    </div>
                    <div className="plans-grid">
                      {Array.isArray(plans) && plans.map((plan) => (
                        <div key={plan.planId} className={`plan-card ${usage.tenant.subscriptionPlan === plan.planId ? 'current' : ''}`}>
                          <div className="plan-header">
                            <div className="plan-name">{plan.planName}</div>
                            <div className="plan-price">₹{plan.price}<span className="price-period">/month</span></div>
                          </div>
                          <div className="plan-features">
                            <div className="feature-item">
                              <span className="feature-icon">📨</span>
                              <span className="feature-text">{plan.initialMessageLimit} Initial Messages</span>
                            </div>
                            <div className="feature-item">
                              <span className="feature-icon">🤖</span>
                              <span className="feature-text">{plan.conversationLimit} AI Conversations</span>
                            </div>
                            <div className="feature-item">
                              <span className="feature-icon">🔄</span>
                              <span className="feature-text">{plan.followupLimit} Follow-up Messages</span>
                            </div>
                          </div>
                          <div className="plan-actions" style={{ textAlign: 'center', marginTop: '20px' }}>
                            {usage.tenant.subscriptionPlan === plan.planId ? (
                              <button 
                                className="btn btn-current-plan" 
                                disabled
                                style={{
                                  background: 'linear-gradient(135deg, #10b981, #059669)',
                                  color: 'white',
                                  border: 'none',
                                  padding: '12px 24px',
                                  borderRadius: '25px',
                                  fontWeight: '600',
                                  fontSize: '0.9rem',
                                  cursor: 'default',
                                  boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
                                  transition: 'all 0.3s ease',
                                  opacity: '0.8'
                                }}
                              >
                                <span className="btn-icon" style={{ marginRight: '8px' }}>✅</span>
                                Current Plan
                              </button>
                            ) : (
                              <button
                                className="btn btn-upgrade"
                                onClick={async (e) => {
                                  // Show processing toast
                                  showInfo('Processing your upgrade request...', { duration: 3000 });
                                  
                                  // Disable button after click
                                  e.target.disabled = true;
                                  e.target.style.background = 'linear-gradient(135deg, #9ca3af, #6b7280)';
                                  e.target.style.cursor = 'not-allowed';
                                  e.target.style.opacity = '0.6';
                                  e.target.innerHTML = '<span style="marginRight: 8px">⏳</span>Processing...';
                                  
                                  try {
                                    await handlePlanChange(plan.planId);
                                    // Reset button to initial state after success
                                    e.target.disabled = false;
                                    e.target.style.background = 'linear-gradient(135deg, #667eea, #764ba2)';
                                    e.target.style.cursor = 'pointer';
                                    e.target.style.opacity = '1';
                                    e.target.innerHTML = '<span style="marginRight: 8px">🚀</span>Upgrade';
                                  } catch (error) {
                                    // Reset button to initial state after error
                                    e.target.disabled = false;
                                    e.target.style.background = 'linear-gradient(135deg, #667eea, #764ba2)';
                                    e.target.style.cursor = 'pointer';
                                    e.target.style.opacity = '1';
                                    e.target.innerHTML = '<span style="marginRight: 8px">🚀</span>Upgrade';
                                    showError('Failed to process upgrade request. Please try again.');
                                  }
                                }}
                                style={{
                                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                                  color: 'white',
                                  border: 'none',
                                  padding: '12px 24px',
                                  borderRadius: '25px',
                                  fontWeight: '600',
                                  fontSize: '0.9rem',
                                  cursor: 'pointer',
                                  boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
                                  transition: 'all 0.3s ease',
                                  position: 'relative',
                                  overflow: 'hidden'
                                }}
                                onMouseEnter={(e) => {
                                  if (!e.target.disabled) {
                                    e.target.style.transform = 'translateY(-2px)';
                                    e.target.style.background = 'linear-gradient(135deg, #5a67d8, #6b46c1)';
                                    e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (!e.target.disabled) {
                                    e.target.style.transform = 'translateY(0)';
                                    e.target.style.background = 'linear-gradient(135deg, #667eea, #764ba2)';
                                    e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)';
                                  }
                                }}
                                onMouseDown={(e) => {
                                  if (!e.target.disabled) {
                                    e.target.style.transform = 'translateY(0)';
                                  }
                                }}
                                onMouseUp={(e) => {
                                  if (!e.target.disabled) {
                                    e.target.style.transform = 'translateY(-2px)';
                                  }
                                }}
                              >
                                <span className="btn-icon" style={{ marginRight: '8px' }}>🚀</span>
                                Upgrade
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Dashboard Welcome Section */}
              <div className="row">
                <div className="col-12">
                  <div className="welcome-section">
                    <div className="welcome-content">
                      <div className="welcome-header">
                        <h3 className="welcome-title">🎯 Quick Actions</h3>
                        <p className="welcome-subtitle">Get started with these common tasks</p>
                      </div>
                      <div 
                        className="quick-actions-row"
                        style={{
                          display: 'flex',
                          flexDirection: 'row',
                          gap: '20px',
                          overflowX: 'auto',
                          padding: '10px 0',
                          flexWrap: 'nowrap',
                          justifyContent: 'space-between',
                          alignItems: 'stretch',
                          width: '100%',
                          maxWidth: '100%',
                          margin: '0'
                        }}
                      >
                        <div 
                          className="action-card"
                          style={{
                            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                            borderRadius: '16px',
                            padding: '24px',
                            textAlign: 'center',
                            border: '1px solid #e5e7eb',
                            transition: 'all 0.3s ease',
                            flex: '0 0 auto',
                            minWidth: '250px',
                            maxWidth: '280px',
                            width: '250px'
                          }}
                        >
                          <div className="action-icon">👥</div>
                          <h5 className="action-title">Manage Leads</h5>
                          <p className="action-description">View and organize your leads</p>
                          <button 
                            className="btn btn-action"
                            style={{
                              background: 'linear-gradient(135deg, #667eea, #764ba2)',
                              color: 'white',
                              border: '2px solid #667eea',
                              padding: '10px 20px',
                              borderRadius: '8px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease',
                              fontSize: '0.9rem'
                            }}
                            onClick={() => {
                              showInfo('Navigating to Leads Management...', { duration: 2000 });
                              handleTabChange("leads");
                            }}
                          >
                            Go to Leads
                          </button>
                        </div>
                        <div 
                          className="action-card"
                          style={{
                            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                            borderRadius: '16px',
                            padding: '24px',
                            textAlign: 'center',
                            border: '1px solid #e5e7eb',
                            transition: 'all 0.3s ease',
                            flex: '0 0 auto',
                            minWidth: '250px',
                            maxWidth: '280px',
                            width: '250px'
                          }}
                        >
                          <div className="action-icon">📱</div>
                          <h5 className="action-title">WhatsApp Setup</h5>
                          <p className="action-description">Configure WhatsApp integration</p>
                          <button 
                            className="btn btn-action"
                            style={{
                              background: 'linear-gradient(135deg, #667eea, #764ba2)',
                              color: 'white',
                              border: '2px solid #667eea',
                              padding: '10px 20px',
                              borderRadius: '8px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease',
                              fontSize: '0.9rem'
                            }}
                            onClick={() => {
                              showInfo('Opening WhatsApp Setup...', { duration: 2000 });
                              handleTabChange("whatsapp");
                            }}
                          >
                            Setup WhatsApp
                          </button>
                        </div>
                        <div 
                          className="action-card"
                          style={{
                            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                            borderRadius: '16px',
                            padding: '24px',
                            textAlign: 'center',
                            border: '1px solid #e5e7eb',
                            transition: 'all 0.3s ease',
                            flex: '0 0 auto',
                            minWidth: '250px',
                            maxWidth: '280px',
                            width: '250px'
                          }}
                        >
                          <div className="action-icon">🔧</div>
                          <h5 className="action-title">Global Settings</h5>
                          <p className="action-description">Configure system settings</p>
                          <button 
                            className="btn btn-action"
                            style={{
                              background: 'linear-gradient(135deg, #667eea, #764ba2)',
                              color: 'white',
                              border: '2px solid #667eea',
                              padding: '10px 20px',
                              borderRadius: '8px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease',
                              fontSize: '0.9rem'
                            }}
                            onClick={() => {
                              showInfo('Opening Global Settings...', { duration: 2000 });
                              handleTabChange("settings");
                            }}
                          >
                            Open Settings
                          </button>
                        </div>
                        <div 
                          className="action-card"
                          style={{
                            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                            borderRadius: '16px',
                            padding: '24px',
                            textAlign: 'center',
                            border: '1px solid #e5e7eb',
                            transition: 'all 0.3s ease',
                            flex: '0 0 auto',
                            minWidth: '250px',
                            maxWidth: '280px',
                            width: '250px'
                          }}
                        >
                          <div className="action-icon">🧠</div>
                          <h5 className="action-title">Knowledge Base</h5>
                          <p className="action-description">Edit AI knowledge base</p>
                          <button 
                            className="btn btn-action"
                            style={{
                              background: 'linear-gradient(135deg, #667eea, #764ba2)',
                              color: 'white',
                              border: '2px solid #667eea',
                              padding: '10px 20px',
                              borderRadius: '8px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease',
                              fontSize: '0.9rem'
                            }}
                            onClick={() => {
                              showInfo('Opening Knowledge Base Editor...', { duration: 2000 });
                              handleTabChange("knowledgebase");
                            }}
                          >
                            Edit KB
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Tab Content - Only show when NOT on dashboard tab */}
          {activeTab !== "dashboard" && (
            <div className="tab-content">
              {activeTab === "leads" && (
                <LeadsManagement tenantId={tenantId} />
              )}

              {activeTab === "settings" && (
                <GlobalSettings tenantId={tenantId} />
              )}

              {activeTab === "knowledgebase" && (
                <KnowledgeBase tenantId={tenantId} />
              )}

              {activeTab === "whatsapp" && (
                <div className="card">
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

              {/* {activeTab === "sheets" && (
                // <GoogleSheets tenantId={tenantId} />
                 <GoogleSheets 
                tenantId={tenantId}
                currentSheetId={currentSheetId}
                onSheetIdUpdate={handleSheetIdUpdate}
              />
              )} */}


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
          )}
        </div>
      </div>
    </div>
  );
};

export default TenantDashboard;
