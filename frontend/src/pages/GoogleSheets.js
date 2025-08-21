import React, { useState, useEffect } from "react";
import { updateSheetsConfig } from "../services/api";

const GoogleSheets = ({ tenantId, currentSheetId, onSheetIdUpdate }) => {
  const [sheetId, setSheetId] = useState("");
  const [sheetConfigMessage, setSheetConfigMessage] = useState("");
console.log( currentSheetId);

  useEffect(() => {
    if (currentSheetId) {
      setSheetId(currentSheetId);
    }
  }, [currentSheetId]);

  const handleSheetConfigSubmit = async (e) => {
    e.preventDefault();
    setSheetConfigMessage("");
    const fileInput = e.target.elements.googleCredentials;
    let googleCredentials = null;
    
    if (fileInput.files.length > 0) {
      const file = fileInput.files[0];
      const text = await file.text();
      try {
        googleCredentials = JSON.parse(text);
      } catch (err) {
        setSheetConfigMessage("Invalid JSON in credentials file.");
        return;
      }
    }
    
    try {
      const res = await updateSheetsConfig(tenantId, sheetId, googleCredentials);
      setSheetConfigMessage(res.message || res.error || "Updated.");
      if (sheetId && onSheetIdUpdate) {
        onSheetIdUpdate(sheetId);
      }
    } catch (error) {
      setSheetConfigMessage("Failed to update sheets configuration.");
    }
  };

  return (
    <div className="card">
      <div className="card-body">
        <h5 className="card-title">Google Sheets Configuration</h5>
        <form onSubmit={handleSheetConfigSubmit}>
          <div className="mb-3">
            <label className="form-label">Google Sheet ID</label>
            <input
              type="text"
              className="form-control"
              value={sheetId}
              onChange={(e) => setSheetId(e.target.value)}
              placeholder="Enter your Google Sheet ID"
              required
            />
            {currentSheetId && (
              <div className="form-text">
                Current Sheet ID: <b>{currentSheetId}</b>
              </div>
            )}
          </div>
          <div className="mb-3">
            <label className="form-label">
              Google API Credentials (JSON)
            </label>
            <input
              type="file"
              className="form-control"
              name="googleCredentials"
              accept="application/json"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Save Sheets Config
          </button>
        </form>
        {sheetConfigMessage && (
          <div className="mt-2 text-info">{sheetConfigMessage}</div>
        )}
        <div className="form-text mt-2">
          <b>How to get these details?</b>
          <br />
          1.{" "}
          <a
            href="https://console.cloud.google.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Google Cloud Console
          </a>{" "}
          → Create Project → Enable Google Sheets & Drive API
          <br />
          2. Create Service Account, download JSON key, and share your
          sheet with the service account email.
          <br />
          3. Paste your Sheet ID from the Google Sheets URL.
          <br />
        </div>
      </div>
    </div>
  );
};

export default GoogleSheets;
