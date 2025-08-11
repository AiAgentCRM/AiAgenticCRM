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
    { id: "dashboard", label: "Dashboard", icon: "bi-speedometer2" },
    { id: "leads", label: "Leads", icon: "bi-people" },
    { id: "settings", label: "Settings", icon: "bi-gear" },
    { id: "knowledgebase", label: "Knowledgebase", icon: "bi-journal-text" },
    { id: "whatsapp", label: "WhatsApp", icon: "bi-chat-dots" },
  ];

  return (
    <div
      className={`bg-light border-end h-100 ${isOpen ? "d-block" : "d-none d-md-block"}`}
      style={{ minWidth: 240 }}
    >
      <div className="p-3 border-bottom">
        <div className="fw-semibold">{businessName || "AiAgenticCRM"}</div>
        <small className="text-muted">{ownerName ? `Hi, ${ownerName}` : null}</small>
      </div>
      <div className="list-group list-group-flush">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={`list-group-item list-group-item-action d-flex align-items-center ${
              activeTab === t.id ? "active" : ""
            }`}
            onClick={() => onSelectTab(t.id)}
            style={{ cursor: "pointer" }}
          >
            <span className={`bi ${t.icon} me-2`} /> {t.label}
          </button>
        ))}
      </div>
      <div className="p-3 border-top">
        <button className="btn btn-outline-secondary w-100" onClick={onLogout}>
          <span className="bi bi-box-arrow-right me-2" /> Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;


