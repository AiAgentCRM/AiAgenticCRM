import React, { useEffect, useState } from "react";
import { fetchSettings, updateSettings } from "../services/api";

const GlobalMessagingSettings = ({ tenantId }) => {
  const [initialMessage, setInitialMessage] = useState("");
  const [followupMessage, setFollowupMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageTemplate, setMessageTemplate] = useState("");
  const [batchSize, setBatchSize] = useState(1);
  const [messageDelay, setMessageDelay] = useState(3000);
  const [companyProfile, setCompanyProfile] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [fetchIntervalMinutes, setFetchIntervalMinutes] = useState(3);
  const [globalAutoFollowupEnabled, setGlobalAutoFollowupEnabled] = useState(false);
  const [autoFollowupForIncoming, setAutoFollowupForIncoming] = useState(false);

  useEffect(() => {
    if (tenantId) {
      fetchSettings(tenantId).then((settings) => {
        setInitialMessage(settings.initialMessage || "");
        setFollowupMessage(settings.followupMessage || "");
        setMessageTemplate(settings.messageTemplate || "");
        setBatchSize(settings.batchSize || 1);
        setMessageDelay(settings.messageDelay || 3000);
        setCompanyProfile(settings.companyProfile || "");
        setSystemPrompt(settings.systemPrompt || "");
        setFetchIntervalMinutes(settings.fetchIntervalMinutes || 3);
        setGlobalAutoFollowupEnabled(!!settings.globalAutoFollowupEnabled);
        setAutoFollowupForIncoming(!!settings.autoFollowupForIncoming);
        setLoading(false);
      });
    }
  }, [tenantId]);

  const handleSave = async () => {
    if (!tenantId) return;

    setSaving(true);
    await updateSettings(tenantId, {
      initialMessage,
      followupMessage,
      messageTemplate,
      batchSize,
      messageDelay,
      companyProfile,
      systemPrompt,
      fetchIntervalMinutes,
      globalAutoFollowupEnabled,
      autoFollowupForIncoming,
    });
    setMessage("Global messaging settings updated!");
    setSaving(false);
    setTimeout(() => setMessage(""), 2000);
  };

  if (loading) return <div>Loading messaging settings...</div>;

  return (
    <div className="mb-4">
      <h3>Global Messaging Settings</h3>
      <div className="form-group">
        <label>Initial Message (for new leads)</label>
        <textarea
          className="form-control mb-2"
          rows={2}
          value={initialMessage}
          onChange={(e) => setInitialMessage(e.target.value)}
          placeholder="Hi {name}, thank you for your interest! Our team will contact you soon."
        />
      </div>
      <div className="form-group">
        <label>Follow-up Message</label>
        <textarea
          className="form-control mb-2"
          rows={2}
          value={followupMessage}
          onChange={(e) => setFollowupMessage(e.target.value)}
          placeholder="Just checking in, {name}! Let us know if you have any questions."
        />
      </div>
      <div className="form-group">
        <label>Message Template (Sheet Bulk Send)</label>
        <textarea
          className="form-control mb-2"
          rows={2}
          value={messageTemplate}
          onChange={(e) => setMessageTemplate(e.target.value)}
          placeholder="Hi {name}, Thanks for filling the form. We will contact you soon."
        />
      </div>
      <div className="form-group">
        <label>Batch Size</label>
        <input
          type="number"
          className="form-control mb-2"
          value={batchSize}
          min={1}
          onChange={(e) => setBatchSize(Number(e.target.value))}
        />
      </div>
      <div className="form-group">
        <label>Message Delay (ms)</label>
        <input
          type="number"
          className="form-control mb-2"
          value={messageDelay}
          min={0}
          onChange={(e) => setMessageDelay(Number(e.target.value))}
        />
      </div>
      <div className="form-group">
        <label>Company Profile</label>
        <textarea
          className="form-control mb-2"
          rows={4}
          value={companyProfile}
          onChange={(e) => setCompanyProfile(e.target.value)}
          placeholder="Enter your company profile here..."
        />
      </div>
      <div className="form-group">
        <label>System Prompt (AI)</label>
        <textarea
          className="form-control mb-2"
          rows={4}
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          placeholder="Enter the system prompt for AI replies..."
        />
      </div>
      <div className="form-group">
        <label>Google Sheets Fetch Interval (minutes)</label>
        <input
          type="number"
          className="form-control mb-2"
          value={fetchIntervalMinutes}
          min={1}
          onChange={(e) => setFetchIntervalMinutes(Number(e.target.value))}
        />
      </div>
      <div className="form-group mb-4">
        <div className="card border-0 shadow-sm">
          <div className="card-body p-4">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div>
                <h6 className="mb-1 fw-bold text-primary">
                  <i className="fas fa-robot me-2"></i>
                  Global Auto Follow-up
                </h6>
                <p className="text-muted small mb-0">
                  When enabled, the system will automatically send follow-up messages to leads based on the schedule above.
                </p>
              </div>
              <div className="form-check form-switch">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="globalAutoFollowup"
                  checked={globalAutoFollowupEnabled}
                  onChange={(e) => setGlobalAutoFollowupEnabled(e.target.checked)}
                  style={{
                    width: '3rem',
                    height: '1.5rem',
                    backgroundColor: globalAutoFollowupEnabled ? '#0d6efd' : '#6c757d',
                    borderColor: globalAutoFollowupEnabled ? '#0d6efd' : '#6c757d'
                  }}
                />
                <label className="form-check-label ms-3 fw-semibold" htmlFor="globalAutoFollowup">
                  {globalAutoFollowupEnabled ? 'Enabled' : 'Disabled'}
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="form-group mb-4">
        <div className="card border-0 shadow-sm">
          <div className="card-body p-4">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div>
                <h6 className="mb-1 fw-bold text-success">
                  <i className="fas fa-comments me-2"></i>
                  Auto Follow-up for Incoming Message Leads
                </h6>
                <p className="text-muted small mb-0">
                  Automatically send follow-up messages to leads who initiate conversations with your business.
                </p>
              </div>
              <div className="form-check form-switch">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="autoFollowupForIncoming"
                  checked={autoFollowupForIncoming}
                  onChange={(e) => setAutoFollowupForIncoming(e.target.checked)}
                  style={{
                    width: '3rem',
                    height: '1.5rem',
                    backgroundColor: autoFollowupForIncoming ? '#198754' : '#6c757d',
                    borderColor: autoFollowupForIncoming ? '#198754' : '#6c757d'
                  }}
                />
                <label className="form-check-label ms-3 fw-semibold" htmlFor="autoFollowupForIncoming">
                  {autoFollowupForIncoming ? 'Enabled' : 'Disabled'}
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
      <button
        className="btn btn-primary"
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? "Saving..." : "Save Settings"}
      </button>
      {message && <div className="text-success mt-2">{message}</div>}
    </div>
  );
};

export default GlobalMessagingSettings;
