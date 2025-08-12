import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../components/AdminSidebar";
import AdminMobileMenuToggle from "../components/AdminMobileMenuToggle";
import WhatsAppConnect from "../components/WhatsAppConnect";
import GlobalMessagingSettings from "../components/GlobalMessagingSettings";
import KnowledgebaseEditor from "../components/KnowledgebaseEditor";
import LeadsTable from "../components/LeadsTable";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("tenantId");
    localStorage.removeItem("businessName");
    localStorage.removeItem("ownerName");
    navigate("/login");
  };

  return (
    <div className="admin-dashboard-layout">
      {/* Mobile Menu Toggle */}
      <div className="admin-mobile-header">
        <AdminMobileMenuToggle 
          onToggle={handleMobileMenuToggle} 
          isOpen={isMobileMenuOpen} 
        />
        <h3>Admin Dashboard</h3>
        <div></div> {/* Spacer for centering */}
      </div>

      {/* Sidebar */}
      <AdminSidebar 
        activeTab={activeTab} 
        setActiveTab={handleTabChange} 
        onLogout={handleLogout}
        isMobileOpen={isMobileMenuOpen}
      />

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="admin-sidebar-overlay active" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="admin-main-content">
        <h1 className="mb-4">Admin Dashboard</h1>
        <div className="row gy-4">
          <div className="col-12 col-md-6 col-lg-4">
            <div className="card h-100 shadow-sm">
              <div className="card-body">
                <WhatsAppConnect />
              </div>
            </div>
          </div>
          <div className="col-12 col-md-6 col-lg-4">
            <div className="card h-100 shadow-sm">
              <div className="card-body">
                <GlobalMessagingSettings />
              </div>
            </div>
          </div>
          <div className="col-12 col-lg-4">
            <div className="card h-100 shadow-sm">
              <div className="card-body">
                <KnowledgebaseEditor />
              </div>
            </div>
          </div>
          <div className="col-12">
            <div className="card h-100 shadow-sm">
              <div className="card-body">
                <LeadsTable />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
