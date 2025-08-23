import React, { useEffect, useState } from "react";
import { fetchSettings, updateSettings } from "../services/api";

const FollowupMessagesSettings = ({ tenantId }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [followupMessages, setFollowupMessages] = useState(["", "", ""]);
  const [followupDelays, setFollowupDelays] = useState([
    24 * 60 * 60 * 1000, // First follow-up delay (24 hours)
    48 * 60 * 60 * 1000, // Second follow-up delay (48 hours)
    72 * 60 * 60 * 1000, // Third follow-up delay (72 hours)
  ]);

  useEffect(() => {
    if (tenantId) {
      fetchSettings(tenantId).then((settings) => {
        console.log('Loaded settings from database:', settings);
        setFollowupMessages(settings.followupMessages || ["", "", ""]);
        setFollowupDelays(
          settings.followupDelays || [
            24 * 60 * 60 * 1000, // First follow-up delay (24 hours)
            48 * 60 * 60 * 1000, // Second follow-up delay (48 hours)
            72 * 60 * 60 * 1000, // Third follow-up delay (72 hours)
          ]
        );
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
    console.log('Changing delay for index:', idx, 'to value:', value);
    
    // Remove leading zeros and convert to number
    let cleanValue = value.replace(/^0+/, '') || '0';
    let numericValue = parseInt(cleanValue, 10);
    
    // Ensure it's a valid number
    if (isNaN(numericValue) || numericValue < 0) {
      numericValue = 0;
    }
    
    console.log('Clean value:', cleanValue, 'Numeric value:', numericValue);
    
    setFollowupDelays((prev) => {
      const newDelays = prev.map((d, i) => (i === idx ? numericValue : d));
      console.log('Updated delays array:', newDelays);
      return newDelays;
    });
  };

  const handleSave = async () => {
    if (!tenantId) return;

    setSaving(true);
    
    // Debug logging
    console.log('Saving follow-up settings:', {
      followupMessages,
      followupDelays
    });
    
    await updateSettings(tenantId, {
      followupMessages,
      followupDelays,
    });
    setMessage("Follow-up messages settings updated!");
    setSaving(false);
    setTimeout(() => setMessage(""), 2000);
  };

  const formatDelay = (milliseconds) => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''}`;
    }
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  };

  const formatInputValue = (milliseconds) => {
    if (milliseconds === 0) return '';
    return milliseconds.toString();
  };

  if (loading) return <div>Loading follow-up messages settings...</div>;

  return (
    <div className="mb-4">
      <h3>Follow-up Messages Settings</h3>
      <p className="text-muted mb-4">
        Configure automated follow-up messages to keep leads engaged and improve conversion rates.
      </p>

      <div className="form-group">
        <label>Follow-up Messages & Delays (up to 3)</label>
        <p className="text-muted small">
          Set up to 3 automated follow-up messages with custom delays after the initial message. 
          <br />
          <strong>Note:</strong> Global auto follow-up settings are managed in Global Settings.
        </p>
        {[0, 1, 2].map((idx) => (
          <div key={idx} className="mb-3 p-3 border rounded bg-light">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h6 className="mb-0">Follow-up #{idx + 1}</h6>
              <span className="badge bg-info">
                {formatDelay(followupDelays[idx])} after initial message
              </span>
            </div>
            <div className="mb-2">
              <label className="form-label">Message Content</label>
              <textarea
                className="form-control"
                rows={3}
                value={followupMessages[idx] || ""}
                onChange={(e) => handleFollowupMessageChange(idx, e.target.value)}
                placeholder={`Enter your follow-up message #${idx + 1} here...`}
              />
            </div>
            <div>
              <label className="form-label">Delay after initial message</label>
              <div className="input-group">
                <input
                  type="text"
                  className="form-control"
                  value={formatInputValue(followupDelays[idx])}
                  min={0}
                  onChange={(e) => handleFollowupDelayChange(idx, e.target.value)}
                  placeholder="Enter delay in milliseconds (e.g., 86400000 for 24 hours)"
                  style={{ fontFamily: 'monospace' }}
                />
                <span className="input-group-text">milliseconds</span>
              </div>
              <small className="text-muted">
                Current: {formatDelay(followupDelays[idx] || 0)}
              </small>
              <small className="text-info d-block mt-1">
                💡 Quick values: 3600000 (1 hour) | 86400000 (24 hours) | 604800000 (7 days)
              </small>
            </div>
          </div>
        ))}
      </div>

      <div className="d-flex gap-2">
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Follow-up Settings"}
        </button>
        <button
          className="btn btn-outline-secondary"
          onClick={() => {
            setFollowupMessages(["", "", ""]);
            setFollowupDelays([24 * 60 * 60 * 1000, 48 * 60 * 60 * 1000, 72 * 60 * 60 * 1000]);
          }}
        >
          Reset to Default
        </button>
      </div>

      {message && <div className="text-success mt-3">{message}</div>}
    </div>
  );
};

export default FollowupMessagesSettings;
