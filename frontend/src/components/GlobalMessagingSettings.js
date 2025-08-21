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
  const [followupMessages, setFollowupMessages] = useState(["", "", ""]);
  const [followupDelays, setFollowupDelays] = useState([
    24 * 60 * 60 * 1000,
    48 * 60 * 60 * 1000,
    72 * 60 * 60 * 1000,
  ]);
  const [fetchIntervalMinutes, setFetchIntervalMinutes] = useState(3);
  const [globalAutoFollowupEnabled, setGlobalAutoFollowupEnabled] =
    useState(false);
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
        setFollowupMessages(settings.followupMessages || ["", "", ""]);
        setFollowupDelays(
          settings.followupDelays || [
            24 * 60 * 60 * 1000,
            48 * 60 * 60 * 1000,
            72 * 60 * 60 * 1000,
          ]
        );
        setFetchIntervalMinutes(settings.fetchIntervalMinutes || 3);
        setGlobalAutoFollowupEnabled(!!settings.globalAutoFollowupEnabled);
        setAutoFollowupForIncoming(!!settings.autoFollowupForIncoming);
        setLoading(false);
      });
    }
  }, [tenantId]);

  const handleFollowupMessageChange = (idx, value) => {
    setFollowupMessages((prev) =>
      prev.map((msg, i) => (i === idx ? value : msg))
    );
  };
  const handleFollowupDelayChange = (idx, value) => {
    setFollowupDelays((prev) =>
      prev.map((d, i) => (i === idx ? Number(value) : d))
    );
  };

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
      followupMessages,
      followupDelays,
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
        <label>Follow-up Messages & Delays (up to 3)</label>
        {[0, 1, 2].map((idx) => (
          <div key={idx} className="mb-2 p-2 border rounded">
            <label>Follow-up #{idx + 1} Message</label>
            <textarea
              className="form-control mb-1"
              rows={2}
              value={followupMessages[idx] || ""}
              onChange={(e) => handleFollowupMessageChange(idx, e.target.value)}
              placeholder={`Follow-up message #${idx + 1}`}
            />
            <label>Delay after previous (ms)</label>
            <input
              type="number"
              className="form-control"
              value={followupDelays[idx] || 0}
              min={0}
              onChange={(e) => handleFollowupDelayChange(idx, e.target.value)}
            />
          </div>
        ))}
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
      <div className="form-group form-check">
        <input
          type="checkbox"
          className="form-check-input"
          id="globalAutoFollowup"
          checked={globalAutoFollowupEnabled}
          onChange={(e) => setGlobalAutoFollowupEnabled(e.target.checked)}
        />
        <label className="form-check-label" htmlFor="globalAutoFollowup">
          Enable Global Auto Follow-up
        </label>
      </div>
      <div className="form-group form-check">
        <input
          type="checkbox"
          className="form-check-input"
          id="autoFollowupForIncoming"
          checked={autoFollowupForIncoming}
          onChange={(e) => setAutoFollowupForIncoming(e.target.checked)}
        />
        <label className="form-check-label" htmlFor="autoFollowupForIncoming">
          Enable Auto Follow-up for Incoming Message Leads
        </label>
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
