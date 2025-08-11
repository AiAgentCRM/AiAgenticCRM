import React, { useState, useEffect } from "react";
import AdminSidebar from "../components/AdminSidebar";
import {
  fetchTenants,
  approveTenant,
  blockTenant,
  unblockTenant,
  fetchPlans,
  createPlan,
  updatePlan,
  deletePlan,
  fetchTenantStats,
  createOrUpdatePlan,
  fetchPlanRequests,
  deleteTenant,
  approvePlanRequest,
  resetTenantUsage,
  deduplicateLeads,
  fetchLeads,
  fetchCompanyDetails,
  updateCompanyDetails,
  uploadCompanyLogo,
} from "../services/api";

const SuperAdmin = () => {
  const [tenants, setTenants] = useState([]);
  const [plans, setPlans] = useState([]);
  const [planRequests, setPlanRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [editingPlan, setEditingPlan] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [tenantStats, setTenantStats] = useState(null);
  const [leads, setLeads] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("businessName");
  const [sortOrder, setSortOrder] = useState("asc");
  const [showCreatePlanModal, setShowCreatePlanModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [companyDetails, setCompanyDetails] = useState(null);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tenantsData, plansData, planRequestsData, companyData] = await Promise.all([
        fetchTenants(),
        fetchPlans(),
        fetchPlanRequests(),
        fetchCompanyDetails(),
      ]);
      setTenants(tenantsData);
      setPlans(plansData);
      setPlanRequests(planRequestsData);
      setCompanyDetails(companyData);
    } catch (error) {
      console.error("Failed to load data:", error);
      showMessage("Failed to load data. Please refresh the page.", "danger");
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (msg, type = "info") => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(""), 5000);
  };

  const handleTenantAction = async (action, tenantId) => {
    try {
      let response;
      switch (action) {
        case "approve":
          response = await approveTenant(tenantId);
          break;
        case "block":
          response = await blockTenant(tenantId);
          break;
        case "unblock":
          response = await unblockTenant(tenantId);
          break;
        case "delete":
          response = await deleteTenant(tenantId);
          break;
        case "reset-usage":
          response = await resetTenantUsage(tenantId);
          break;
        case "deduplicate-leads":
          response = await deduplicateLeads(tenantId);
          showMessage("Leads deduplicated successfully", "success");
          await fetchLeads(tenantId);
          break;
        default:
          return;
      }
      showMessage(response.message || "Action completed successfully", "success");
      loadData();
    } catch (error) {
      showMessage("Action failed. Please try again.", "danger");
    }
  };

  const handlePlanSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const planData = {
      planId: formData.get("planId"),
      planName: formData.get("planName"),
      price: Number(formData.get("price")),
      initialMessageLimit: Number(formData.get("initialMessageLimit")),
      conversationLimit: Number(formData.get("conversationLimit")),
      followupLimit: Number(formData.get("followupLimit")),
      features: formData
        .get("features")
        .split(",")
        .map((f) => f.trim()),
    };

    try {
      await createOrUpdatePlan(planData);
      showMessage("Plan updated successfully", "success");
      setShowCreatePlanModal(false);
      loadData();
    } catch (error) {
      showMessage("Failed to update plan", "danger");
    }
  };

  const handlePlanRequest = async (tenantId, approve) => {
    try {
      const data = await approvePlanRequest(tenantId, approve);
      showMessage(data.message || "Plan request processed", "success");
      loadData();
    } catch (error) {
      showMessage("Failed to process plan request", "danger");
    }
  };

  const handleEditPlan = (plan) => {
    setEditingPlan(plan);
    setShowCreatePlanModal(true);
  };

  const handleDeletePlan = async (planId) => {
    try {
      await deletePlan(planId);
      showMessage("Plan deleted successfully", "success");
      loadData();
    } catch (error) {
      showMessage("Failed to delete plan", "danger");
    }
  };

  const handlePlanFormSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const planData = {
      planId: formData.get("planId"),
      planName: formData.get("planName"),
      price: Number(formData.get("price")),
      initialMessageLimit: Number(formData.get("initialMessageLimit")),
      conversationLimit: Number(formData.get("conversationLimit")),
      followupLimit: Number(formData.get("followupLimit")),
      features: formData.get("features").split(",").map((f) => f.trim()),
    };
    
    try {
      if (editingPlan) {
        await updatePlan(editingPlan.planId, planData);
        showMessage("Plan updated successfully", "success");
      } else {
        await createPlan(planData);
        showMessage("Plan created successfully", "success");
      }
      setEditingPlan(null);
      setShowCreatePlanModal(false);
      loadData();
    } catch (error) {
      showMessage("Failed to save plan", "danger");
    }
  };

  const handleShowStats = async (tenantId) => {
    try {
      const stats = await fetchTenantStats(tenantId);
      setTenantStats(stats);
      setShowStats(true);
    } catch (error) {
      showMessage("Failed to load tenant stats", "danger");
    }
  };

  const handleLogout = () => {
    // Clear any admin session data
    localStorage.removeItem('adminToken');
    window.location.href = '/login';
  };

  const handleCompanySubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const companyData = {
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      address: formData.get("address"),
      city: formData.get("city"),
      state: formData.get("state"),
      country: formData.get("country"),
      zipCode: formData.get("zipCode"),
      website: formData.get("website"),
      description: formData.get("description"),
    };

    try {
      // Upload logo if selected
      if (logoFile) {
        const logoResponse = await uploadCompanyLogo(logoFile);
        if (logoResponse.success) {
          companyData.logo = logoResponse.logoUrl;
        }
      }

      // Update company details
      const response = await updateCompanyDetails(companyData);
      if (response.success) {
        showMessage("Company details updated successfully", "success");
        setShowCompanyModal(false);
        setEditingCompany(null);
        setLogoFile(null);
        setLogoPreview(null);
        loadData();
      } else {
        showMessage(response.message || "Failed to update company details", "danger");
      }
    } catch (error) {
      console.error("Failed to update company details:", error);
      showMessage("Failed to update company details", "danger");
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setLogoPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleEditCompany = () => {
    setEditingCompany(companyDetails);
    setShowCompanyModal(true);
  };

  const filteredTenants = tenants
    .filter((tenant) => {
      const matchesSearch = tenant.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           tenant.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           tenant.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = filterStatus === "all" ||
                           (filterStatus === "active" && tenant.isActive) ||
                           (filterStatus === "blocked" && !tenant.isActive) ||
                           (filterStatus === "pending" && !tenant.isApproved) ||
                           (filterStatus === "approved" && tenant.isApproved);
      
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      
      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const getStats = () => {
    const totalTenants = tenants.length;
    const activeTenants = tenants.filter(t => t.isActive).length;
    const pendingTenants = tenants.filter(t => !t.isApproved).length;
    const totalPlans = plans.length;
    const pendingRequests = planRequests.length;

    return { totalTenants, activeTenants, pendingTenants, totalPlans, pendingRequests };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      {/* Sidebar */}
      <AdminSidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onLogout={handleLogout}
        isOpen={sidebarOpen}
        stats={stats}
      />

      {/* Main Content */}
      <div className="admin-main-content">
        {/* Header */}
        <div className="admin-header">
          <div className="header-content">
            <div className="header-left">
              <button 
                className="sidebar-toggle"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <i className="bi bi-list"></i>
              </button>
              <div className="header-info">
                <h1 className="admin-title">
                  <i className="bi bi-shield-check"></i>
                  AiAgenticCRM Admin Panel
                </h1>
                <p className="admin-subtitle">Super Admin Dashboard</p>
              </div>
            </div>
            <div className="header-right">
              <div className="admin-actions">
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowCreatePlanModal(true)}
                >
                  <i className="bi bi-plus-circle"></i>
                  Create Plan
                </button>
                <button 
                  className="btn btn-outline-secondary"
                  onClick={loadData}
                >
                  <i className="bi bi-arrow-clockwise"></i>
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </div>

      {/* Alert Messages */}
      {message && (
        <div className={`alert alert-${messageType} alert-dismissible fade show admin-alert`} role="alert">
          <i className={`bi ${messageType === 'success' ? 'bi-check-circle' : messageType === 'danger' ? 'bi-exclamation-triangle' : 'bi-info-circle'}`}></i>
          {message}
          <button type="button" className="btn-close" onClick={() => setMessage("")}></button>
        </div>
      )}

        {/* Content Area */}
        <div className="admin-content">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="overview-section">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon total">
                  <i className="bi bi-people-fill"></i>
                </div>
                <div className="stat-content">
                  <h3>{stats.totalTenants}</h3>
                  <p>Total Tenants</p>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon active">
                  <i className="bi bi-check-circle-fill"></i>
                </div>
                <div className="stat-content">
                  <h3>{stats.activeTenants}</h3>
                  <p>Active Tenants</p>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon pending">
                  <i className="bi bi-clock-fill"></i>
                </div>
                <div className="stat-content">
                  <h3>{stats.pendingTenants}</h3>
                  <p>Pending Approval</p>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon plans">
                  <i className="bi bi-credit-card-fill"></i>
                </div>
                <div className="stat-content">
                  <h3>{stats.totalPlans}</h3>
                  <p>Subscription Plans</p>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon requests">
                  <i className="bi bi-exclamation-circle-fill"></i>
                </div>
                <div className="stat-content">
                  <h3>{stats.pendingRequests}</h3>
                  <p>Pending Requests</p>
                </div>
              </div>
            </div>

            <div className="quick-actions">
              <h4>Quick Actions</h4>
              <div className="actions-grid">
                <button 
                  className="action-btn"
                  onClick={() => setActiveTab("tenants")}
                >
                  <i className="bi bi-people"></i>
                  Manage Tenants
                </button>
                <button 
                  className="action-btn"
                  onClick={() => setShowCreatePlanModal(true)}
                >
                  <i className="bi bi-plus-circle"></i>
                  Create New Plan
                </button>
                <button 
                  className="action-btn"
                  onClick={() => setActiveTab("requests")}
                >
                  <i className="bi bi-clock-history"></i>
                  Review Requests
                </button>
                <button 
                  className="action-btn"
                  onClick={loadData}
                >
                  <i className="bi bi-arrow-clockwise"></i>
                  Refresh Data
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tenants Tab */}
        {activeTab === "tenants" && (
          <div className="tenants-section">
            <div className="section-header">
              <h3>Manage Tenants</h3>
              <div className="filters">
                <div className="search-box">
                  <i className="bi bi-search"></i>
                  <input
                    type="text"
                    placeholder="Search tenants..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="form-control"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="form-select"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="blocked">Blocked</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                </select>
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split('-');
                    setSortBy(field);
                    setSortOrder(order);
                  }}
                  className="form-select"
                >
                  <option value="businessName-asc">Name (A-Z)</option>
                  <option value="businessName-desc">Name (Z-A)</option>
                  <option value="email-asc">Email (A-Z)</option>
                  <option value="email-desc">Email (Z-A)</option>
                </select>
              </div>
            </div>

            <div className="table-container">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Business Name</th>
                    <th>Owner</th>
                    <th>Email</th>
                    <th>Plan</th>
                    <th>Status</th>
                    <th>Approval</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTenants.map((tenant) => (
                    <tr key={tenant.tenantId}>
                      <td>
                        <div className="tenant-info">
                          <strong>{tenant.businessName}</strong>
                          <small className="text-muted">ID: {tenant.tenantId}</small>
                        </div>
                      </td>
                      <td>{tenant.ownerName}</td>
                      <td>{tenant.email}</td>
                      <td>
                        <span className={`plan-badge ${tenant.subscriptionPlan}`}>
                          {tenant.subscriptionPlan}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${tenant.isActive ? 'active' : 'blocked'}`}>
                          {tenant.isActive ? 'Active' : 'Blocked'}
                        </span>
                      </td>
                      <td>
                        <span className={`approval-badge ${tenant.isApproved ? 'approved' : 'pending'}`}>
                          {tenant.isApproved ? 'Approved' : 'Pending'}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn btn-sm btn-info"
                            onClick={() => handleShowStats(tenant.tenantId)}
                            title="View Stats"
                          >
                            <i className="bi bi-graph-up"></i>
                          </button>
                          {!tenant.isApproved && (
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => handleTenantAction("approve", tenant.tenantId)}
                              title="Approve"
                            >
                              <i className="bi bi-check"></i>
                            </button>
                          )}
                          {tenant.isActive ? (
                            <button
                              className="btn btn-sm btn-warning"
                              onClick={() => handleTenantAction("block", tenant.tenantId)}
                              title="Block"
                            >
                              <i className="bi bi-pause"></i>
                            </button>
                          ) : (
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => handleTenantAction("unblock", tenant.tenantId)}
                              title="Unblock"
                            >
                              <i className="bi bi-play"></i>
                            </button>
                          )}
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => handleTenantAction("reset-usage", tenant.tenantId)}
                            title="Reset Usage"
                          >
                            <i className="bi bi-arrow-clockwise"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-outline-warning"
                            onClick={() => handleTenantAction('deduplicate-leads', tenant.tenantId)}
                            title="Deduplicate Leads"
                          >
                            <i className="bi bi-funnel"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => {
                              setSelectedTenant(tenant);
                              setShowDeleteConfirm(true);
                            }}
                            title="Delete"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Plans Tab */}
        {activeTab === "plans" && (
          <div className="plans-section">
            <div className="section-header">
              <h3>Subscription Plans</h3>
              <button 
                className="btn btn-primary"
                onClick={() => {
                  setEditingPlan(null);
                  setShowCreatePlanModal(true);
                }}
              >
                <i className="bi bi-plus-circle"></i>
                Create New Plan
              </button>
            </div>

            <div className="plans-grid">
              {plans.map((plan) => (
                <div key={plan.planId} className="plan-card">
                  <div className="plan-header">
                    <div className="plan-icon">
                      <i className={`bi ${plan.planId === 'silver' ? 'bi-award' : plan.planId === 'gold' ? 'bi-award-fill' : 'bi-gem'}`}></i>
                    </div>
                    <h5>{plan.planName}</h5>
                    <div className="plan-price">
                      <span className="price">₹{plan.price}</span>
                      <span className="period">/month</span>
                    </div>
                  </div>
                  
                  <div className="plan-features">
                    <div className="feature">
                      <i className="bi bi-chat-dots"></i>
                      <span>{plan.initialMessageLimit} Initial Messages</span>
                    </div>
                    <div className="feature">
                      <i className="bi bi-robot"></i>
                      <span>{plan.conversationLimit} AI Conversations</span>
                    </div>
                    <div className="feature">
                      <i className="bi bi-arrow-repeat"></i>
                      <span>{plan.followupLimit} Follow-up Messages</span>
                    </div>
                    {plan.features && plan.features.length > 0 && (
                      <div className="feature">
                        <i className="bi bi-star"></i>
                        <span>{plan.features.join(", ")}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="plan-actions">
                    <button 
                      className="btn btn-outline-primary btn-sm"
                      onClick={() => handleEditPlan(plan)}
                    >
                      <i className="bi bi-pencil"></i>
                      Edit
                    </button>
                    <button 
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => handleDeletePlan(plan.planId)}
                    >
                      <i className="bi bi-trash"></i>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Requests Tab */}
        {activeTab === "requests" && (
          <div className="requests-section">
            <div className="section-header">
              <h3>Plan Change Requests</h3>
              <span className="request-count">{planRequests.length} pending requests</span>
            </div>

            {planRequests.length === 0 ? (
              <div className="empty-state">
                <i className="bi bi-check-circle"></i>
                <h4>No Pending Requests</h4>
                <p>All plan change requests have been processed.</p>
              </div>
            ) : (
              <div className="requests-grid">
                {planRequests.map((req) => (
                  <div key={req.tenantId} className="request-card">
                    <div className="request-header">
                      <div className="tenant-info">
                        <h6>{req.businessName}</h6>
                        <p>{req.ownerName} • {req.email}</p>
                      </div>
                      <div className="request-status pending">
                        <i className="bi bi-clock"></i>
                        Pending
                      </div>
                    </div>
                    
                    <div className="plan-change">
                      <div className="current-plan">
                        <span className="label">Current:</span>
                        <span className="plan-name">{req.currentPlan}</span>
                      </div>
                      <div className="change-arrow">
                        <i className="bi bi-arrow-right"></i>
                      </div>
                      <div className="requested-plan">
                        <span className="label">Requested:</span>
                        <span className="plan-name">{req.requestedPlan}</span>
                      </div>
                    </div>
                    
                    <div className="request-meta">
                      <span className="request-date">
                        <i className="bi bi-calendar"></i>
                        {new Date(req.requestedAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="request-actions">
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => handlePlanRequest(req.tenantId, true)}
                      >
                        <i className="bi bi-check"></i>
                        Approve
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handlePlanRequest(req.tenantId, false)}
                      >
                        <i className="bi bi-x"></i>
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Company Details Tab */}
        {activeTab === "company" && (
          <div className="company-section">
            <div className="section-header">
              <h3>Company Details</h3>
              <button 
                className="btn btn-primary"
                onClick={handleEditCompany}
              >
                <i className="bi bi-pencil me-2"></i>
                {companyDetails ? "Edit Details" : "Add Details"}
              </button>
            </div>

            {companyDetails ? (
              <div className="company-details-card">
                <div className="company-header">
                  <div className="company-logo">
                    {companyDetails.logo ? (
                      <img src={companyDetails.logo} alt="Company Logo" />
                    ) : (
                      <div className="logo-placeholder">
                        <i className="bi bi-building"></i>
                      </div>
                    )}
                  </div>
                  <div className="company-info">
                    <h4>{companyDetails.name || "Company Name"}</h4>
                    <p className="company-description">{companyDetails.description || "No description available"}</p>
                  </div>
                </div>

                <div className="company-details-grid">
                  <div className="detail-item">
                    <div className="detail-icon">
                      <i className="bi bi-envelope"></i>
                    </div>
                    <div className="detail-content">
                      <label>Email</label>
                      <span>{companyDetails.email || "Not provided"}</span>
                    </div>
                  </div>

                  <div className="detail-item">
                    <div className="detail-icon">
                      <i className="bi bi-telephone"></i>
                    </div>
                    <div className="detail-content">
                      <label>Phone</label>
                      <span>{companyDetails.phone || "Not provided"}</span>
                    </div>
                  </div>

                  <div className="detail-item">
                    <div className="detail-icon">
                      <i className="bi bi-globe"></i>
                    </div>
                    <div className="detail-content">
                      <label>Website</label>
                      <span>
                        {companyDetails.website ? (
                          <a href={companyDetails.website} target="_blank" rel="noopener noreferrer">
                            {companyDetails.website}
                          </a>
                        ) : (
                          "Not provided"
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="detail-item">
                    <div className="detail-icon">
                      <i className="bi bi-geo-alt"></i>
                    </div>
                    <div className="detail-content">
                      <label>Address</label>
                      <span>
                        {companyDetails.address ? (
                          <>
                            {companyDetails.address}<br />
                            {companyDetails.city && `${companyDetails.city}, `}
                            {companyDetails.state && `${companyDetails.state} `}
                            {companyDetails.zipCode && `${companyDetails.zipCode}`}<br />
                            {companyDetails.country}
                          </>
                        ) : (
                          "Not provided"
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <i className="bi bi-building"></i>
                <h4>No Company Details</h4>
                <p>Add your company information to display it across the platform.</p>
                <button 
                  className="btn btn-primary"
                  onClick={handleEditCompany}
                >
                  <i className="bi bi-plus-circle me-2"></i>
                  Add Company Details
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      
      {/* Create/Edit Plan Modal */}
      {showCreatePlanModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h5>{editingPlan ? "Edit Plan" : "Create New Plan"}</h5>
              <button 
                className="btn-close"
                onClick={() => {
                  setShowCreatePlanModal(false);
                  setEditingPlan(null);
                }}
              ></button>
            </div>
            <form onSubmit={handlePlanFormSubmit}>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Plan ID</label>
                      <input
                        type="text"
                        name="planId"
                        className="form-control"
                        defaultValue={editingPlan?.planId || ""}
                        required
                        disabled={!!editingPlan}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Plan Name</label>
                      <input
                        type="text"
                        name="planName"
                        className="form-control"
                        defaultValue={editingPlan?.planName || ""}
                        required
                      />
                    </div>
                  </div>
                </div>
                
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Price (₹/month)</label>
                      <input
                        type="number"
                        name="price"
                        className="form-control"
                        min="0"
                        step="0.01"
                        defaultValue={editingPlan?.price || ""}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Initial Message Limit</label>
                      <input
                        type="number"
                        name="initialMessageLimit"
                        className="form-control"
                        min="1"
                        defaultValue={editingPlan?.initialMessageLimit || ""}
                        required
                      />
                    </div>
                  </div>
                </div>
                
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">AI Conversation Limit</label>
                      <input
                        type="number"
                        name="conversationLimit"
                        className="form-control"
                        min="1"
                        defaultValue={editingPlan?.conversationLimit || ""}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Follow-up Message Limit</label>
                      <input
                        type="number"
                        name="followupLimit"
                        className="form-control"
                        min="1"
                        defaultValue={editingPlan?.followupLimit || ""}
                        required
                      />
                    </div>
                  </div>
                </div>
                
                <div className="mb-3">
                  <label className="form-label">Features (comma-separated)</label>
                  <input
                    type="text"
                    name="features"
                    className="form-control"
                    defaultValue={editingPlan?.features?.join(", ") || ""}
                    placeholder="e.g., Priority Support, Advanced Analytics, Custom Branding"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowCreatePlanModal(false);
                    setEditingPlan(null);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingPlan ? "Update Plan" : "Create Plan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedTenant && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h5>Confirm Deletion</h5>
              <button 
                className="btn-close"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setSelectedTenant(null);
                }}
              ></button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete the tenant <strong>{selectedTenant.businessName}</strong>?</p>
              <p className="text-danger">This action cannot be undone and will permanently remove all tenant data.</p>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setSelectedTenant(null);
                }}
              >
                Cancel
              </button>
              <button 
                className="btn btn-danger"
                onClick={() => {
                  handleTenantAction("delete", selectedTenant.tenantId);
                  setShowDeleteConfirm(false);
                  setSelectedTenant(null);
                }}
              >
                Delete Tenant
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tenant Stats Modal */}
      {showStats && tenantStats && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h5>Tenant Statistics</h5>
              <button 
                className="btn-close"
                onClick={() => setShowStats(false)}
              ></button>
            </div>
            <div className="modal-body">
              <div className="stats-grid">
                <div className="stat-item">
                  <label>Business Name</label>
                  <span>{tenantStats.tenant.businessName}</span>
                </div>
                <div className="stat-item">
                  <label>Current Plan</label>
                  <span>{tenantStats.plan?.planName || 'Unknown'}</span>
                </div>
                <div className="stat-item">
                  <label>Total Leads</label>
                  <span>{tenantStats.leadCount}</span>
                </div>
                <div className="stat-item">
                  <label>Initial Messages Sent</label>
                  <span>{tenantStats.usage.initialMessagesSent}</span>
                </div>
                <div className="stat-item">
                  <label>AI Conversations</label>
                  <span>{tenantStats.usage.aiConversations}</span>
                </div>
                <div className="stat-item">
                  <label>Follow-up Messages</label>
                  <span>{tenantStats.usage.followupMessagesSent}</span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowStats(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Company Details Modal */}
      {showCompanyModal && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <div className="modal-header">
              <h5>{editingCompany ? "Edit Company Details" : "Add Company Details"}</h5>
              <button 
                className="btn-close"
                onClick={() => {
                  setShowCompanyModal(false);
                  setEditingCompany(null);
                  setLogoFile(null);
                  setLogoPreview(null);
                }}
              ></button>
            </div>
            <form onSubmit={handleCompanySubmit}>
              <div className="modal-body">
                {/* Logo Upload Section */}
                <div className="logo-upload-section">
                  <h6 className="section-title">
                    <i className="bi bi-image me-2"></i>
                    Company Logo
                  </h6>
                  <div className="logo-upload-area">
                    <div className="logo-preview">
                      {logoPreview ? (
                        <img src={logoPreview} alt="Logo Preview" />
                      ) : editingCompany?.logo ? (
                        <img src={editingCompany.logo} alt="Current Logo" />
                      ) : (
                        <div className="logo-placeholder">
                          <i className="bi bi-building"></i>
                          <span>No Logo</span>
                        </div>
                      )}
                    </div>
                    <div className="logo-upload-controls">
                      <input
                        type="file"
                        id="logo-upload"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="form-control"
                        style={{ display: 'none' }}
                      />
                      <label htmlFor="logo-upload" className="btn btn-outline-primary">
                        <i className="bi bi-upload me-2"></i>
                        {editingCompany?.logo ? "Change Logo" : "Upload Logo"}
                      </label>
                      {logoPreview && (
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => {
                            setLogoFile(null);
                            setLogoPreview(null);
                          }}
                        >
                          <i className="bi bi-trash me-1"></i>
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <hr />

                {/* Basic Information */}
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">
                        <i className="bi bi-building me-2"></i>
                        Company Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        className="form-control"
                        defaultValue={editingCompany?.name || ""}
                        required
                        placeholder="Enter company name"
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">
                        <i className="bi bi-envelope me-2"></i>
                        Email Address *
                      </label>
                      <input
                        type="email"
                        name="email"
                        className="form-control"
                        defaultValue={editingCompany?.email || ""}
                        required
                        placeholder="Enter email address"
                      />
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">
                        <i className="bi bi-telephone me-2"></i>
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        className="form-control"
                        defaultValue={editingCompany?.phone || ""}
                        placeholder="Enter phone number"
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">
                        <i className="bi bi-globe me-2"></i>
                        Website
                      </label>
                      <input
                        type="url"
                        name="website"
                        className="form-control"
                        defaultValue={editingCompany?.website || ""}
                        placeholder="https://example.com"
                      />
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">
                    <i className="bi bi-text-paragraph me-2"></i>
                    Company Description
                  </label>
                  <textarea
                    name="description"
                    className="form-control"
                    rows="3"
                    defaultValue={editingCompany?.description || ""}
                    placeholder="Enter company description"
                  ></textarea>
                </div>

                <hr />

                {/* Address Information */}
                <h6 className="section-title">
                  <i className="bi bi-geo-alt me-2"></i>
                  Address Information
                </h6>

                <div className="mb-3">
                  <label className="form-label">Street Address</label>
                  <input
                    type="text"
                    name="address"
                    className="form-control"
                    defaultValue={editingCompany?.address || ""}
                    placeholder="Enter street address"
                  />
                </div>

                <div className="row">
                  <div className="col-md-4">
                    <div className="mb-3">
                      <label className="form-label">City</label>
                      <input
                        type="text"
                        name="city"
                        className="form-control"
                        defaultValue={editingCompany?.city || ""}
                        placeholder="Enter city"
                      />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <label className="form-label">State/Province</label>
                      <input
                        type="text"
                        name="state"
                        className="form-control"
                        defaultValue={editingCompany?.state || ""}
                        placeholder="Enter state"
                      />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <label className="form-label">ZIP/Postal Code</label>
                      <input
                        type="text"
                        name="zipCode"
                        className="form-control"
                        defaultValue={editingCompany?.zipCode || ""}
                        placeholder="Enter ZIP code"
                      />
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">Country</label>
                  <input
                    type="text"
                    name="country"
                    className="form-control"
                    defaultValue={editingCompany?.country || ""}
                    placeholder="Enter country"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowCompanyModal(false);
                    setEditingCompany(null);
                    setLogoFile(null);
                    setLogoPreview(null);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <i className="bi bi-save me-2"></i>
                  {editingCompany ? "Update Details" : "Save Details"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default SuperAdmin;
