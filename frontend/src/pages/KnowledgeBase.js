import React, { useState } from "react";
import KnowledgebaseEditor from "../components/KnowledgebaseEditor";
import "./KnowledgeBase.css";

const KnowledgeBase = ({ tenantId }) => {
  const [activeView, setActiveView] = useState("articles");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const views = [
    { id: "articles", label: "Articles", icon: "📝" },
    { id: "categories", label: "Categories", icon: "📁" },
    { id: "templates", label: "Templates", icon: "📋" },
    { id: "analytics", label: "Analytics", icon: "📊" }
  ];

  const categories = [
    { id: "all", label: "All Categories", count: 156 },
    { id: "getting-started", label: "Getting Started", count: 23 },
    { id: "features", label: "Features", count: 45 },
    { id: "troubleshooting", label: "Troubleshooting", count: 34 },
    { id: "api", label: "API Documentation", count: 28 },
    { id: "integrations", label: "Integrations", count: 26 }
  ];

  const recentArticles = [
    {
      id: 1,
      title: "How to Set Up WhatsApp Integration",
      category: "Getting Started",
      views: 1247,
      lastUpdated: "2 days ago",
      status: "published"
    },
    {
      id: 2,
      title: "Lead Management Best Practices",
      category: "Features",
      views: 892,
      lastUpdated: "1 week ago",
      status: "published"
    },
    {
      id: 3,
      title: "Troubleshooting Common Issues",
      category: "Troubleshooting",
      views: 567,
      lastUpdated: "2 weeks ago",
      status: "draft"
    }
  ];

  return (
    <div className="knowledge-base">
      {/* Header Section */}
      <div className="kb-header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="page-title">Knowledge Base</h1>
            <p className="page-subtitle">Create and manage helpful content for your users</p>
          </div>
          <div className="header-actions">
            <button className="btn btn-primary">
              <span className="btn-icon">✏️</span>
              Create Article
            </button>
            <button className="btn btn-outline">
              <span className="btn-icon">📥</span>
              Import Content
            </button>
          </div>
        </div>
      </div>

      {/* View Tabs */}
      <div className="view-tabs">
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
      </div>

      {/* Search and Filters */}
      <div className="search-filters">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search knowledge base articles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="category-filter"
        >
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.label} ({category.count})
            </option>
          ))}
        </select>
      </div>

      {/* Stats Overview */}
      <div className="stats-overview">
        <div className="stat-card">
          <div className="stat-icon total">📚</div>
          <div className="stat-content">
            <h3 className="stat-number">156</h3>
            <p className="stat-label">Total Articles</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon published">✅</div>
          <div className="stat-content">
            <h3 className="stat-number">142</h3>
            <p className="stat-label">Published</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon draft">📝</div>
          <div className="stat-content">
            <h3 className="stat-number">14</h3>
            <p className="stat-label">Drafts</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon views">👁️</div>
          <div className="stat-content">
            <h3 className="stat-number">45.2K</h3>
            <p className="stat-label">Total Views</p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="kb-content">
        {activeView === "articles" && (
          <div className="articles-section">
            <div className="section-header">
              <h3>Recent Articles</h3>
              <button className="btn btn-outline">View All</button>
            </div>
            <div className="articles-grid">
              {recentArticles.map((article) => (
                <div key={article.id} className="article-card">
                  <div className="article-header">
                    <span className={`status-badge ${article.status}`}>
                      {article.status === 'published' ? '✅ Published' : '📝 Draft'}
                    </span>
                    <span className="article-category">{article.category}</span>
                  </div>
                  <h4 className="article-title">{article.title}</h4>
                  <div className="article-meta">
                    <span className="meta-item">
                      <span className="meta-icon">👁️</span>
                      {article.views.toLocaleString()} views
                    </span>
                    <span className="meta-item">
                      <span className="meta-icon">🕒</span>
                      {article.lastUpdated}
                    </span>
                  </div>
                  <div className="article-actions">
                    <button className="btn btn-sm btn-outline">Edit</button>
                    <button className="btn btn-sm btn-outline">View</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeView === "categories" && (
          <div className="categories-section">
            <div className="section-header">
              <h3>Content Categories</h3>
              <button className="btn btn-outline">Add Category</button>
            </div>
            <div className="categories-grid">
              {categories.slice(1).map((category) => (
                <div key={category.id} className="category-card">
                  <div className="category-icon">📁</div>
                  <h4 className="category-name">{category.label}</h4>
                  <p className="category-count">{category.count} articles</p>
                  <div className="category-actions">
                    <button className="btn btn-sm btn-outline">Edit</button>
                    <button className="btn btn-sm btn-outline">View Articles</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeView === "templates" && (
          <div className="templates-section">
            <div className="section-header">
              <h3>Article Templates</h3>
              <button className="btn btn-outline">Create Template</button>
            </div>
            <div className="templates-grid">
              <div className="template-card">
                <div className="template-icon">📋</div>
                <h4>Getting Started Guide</h4>
                <p>Template for new user onboarding articles</p>
                <button className="btn btn-sm btn-outline">Use Template</button>
              </div>
              <div className="template-card">
                <div className="template-icon">🔧</div>
                <h4>Troubleshooting Guide</h4>
                <p>Template for problem-solving articles</p>
                <button className="btn btn-sm btn-outline">Use Template</button>
              </div>
              <div className="template-card">
                <div className="template-icon">📚</div>
                <h4>Feature Documentation</h4>
                <p>Template for feature explanation articles</p>
                <button className="btn btn-sm btn-outline">Use Template</button>
              </div>
            </div>
          </div>
        )}

        {activeView === "analytics" && (
          <div className="analytics-section">
            <div className="section-header">
              <h3>Knowledge Base Analytics</h3>
              <button className="btn btn-outline">Export Report</button>
            </div>
            <div className="analytics-grid">
              <div className="analytics-card">
                <h4>Most Viewed Articles</h4>
                <div className="analytics-list">
                  <div className="analytics-item">
                    <span className="item-title">WhatsApp Integration Setup</span>
                    <span className="item-value">2.4K views</span>
                  </div>
                  <div className="analytics-item">
                    <span className="item-title">Lead Management Guide</span>
                    <span className="item-value">1.8K views</span>
                  </div>
                  <div className="analytics-item">
                    <span className="item-title">API Documentation</span>
                    <span className="item-value">1.2K views</span>
                  </div>
                </div>
              </div>
              <div className="analytics-card">
                <h4>Search Analytics</h4>
                <div className="analytics-list">
                  <div className="analytics-item">
                    <span className="item-title">Top Searches</span>
                    <span className="item-value">WhatsApp, Leads, API</span>
                  </div>
                  <div className="analytics-item">
                    <span className="item-title">Failed Searches</span>
                    <span className="item-value">15%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default KnowledgeBase;
