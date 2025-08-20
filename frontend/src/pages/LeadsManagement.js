import React, { useState, useEffect } from "react";
import LeadsTable from "../components/LeadsTable";
import "./LeadsManagement.css";

const LeadsManagement = ({ tenantId }) => {
  const [activeView, setActiveView] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const views = [
    { id: "all", label: "All Leads", icon: "👥" },
    { id: "new", label: "New Leads", icon: "🆕" },
    { id: "contacted", label: "Contacted", icon: "📞" },
    { id: "qualified", label: "Qualified", icon: "✅" },
    { id: "converted", label: "Converted", icon: "💰" },
    { id: "lost", label: "Lost", icon: "❌" }
  ];

  const statusOptions = [
    { value: "all", label: "All Status" },
    { value: "new", label: "New" },
    { value: "contacted", label: "Contacted" },
    { value: "qualified", label: "Qualified" },
    { value: "converted", label: "Converted" },
    { value: "lost", label: "Lost" }
  ];

  return (
    <div className="leads-management">
      {/* Header Section */}
      {/* <div className="leads-header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="page-title">Leads Management</h1>
            <p className="page-subtitle">Manage and track your leads effectively</p>
          </div>
          <div className="header-actions">
            <button className="btn btn-primary">
              <span className="btn-icon">➕</span>
              Add New Lead
            </button>
            <button className="btn btn-outline">
              <span className="btn-icon">📥</span>
              Import Leads
            </button>
          </div>
        </div>
      </div> */}

      {/* View Tabs */}
      {/* <div className="view-tabs">
        {views.map((view) => (
          <button
            key={view.id}
            className={`view-tab ${activeView === view.id ? 'active' : ''}`}
            onClick={() => setActiveView(view.id)}
          >
            <span className="tab-icon">{view.icon}</span>
            <span className="tab-label">{view.label}</span>
          </button>
        ))}
      </div> */}

      {/* Filters and Search */}
      {/* <div className="filters-section">
        <div className="filters-left">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search leads by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="status-filter"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="filters-right">
          <button className="btn btn-outline">
            <span className="btn-icon">📊</span>
            Analytics
          </button>
          <button className="btn btn-outline">
            <span className="btn-icon">📤</span>
            Export
          </button>
        </div>
      </div> */}

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon new">🆕</div>
          <div className="stat-content">
            <h3 className="stat-number">24</h3>
            <p className="stat-label">New Leads</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon contacted">📞</div>
          <div className="stat-content">
            <h3 className="stat-number">156</h3>
            <p className="stat-label">Contacted</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon qualified">✅</div>
          <div className="stat-content">
            <h3 className="stat-number">89</h3>
            <p className="stat-label">Qualified</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon converted">💰</div>
          <div className="stat-content">
            <h3 className="stat-number">34</h3>
            <p className="stat-label">Converted</p>
          </div>
        </div>
      </div>

      {/* Leads Table */}
      <div className="leads-table-section">
        <div className="table-header">
          <h3>Lead Details</h3>
          <div className="table-actions">
            <span className="results-count">Showing 1-20 of 156 results</span>
          </div>
        </div>
        <LeadsTable tenantId={tenantId} />
      </div>
    </div>
  );
};

export default LeadsManagement;
