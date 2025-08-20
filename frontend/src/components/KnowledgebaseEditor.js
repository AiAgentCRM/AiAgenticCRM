import React, { useEffect, useState, useRef } from "react";
import { fetchKnowledgebase, updateKnowledgebase } from "../services/api";
import "./KnowledgebaseEditor.css";

const KnowledgebaseEditor = ({ tenantId }) => {
  const [organizationName, setOrganizationName] = useState("");
  const [content, setContent] = useState("");
  const [knowledgeSources, setKnowledgeSources] = useState([""]);
  const [uploadDocument, setUploadDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const textareaRef = useRef(null);

  useEffect(() => {
    if (tenantId) {
      fetchKnowledgebase(tenantId).then((kb) => {
        setOrganizationName(kb.organizationName || "");
        setContent(kb.content || "");
        setKnowledgeSources(kb.knowledgeSources || [""]);
        setUploadDocument(kb.uploadDocument || null);
        setLoading(false);
      });
    }
  }, [tenantId]);

  // Auto-resize textarea function
  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  };

  // Adjust height when content changes
  useEffect(() => {
    adjustTextareaHeight();
  }, [content]);

  const handleContentChange = (e) => {
    setContent(e.target.value);
    // Height will be adjusted automatically by useEffect
  };

  const handleKnowledgeSourceChange = (index, value) => {
    const newSources = [...knowledgeSources];
    newSources[index] = value;
    setKnowledgeSources(newSources);
  };

  const addKnowledgeSource = () => {
    setKnowledgeSources([...knowledgeSources, ""]);
  };

  const removeKnowledgeSource = (index) => {
    if (knowledgeSources.length > 1) {
      const newSources = knowledgeSources.filter((_, i) => i !== index);
      setKnowledgeSources(newSources);
    }
  };

  const handleSave = async () => {
    if (!tenantId) return;

    if (!organizationName.trim()) {
      setMessage("Organization name is required!");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    setSaving(true);
    try {
      // Filter out empty URLs before saving
      const filteredSources = knowledgeSources.filter(source => source.trim() !== "");
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append("organizationName", organizationName);
      formData.append("content", content);
      formData.append("knowledgeSources", JSON.stringify(filteredSources));
      
      if (uploadDocument && uploadDocument instanceof File) {
        // New file selected
        formData.append("uploadDocument", uploadDocument);
      } else if (uploadDocument && typeof uploadDocument === "string") {
        // Existing file path
        formData.append("uploadDocument", uploadDocument);
      }
      
      await updateKnowledgebase(tenantId, formData);
      setMessage("Knowledgebase updated successfully!");
    } catch (error) {
      setMessage("Failed to update knowledgebase. Please try again.");
    }
    setSaving(false);
    setTimeout(() => setMessage(""), 3000);
  };

  if (loading) return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <p className="loading-text">Loading knowledgebase...</p>
    </div>
  );

  return (
    <div className="knowledgebase-editor">
      {/* Header Section */}
      <div className="editor-header">
        <div className="header-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h3>AI Knowledgebase Configuration</h3>
        <p className="header-subtitle">Configure your AI assistant's knowledge and responses</p>
      </div>
      
      {/* Organization Name Card */}
      <div className="config-card">
        <div className="card-header">
          <div className="card-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 7L10 17L5 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h5>Organization Details</h5>
        </div>
        <div className="card-content">
          <label htmlFor="organizationName" className="form-label">
            Organization Name <span className="required">*</span>
          </label>
          <input
            type="text"
            id="organizationName"
            className="form-control"
            value={organizationName}
            onChange={(e) => setOrganizationName(e.target.value)}
            placeholder="Enter your organization name..."
            required
          />
        </div>
      </div>

       {/* Knowledge Content Card */}
      <div className="config-card">
        <div className="card-header">
          <div className="card-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 2H6A2 2 0 0 0 4 4V20A2 2 0 0 0 6 22H18A2 2 0 0 0 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 13H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 17H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10 9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h5>AI Knowledge Content</h5>
          <p className="card-description">Provide FAQs, company info, and other content for AI responses</p>
        </div>
        <div className="card-content">
          <label htmlFor="knowledgeContent" className="form-label">
            Knowledge Base Content
          </label>
          <div className="textarea-wrapper">
            <textarea
              ref={textareaRef}
              id="knowledgeContent"
              className="form-control knowledge-textarea"
              rows={8}
              value={content}
              onChange={handleContentChange}
              placeholder="Enter your knowledge base content here. Include FAQs, company information, product details, policies, and any other information that will help the AI provide accurate and helpful responses to your customers..."
              style={{ resize: 'none', overflow: 'hidden' }}
            />
            <div className="textarea-footer">
              <small className="text-muted">
                {content.length} characters
              </small>
            </div>
          </div>
        </div>
      </div>

      {/* Knowledge Sources Card */}
      <div className="config-card">
        <div className="card-header">
          <div className="card-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 13A5 5 0 0 0 7.6 5.6A5 5 0 0 0 0 10A5 5 0 0 0 7.6 14.4A5 5 0 0 0 10 13Z" stroke="currentColor" strokeWidth="2"/>
              <path d="M14 13A5 5 0 0 1 16.4 5.6A5 5 0 0 1 24 10A5 5 0 0 1 16.4 14.4A5 5 0 0 1 14 13Z" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </div>
          <h5>Knowledge Sources</h5>
          <p className="card-description">Add websites and URLs for AI to learn from</p>
        </div>
        <div className="card-content">
          <label className="form-label">Website/URL</label>
          
          {knowledgeSources.map((source, index) => (
            <div key={index} className="url-input-group">
              <div className="url-input-wrapper">
                {/* <div className="url-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 13A5 5 0 0 0 7.6 5.6A5 5 0 0 0 0 10A5 5 0 0 0 7.6 14.4A5 5 0 0 0 10 13Z" stroke="currentColor" strokeWidth="2"/>
                    <path d="M14 13A5 5 0 0 1 16.4 5.6A5 5 0 0 1 24 10A5 5 0 0 1 16.4 14.4A5 5 0 0 1 14 13Z" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div> */}
                <input
                  type="url"
                  className="form-control url-input"
                  value={source}
                  onChange={(e) => handleKnowledgeSourceChange(index, e.target.value)}
                  placeholder="Enter a Website/URL"
                />
              </div>
              {knowledgeSources.length > 1 && (
                <button
                  type="button"
                  className="remove-btn"
                  onClick={() => removeKnowledgeSource(index)}
                  title="Remove URL"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              )}
            </div>
          ))}
          
          <button
            type="button"
            className="add-url-btn"
            onClick={addKnowledgeSource}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Add URL
          </button>
        </div>
      </div>

      {/* Document Upload Card */}
      <div className="config-card">
        <div className="card-header">
          <div className="card-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 2H6A2 2 0 0 0 4 4V20A2 2 0 0 0 6 22H18A2 2 0 0 0 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h5>Document Upload</h5>
          <p className="card-description">Upload documents to enhance your knowledge base</p>
        </div>
        <div className="card-content">
          <label htmlFor="uploadDocument" className="form-label">
            Document File
          </label>
          <div className="file-upload-wrapper">
            <input
              type="file"
              id="uploadDocument"
              className="file-input"
              onChange={(e) => setUploadDocument(e.target.files[0])}
              accept=".pdf,.doc,.docx,.txt,.rtf,.csv,.xls,.xlsx"
            />
            <label htmlFor="uploadDocument" className="file-upload-label">
              <div className="upload-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 15V19A2 2 0 0 1 19 21H5A2 2 0 0 1 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M17 8L12 3L7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 3V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span>Choose a file or drag it here</span>
              <small>PDF, Word, Excel, Text, etc. (Max 10MB)</small>
            </label>
          </div>
          
          {uploadDocument && uploadDocument instanceof File && (
            <div className="file-info success">
              <div className="file-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span>Selected: {uploadDocument.name}</span>
            </div>
          )}
          {uploadDocument && typeof uploadDocument === "string" && uploadDocument && (
            <div className="file-info info">
              <div className="file-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13 16H7V14H13V16ZM13 12H7V10H13V12ZM13 8H7V6H13V8ZM15 4H5C3.89 4 3 4.89 3 6V18C3 19.11 3.89 20 5 20H19C20.11 20 21 19.11 21 18V8L15 4ZM19 18H5V6H13V9H19V18Z" fill="currentColor"/>
                </svg>
              </div>
              <div>
                <span>Current: {uploadDocument}</span>
                <small>Select a new file to replace</small>
              </div>
            </div>
          )}
        </div>
      </div>

     

      {/* Action Section */}
      <div className="action-section">
        <button
          className="save-btn"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <>
              <div className="btn-spinner"></div>
              Saving...
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 21H5A2 2 0 0 1 3 19V5A2 2 0 0 1 5 3H16L21 8V19A2 2 0 0 1 19 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M17 21V13H7V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7 3V8H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Save Knowledgebase
            </>
          )}
        </button>

        {/* Message Display */}
        {message && (
          <div className={`message ${message.includes('successfully') ? 'success' : 'error'}`}>
            <div className="message-icon">
              {message.includes('successfully') ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10.29 3.86L1.82 18A2 2 0 0 0 3.82 20H20.18A2 2 0 0 0 22.18 18L13.71 3.86A2 2 0 0 0 10.29 3.86Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 9V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 17H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            <span>{message}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default KnowledgebaseEditor;
