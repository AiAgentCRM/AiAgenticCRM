import React, { useEffect, useState } from "react";
import { fetchLeads, updateLead, fetchSettings } from "../services/api";
import LeadDetailsModal from "./LeadDetailsModal";
import io from "socket.io-client";
import "./LeadsTable.css";
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || "http://localhost:5050";

const LeadsTable = ({ tenantId }) => {
  const [leads, setLeads] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [refresh, setRefresh] = useState(false);
  const [loading, setLoading] = useState(true);
  const [leadStages, setLeadStages] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    let interval;
    let socketInstance;
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
      socketInstance = io(SOCKET_URL, { transports: ["websocket"] });
      setSocket(socketInstance); // Store socket in state
      console.log(`🔌 Frontend connecting to socket server: ${SOCKET_URL}`);
      
      socketInstance.on("connect", () => {
        console.log(`🔌 Frontend socket connected: ${socketInstance.id}`);
      });
      
      socketInstance.on("connect_error", (error) => {
        console.error(`🔌 Frontend socket connection error:`, error);
      });
      
      socketInstance.emit("join-tenant", tenantId);
      console.log(`🔌 Frontend joined tenant room: ${tenantId}`);
      
      socketInstance.on("lead-updated", (updatedLead) => {
        console.log(`🔌 Frontend received lead-updated event:`, updatedLead);
        setLeads((prev) => {
          const idx = prev.findIndex(l => l._id === updatedLead._id);
          if (idx !== -1) {
            // Update existing lead
            const newLeads = [...prev];
            newLeads[idx] = { ...prev[idx], ...updatedLead };
            console.log(`🔌 Updated existing lead in state`);
            return newLeads;
          } else {
            // Add new lead if not present
            console.log(`🔌 Added new lead to state`);
            return [updatedLead, ...prev];
          }
        });
      });
      
      // Handle stage change events
      socketInstance.on("lead-stage-changed", (stageChange) => {
        console.log(`🔌 Frontend received lead-stage-changed event:`, stageChange);
        setLeads((prev) => {
          const idx = prev.findIndex(l => l._id === stageChange.leadId);
          if (idx !== -1) {
            const newLeads = [...prev];
            newLeads[idx] = { 
              ...prev[idx], 
              detectedStage: stageChange.newStage,
              lastRespondedAt: stageChange.timestamp
            };
            console.log(`🔌 Updated lead stage: ${stageChange.oldStage || 'None'} → ${stageChange.newStage}`);
            return newLeads;
          }
          return prev;
        });
      });
      
      // Handle follow-up sent events
      socketInstance.on("followup-sent", (followupData) => {
        console.log(`🔌 Frontend received followup-sent event:`, followupData);
        setLeads((prev) => {
          const idx = prev.findIndex(l => l._id === followupData.leadId);
          if (idx !== -1) {
            const newLeads = [...prev];
            const lead = newLeads[idx];
            
            // Update followup status
            if (!lead.followupStatuses) {
              lead.followupStatuses = [];
            }
            
            // Ensure array has enough elements
            while (lead.followupStatuses.length < followupData.followupNumber) {
              lead.followupStatuses.push({});
            }
            
            lead.followupStatuses[followupData.followupNumber - 1] = {
              sent: true,
              timestamp: followupData.timestamp,
              failed: false,
              error: undefined
            };
            
            console.log(`🔌 Updated follow-up status: Follow-up #${followupData.followupNumber} sent to ${followupData.phone}`);
            return newLeads;
          }
          return prev;
        });
      });
      
      // Handle follow-up failed events
      socketInstance.on("followup-failed", (followupData) => {
        console.log(`🔌 Frontend received followup-failed event:`, followupData);
        setLeads((prev) => {
          const idx = prev.findIndex(l => l._id === followupData.leadId);
          if (idx !== -1) {
            const newLeads = [...prev];
            const lead = newLeads[idx];
            
            // Update followup status
            if (!lead.followupStatuses) {
              lead.followupStatuses = [];
            }
            
            // Ensure array has enough elements
            while (lead.followupStatuses.length < followupData.followupNumber) {
              lead.followupStatuses.push({});
            }
            
            lead.followupStatuses[followupData.followupNumber - 1] = {
              sent: false,
              timestamp: followupData.timestamp,
              failed: true,
              error: followupData.error
            };
            
            console.log(`🔌 Updated follow-up status: Follow-up #${followupData.followupNumber} failed for ${followupData.phone}`);
            return newLeads;
          }
          return prev;
        });
      });
      
      socketInstance.on("disconnect", () => {
        console.log(`🔌 Frontend socket disconnected`);
      });
    }
    return () => {
      interval && clearInterval(interval);
      if (socketInstance) socketInstance.disconnect();
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

  const handleAiReplyToggle = async (lead, enabled) => {
    try {
      await updateLead(tenantId, lead._id, { aiReplyEnabled: enabled });
      setLeads((prev) => prev.map(l => l._id === lead._id ? { ...l, aiReplyEnabled: enabled } : l));
      console.log(`AI Reply ${enabled ? 'enabled' : 'disabled'} for lead ${lead.phone}`);
    } catch (error) {
      console.error('Error updating AI reply setting:', error);
    }
  };

  // Add manual refresh handler
  const handleManualRefresh = async () => {
    setLoading(true);
    const leadsData = await fetchLeads(tenantId);
    setLeads(leadsData);
    setLoading(false);
  };

  // Test function to manually create a lead
  const handleTestLeadCreation = async () => {
    try {
      console.log(`🔌 Testing lead creation for tenant: ${tenantId}`);
      const testPhone = `91${Math.floor(Math.random() * 9000000000) + 1000000000}`; // Random 10-digit number
      
      const response = await fetch(`https://api.aiagenticcrm.com/api/test/create-lead/${tenantId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          phone: testPhone,
          name: 'Test User',
          message: 'hi'
        })
      });
      
      const result = await response.json();
      console.log(`🔌 Test lead creation result:`, result);
      
      if (result.success) {
        console.log(`🔌 Test lead created successfully:`, result.lead._id);
        // Refresh leads to see the new lead
        setTimeout(() => {
          handleManualRefresh();
        }, 1000);
      }
    } catch (error) {
      console.error(`🔌 Error testing lead creation:`, error);
    }
  };

  // Test function to manually trigger follow-ups
  const handleTestFollowups = async () => {
    try {
      console.log(`🔌 Testing follow-up system for tenant: ${tenantId}`);
      
      // Find a lead that has initial message sent but no follow-ups
      const eligibleLead = leads.find(lead => 
        lead.initialMessageSent && 
        lead.followupStatuses && 
        lead.followupStatuses.some(status => !status.sent)
      );
      
      if (!eligibleLead) {
        console.log(`🔌 No eligible leads found for follow-up testing`);
        return;
      }
      
      console.log(`🔌 Testing follow-ups for lead: ${eligibleLead.phone}`);
      
      // This will trigger the backend to check and send follow-ups
      const response = await fetch(`https://api.aiagenticcrm.com/api/${tenantId}/test-followups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          leadId: eligibleLead._id
        })
      });
      
      const result = await response.json();
      console.log(`🔌 Test follow-up result:`, result);
      
    } catch (error) {
      console.error(`🔌 Error testing follow-ups:`, error);
    }
  };

  if (loading) return <div>Loading leads...</div>;

  return (
    <div>
      <h2>Leads</h2>
      <div className="test-buttons-container">
        <button className="btn btn-primary" onClick={handleManualRefresh} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
        <button 
          className="test-button" 
          onClick={() => {
            console.log(`🔌 Testing socket connection...`);
            console.log(`🔌 Socket connected:`, socket?.connected);
            console.log(`🔌 Socket ID:`, socket?.id);
            console.log(`🔌 Current leads count:`, leads.length);
          }}
        >
          Test Socket
        </button>
        <button 
          className="test-button" 
          onClick={handleTestLeadCreation}
        >
          Test Lead Creation
        </button>
        <button 
          className="test-button" 
          onClick={handleTestFollowups}
        >
          Test Follow-ups
        </button>
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
              <th>Initial Msg Sent</th>
              <th>Initial Msg Time</th>
              <th>Follow-up Status</th>
              <th>AI Reply</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => {
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
                    <select
                      className="form-select"
                      value={lead.detectedStage || ""}
                      onChange={e => handleStageChange(lead, e.target.value)}
                    >
                      <option value="">Select stage</option>
                      {leadStages.map((stage) => (
                        <option key={stage.stage} value={stage.stage}>
                          {stage.stage} - {stage.description}
                        </option>
                      ))}
                    </select>
                    {lead.detectedStage && (
                      <div className="mt-1">
                        <small className="text-muted">
                          Stage: <span className="badge bg-primary stage-badge">{lead.detectedStage}</span>
                        </small>
                      </div>
                    )}
                  </td>
                  <td>{lead.initialMessageSent ? "Yes" : "No"}</td>
                  <td>{lead.initialMessageTimestamp ? new Date(lead.initialMessageTimestamp).toLocaleString() : ""}</td>
                  <td>
                    <div className="followup-status-container">
                      {lead.followupStatuses && lead.followupStatuses.length > 0 ? (
                        lead.followupStatuses.map((status, index) => (
                          <div key={index} className="followup-status-item">
                            <span className="followup-number">#{index + 1}</span>
                            {status.sent ? (
                              <span className="followup-badge sent">
                                ✓ Sent
                              </span>
                            ) : status.failed ? (
                              <span className="followup-badge failed" title={status.error}>
                                ✗ Failed
                              </span>
                            ) : (
                              <span className="followup-badge pending">Pending</span>
                            )}
                            {status.timestamp && (
                              <span className="followup-timestamp">
                                {new Date(status.timestamp).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        ))
                      ) : (
                        <span className="text-muted">No follow-ups configured</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="ai-reply-toggle-container">
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={lead.aiReplyEnabled || false}
                          onChange={(e) => handleAiReplyToggle(lead, e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                      <small className="toggle-label">
                        {lead.aiReplyEnabled ? "Enabled" : "Disabled"}
                      </small>
                    </div>
                  </td>
                  <td style={{ maxWidth: 120, whiteSpace: "pre-wrap" }}>{lead.notes}</td>
                  <td>
                    <button className="btn-action btn-edit" onClick={() => handleEdit(lead)}>Edit</button>
                    {lead.sendFailed && (<span className="text-danger ms-2">Send Failed</span>)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
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
