import React, { useEffect, useMemo, useState } from "react";
import { fetchLeads, updateLead, fetchSettings } from "../services/api";
import LeadDetailsModal from "./LeadDetailsModal";
import io from "socket.io-client";
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || "http://localhost:5000";

const LeadsTable = ({ tenantId }) => {
  const [leads, setLeads] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [refresh, setRefresh] = useState(false);
  const [loading, setLoading] = useState(true);
  const [leadStages, setLeadStages] = useState([]);
  // UI/UX controls
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [sortKey, setSortKey] = useState("timestamp");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    let interval;
    let socket;
    if (tenantId) {
      const fetchAndSetLeads = () => {
        fetchLeads(tenantId).then((leadsData) => {
          setLeads(leadsData);
          setLoading(false);
        });
      };
      fetchAndSetLeads();
      interval = setInterval(fetchAndSetLeads, 15000); // Poll every 15 seconds
      // Fetch lead stages from settings
      fetchSettings(tenantId).then((settings) => {
        setLeadStages(settings.leadStages || []);
      });
      // --- Socket.io for real-time updates ---
      socket = io(SOCKET_URL, { transports: ["websocket"] });
      socket.emit("join-tenant", tenantId);
      socket.on("lead-updated", (updatedLead) => {
        setLeads((prev) => {
          const idx = prev.findIndex(l => l._id === updatedLead._id);
          if (idx !== -1) {
            // Update existing lead
            const newLeads = [...prev];
            newLeads[idx] = { ...prev[idx], ...updatedLead };
            return newLeads;
          } else {
            // Add new lead if not present
            return [updatedLead, ...prev];
          }
        });
      });
    }
    return () => {
      interval && clearInterval(interval);
      if (socket) socket.disconnect();
    };
  }, [tenantId, refresh]);

  const handleEdit = (lead) => setSelectedLead(lead);
  const handleClose = () => setSelectedLead(null);
  const handleSave = () => {
    setSelectedLead(null);
    setRefresh((r) => !r);
  };

  const handleStageChange = async (lead, newStage) => {
    await updateLead(tenantId, lead._id, { detectedStage: newStage });
    setLeads((prev) => prev.map(l => l._id === lead._id ? { ...l, detectedStage: newStage } : l));
  };

  // Add manual refresh handler
  const handleManualRefresh = async () => {
    setLoading(true);
    const leadsData = await fetchLeads(tenantId);
    setLeads(leadsData);
    setLoading(false);
  };

  // --- Derived values ---
  const sources = useMemo(() => Array.from(new Set(leads.map(l => l.source).filter(Boolean))), [leads]);
  const filteredLeads = useMemo(() => {
    const lower = search.toLowerCase();
    return leads.filter(l => {
      const matchesSearch = !lower || [l.name, l.phone, l.email, l.status, l.detectedStage]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(lower);
      const matchesStage = !stageFilter || l.detectedStage === stageFilter;
      const matchesSource = !sourceFilter || l.source === sourceFilter;
      return matchesSearch && matchesStage && matchesSource;
    });
  }, [leads, search, stageFilter, sourceFilter]);

  const sortedLeads = useMemo(() => {
    const copy = [...filteredLeads];
    copy.sort((a, b) => {
      let av, bv;
      switch (sortKey) {
        case "name":
          av = (a.name || "").toLowerCase();
          bv = (b.name || "").toLowerCase();
          break;
        case "stage":
          av = a.detectedStage || ""; bv = b.detectedStage || ""; break;
        case "source":
          av = a.source || ""; bv = b.source || ""; break;
        case "timestamp":
        default:
          av = new Date(a.timestamp || 0).getTime();
          bv = new Date(b.timestamp || 0).getTime();
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return copy;
  }, [filteredLeads, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sortedLeads.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedLeads.slice(start, start + pageSize);
  }, [sortedLeads, currentPage, pageSize]);

  if (loading) return (
    <div className="d-flex align-items-center"><div className="spinner-border me-2" role="status"/><span>Loading leads...</span></div>
  );

  return (
    <div>
      <div className="d-flex flex-wrap align-items-end justify-content-between mb-3">
        <div>
          <h4 className="m-0">Leads</h4>
          <small className="text-muted">{sortedLeads.length} result(s)</small>
        </div>
        <div className="d-flex flex-wrap gap-2">
          <input
            className="form-control"
            placeholder="Search name, phone, email, stage..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{ minWidth: 220 }}
          />
          <select className="form-select" value={stageFilter} onChange={e => { setStageFilter(e.target.value); setPage(1); }}>
            <option value="">All stages</option>
            {leadStages.map(s => (<option key={s.stage} value={s.stage}>{s.stage}</option>))}
          </select>
          <select className="form-select" value={sourceFilter} onChange={e => { setSourceFilter(e.target.value); setPage(1); }}>
            <option value="">All sources</option>
            {sources.map(s => (<option key={s} value={s}>{s}</option>))}
          </select>
          <select className="form-select" value={sortKey} onChange={e => setSortKey(e.target.value)}>
            <option value="timestamp">Sort by: Recent</option>
            <option value="name">Sort by: Name</option>
            <option value="stage">Sort by: Stage</option>
            <option value="source">Sort by: Source</option>
          </select>
          <select className="form-select" value={sortDir} onChange={e => setSortDir(e.target.value)}>
            <option value="desc">Desc</option>
            <option value="asc">Asc</option>
          </select>
          <button className="btn btn-outline-secondary" onClick={handleManualRefresh} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>
      <div className="table-responsive">
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Status</th>
              <th>Source</th>
              <th>Stage</th>
              <th>AI</th>
              <th>Initial Msg Sent</th>
              <th>Initial Msg Time</th>
              <th>Follow-up Status</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedLeads.map((lead) => {
              const sentCount = (lead.followupStatuses || []).filter(f => f && f.sent).length;
              const maxFollowups = (lead.followupStatuses || []).length;
              return (
                <tr key={lead._id}>
                  <td>{lead.name}</td>
                  <td>{lead.phone}</td>
                  <td>{lead.email}</td>
                  <td>{lead.status}</td>
                  <td>{lead.source}</td>
                  <td>
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id={`ai-toggle-${lead._id}`}
                        checked={lead.aiEnabled !== false}
                        onChange={async (e) => {
                          const next = e.target.checked;
                          await updateLead(tenantId, lead._id, { aiEnabled: next });
                          setLeads((prev) => prev.map(l => l._id === lead._id ? { ...l, aiEnabled: next } : l));
                        }}
                      />
                      <label className="form-check-label" htmlFor={`ai-toggle-${lead._id}`}>
                        {lead.aiEnabled === false ? 'Off' : 'On'}
                      </label>
                    </div>
                  </td>
                  <td>
                    <select
                      className="form-select"
                      value={lead.detectedStage || ""}
                      onChange={e => handleStageChange(lead, e.target.value)}
                    >
                      <option value="">Select stage</option>
                      {leadStages.map((stage) => (
                        <option key={stage.stage} value={stage.stage}>{stage.stage} - {stage.description}</option>
                      ))}
                    </select>
                  </td>
                  <td>{lead.initialMessageSent ? "Yes" : "No"}</td>
                  <td>{lead.initialMessageTimestamp ? new Date(lead.initialMessageTimestamp).toLocaleString() : ""}</td>
                  <td>{sentCount > 0 ? `Follow-ups sent: ${sentCount}/${maxFollowups}` : "No follow-ups sent"}</td>
                  <td style={{ maxWidth: 120, whiteSpace: "pre-wrap" }}>{lead.notes}</td>
                  <td>
                    <button className="btn btn-sm btn-info" onClick={() => handleEdit(lead)}>Edit</button>
                    {lead.sendFailed && (<span className="text-danger ml-2">Send Failed</span>)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* Pagination */}
      <div className="d-flex align-items-center justify-content-between mt-2">
        <div className="d-flex align-items-center gap-2">
          <span className="text-muted">Rows per page</span>
          <select className="form-select" style={{ width: 90 }} value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}>
            {[10, 20, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div className="d-flex align-items-center gap-2">
          <button className="btn btn-sm btn-outline-secondary" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
            Prev
          </button>
          <span className="text-muted">Page {currentPage} / {totalPages}</span>
          <button className="btn btn-sm btn-outline-secondary" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
            Next
          </button>
        </div>
      </div>
      {selectedLead && (
        <LeadDetailsModal
          lead={selectedLead}
          onClose={handleClose}
          onSave={handleSave}
          tenantId={tenantId}
        />
      )}
    </div>
  );
};

export default LeadsTable;
