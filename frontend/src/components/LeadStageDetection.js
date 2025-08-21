import React, { useState, useEffect } from "react";
import { fetchSettings, updateSettings } from "../services/api";
import "./LeadStageDetection.css";

const LeadStageDetection = ({ tenantId }) => {
  const [leadStages, setLeadStages] = useState([
    {
      stage: "Initial Contact",
      description: "First contact - gathering basic information",
      keywords: ["hello", "hi", "hey", "interested", "information", "tell me", "what do you do", "help", "support"],
      priority: 1
    },
    {
      stage: "Service Inquiry",
      description: "Asking about specific services and pricing",
      keywords: ["website", "app", "mobile", "cloud", "development", "services", "pricing", "cost", "price", "features", "what can you do", "capabilities"],
      priority: 2
    },
    {
      stage: "Budget Discussion",
      description: "Discussing budget and financial considerations",
      keywords: ["budget", "afford", "expensive", "cheap", "cost-effective", "investment", "roi", "return", "money", "payment", "plan", "package"],
      priority: 3
    },
    {
      stage: "Timeline Inquiry",
      description: "Asking about project timeline and deadlines",
      keywords: ["when", "timeline", "deadline", "urgent", "quick", "fast", "time", "schedule", "how long", "duration", "start", "finish"],
      priority: 4
    },
    {
      stage: "Meeting Request",
      description: "Requesting a meeting or appointment",
      keywords: ["meeting", "appointment", "call", "schedule", "demo", "discussion", "talk", "consultation", "call me", "contact me"],
      priority: 5
    },
    {
      stage: "Ready to Proceed",
      description: "Ready to move forward with the project",
      keywords: ["yes", "okay", "sure", "let's do it", "proceed", "start", "begin", "go ahead", "perfect", "great", "sounds good"],
      priority: 6
    }
  ]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadLeadStages();
  }, [tenantId]);

  const loadLeadStages = async () => {
    try {
      const data = await fetchSettings(tenantId);
      if (data.leadStages && Array.isArray(data.leadStages)) {
        setLeadStages(data.leadStages);
      }
    } catch (error) {
      console.error("Error loading lead stages:", error);
    }
  };

  const handleStageChange = (idx, field, value) => {
    const newStages = [...leadStages];
    if (field === "keywords") {
      newStages[idx][field] = value.split(",").map(k => k.trim()).filter(k => k);
    } else if (field === "priority") {
      newStages[idx][field] = parseInt(value) || 1;
    } else {
      newStages[idx][field] = value;
    }
    setLeadStages(newStages);
  };

  const handleAddStage = () => {
    const newStage = {
      stage: "",
      description: "",
      keywords: [],
      priority: leadStages.length + 1
    };
    setLeadStages([...leadStages, newStage]);
  };

  const handleRemoveStage = (idx) => {
    if (leadStages.length > 1) {
      const newStages = leadStages.filter((_, index) => index !== idx);
      // Reorder priorities
      newStages.forEach((stage, index) => {
        stage.priority = index + 1;
      });
      setLeadStages(newStages);
    }
  };

  const handleMoveStage = (idx, direction) => {
    if ((direction === "up" && idx > 0) || (direction === "down" && idx < leadStages.length - 1)) {
      const newStages = [...leadStages];
      const newIdx = direction === "up" ? idx - 1 : idx + 1;
      
      // Swap stages
      [newStages[idx], newStages[newIdx]] = [newStages[newIdx], newStages[idx]];
      
      // Update priorities
      newStages.forEach((stage, index) => {
        stage.priority = index + 1;
      });
      
      setLeadStages(newStages);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    
    try {
      const data = await updateSettings(tenantId, {
        leadStages: leadStages
      });

      if (data) {
        setMessage("Lead stages saved successfully!");
        setIsEditing(false);
      } else {
        setMessage("Error saving lead stages. Please try again.");
      }
    } catch (error) {
      console.error("Error saving lead stages:", error);
      setMessage("Error saving lead stages. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    loadLeadStages();
    setIsEditing(false);
    setMessage("");
  };

  return (
    <div className="lead-stage-detection">
      <div className="page-header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="page-title">Lead Stage Detection</h1>
            <p className="page-subtitle">
              Configure how your CRM automatically detects and categorizes lead conversation stages
            </p>
          </div>
          <div className="header-actions">
            {!isEditing ? (
              <button 
                className="btn btn-primary"
                onClick={() => setIsEditing(true)}
              >
                <span className="btn-icon">✏️</span>
                Edit Stages
              </button>
            ) : (
              <>
                <button 
                  className="btn btn-success me-2"
                  onClick={handleSave}
                  disabled={saving}
                >
                  <span className="btn-icon">
                    {saving ? '⏳' : '💾'}
                  </span>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button 
                  className="btn btn-outline-secondary"
                  onClick={handleReset}
                >
                  <span className="btn-icon">🔄</span>
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="content-section">
        <div className="info-card">
          <div className="info-icon">ℹ️</div>
          <div className="info-content">
            <h5>How Lead Stage Detection Works</h5>
            <p>
              Your CRM automatically analyzes incoming messages and categorizes them into sales conversation stages. 
              Each stage has keywords that trigger detection, helping you understand where leads are in your sales funnel.
            </p>
          </div>
        </div>

        <div className="stages-container">
          <div className="stages-header">
            <h3>Lead Stages Configuration</h3>
            {isEditing && (
              <button 
                className="btn btn-outline-primary btn-sm"
                onClick={handleAddStage}
                type="button"
              >
                <span className="btn-icon">➕</span>
                Add New Stage
              </button>
            )}
          </div>

          {leadStages.map((stage, idx) => (
            <div key={idx} className={`stage-card ${isEditing ? 'editing' : ''}`}>
              <div className="stage-header">
                <div className="stage-priority">
                  <span className="priority-badge">#{stage.priority}</span>
                </div>
                <div className="stage-title">
                  <h4>{isEditing ? (
                    <input
                      type="text"
                      className="form-control stage-name-input"
                      value={stage.stage}
                      onChange={(e) => handleStageChange(idx, "stage", e.target.value)}
                      placeholder="Stage name"
                    />
                  ) : stage.stage}</h4>
                </div>
                {isEditing && (
                  <div className="stage-actions">
                    <button 
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => handleMoveStage(idx, "up")}
                      disabled={idx === 0}
                      title="Move Up"
                    >
                      ⬆️
                    </button>
                    <button 
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => handleMoveStage(idx, "down")}
                      disabled={idx === leadStages.length - 1}
                      title="Move Down"
                    >
                      ⬇️
                    </button>
                    <button 
                      className="btn btn-sm btn-danger"
                      onClick={() => handleRemoveStage(idx)}
                      disabled={leadStages.length <= 1}
                      title="Remove Stage"
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </div>

              <div className="stage-content">
                <div className="stage-description">
                  <label>Description:</label>
                  {isEditing ? (
                    <input
                      type="text"
                      className="form-control"
                      value={stage.description}
                      onChange={(e) => handleStageChange(idx, "description", e.target.value)}
                      placeholder="Describe what this stage represents"
                    />
                  ) : (
                    <p>{stage.description}</p>
                  )}
                </div>

                <div className="stage-keywords">
                  <label>Trigger Keywords:</label>
                  {isEditing ? (
                    <input
                      type="text"
                      className="form-control"
                      value={stage.keywords.join(", ")}
                      onChange={(e) => handleStageChange(idx, "keywords", e.target.value)}
                      placeholder="Enter keywords separated by commas"
                    />
                  ) : (
                    <div className="keywords-display">
                      {stage.keywords.map((keyword, keyIdx) => (
                        <span key={keyIdx} className="keyword-tag">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {isEditing && (
                  <div className="stage-priority-edit">
                    <label>Priority Order:</label>
                    <input
                      type="number"
                      className="form-control"
                      value={stage.priority}
                      min={1}
                      max={leadStages.length}
                      onChange={(e) => handleStageChange(idx, "priority", e.target.value)}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {message && (
          <div className={`alert ${message.includes('successfully') ? 'alert-success' : 'alert-danger'} mt-3`}>
            {message}
          </div>
        )}

        <div className="help-section">
          <h4>💡 Tips for Effective Lead Stage Detection</h4>
          <ul>
            <li><strong>Use specific keywords:</strong> Instead of "hello", use "interested in services"</li>
            <li><strong>Consider context:</strong> "pricing" might mean different things in different stages</li>
            <li><strong>Order matters:</strong> Stages are processed in priority order</li>
            <li><strong>Test regularly:</strong> Monitor how well your keywords are detecting stages</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default LeadStageDetection;
