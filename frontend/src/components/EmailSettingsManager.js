import React, { useState, useEffect, useRef } from 'react';
import { fetchEmailSettings, updateEmailSettings, testSMTPConnection } from '../services/api';

const EmailSettingsManager = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('smtp');
  const editorRefs = useRef({});
  const [previewOpen, setPreviewOpen] = useState({});

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await fetchEmailSettings();
      setSettings(data);
    } catch (error) {
      console.error('Failed to load email settings:', error);
      setMessage('Failed to load email settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateEmailSettings(settings);
      setMessage('Email settings updated successfully');
    } catch (error) {
      setMessage('Failed to update email settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTestSMTP = async () => {
    setTesting(true);
    try {
      const result = await testSMTPConnection(settings.smtp);
      setMessage(result.message || 'SMTP test completed');
    } catch (error) {
      setMessage('SMTP test failed: ' + (error.message || 'Unknown error'));
    } finally {
      setTesting(false);
    }
  };

  const updateField = (path, value) => {
    const newSettings = { ...settings };
    const keys = path.split('.');
    let current = newSettings;
    
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    setSettings(newSettings);
  };

  const updateTemplate = (templateName, field, value) => {
    setSettings({
      ...settings,
      templates: {
        ...settings.templates,
        [templateName]: {
          ...settings.templates[templateName],
          [field]: value
        }
      }
    });
  };

  const insertAtCursor = (templateName, text) => {
    const textarea = editorRefs.current[templateName];
    const currentValue = settings.templates?.[templateName]?.body || '';
    if (!textarea) {
      updateTemplate(templateName, 'body', currentValue + text);
      return;
    }
    const start = textarea.selectionStart || 0;
    const end = textarea.selectionEnd || 0;
    const newValue = currentValue.slice(0, start) + text + currentValue.slice(end);
    updateTemplate(templateName, 'body', newValue);
    setTimeout(() => {
      textarea.focus();
      const caret = start + text.length;
      textarea.selectionStart = caret;
      textarea.selectionEnd = caret;
    }, 0);
  };

  const wrapSelection = (templateName, before, after) => {
    const textarea = editorRefs.current[templateName];
    const currentValue = settings.templates?.[templateName]?.body || '';
    if (!textarea) {
      updateTemplate(templateName, 'body', before + currentValue + after);
      return;
    }
    const start = textarea.selectionStart || 0;
    const end = textarea.selectionEnd || 0;
    const selected = currentValue.slice(start, end);
    const newValue = currentValue.slice(0, start) + before + selected + after + currentValue.slice(end);
    updateTemplate(templateName, 'body', newValue);
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = start + before.length;
      textarea.selectionEnd = start + before.length + selected.length;
    }, 0);
  };

  const insertVariable = (templateName, varName) => {
    insertAtCursor(templateName, `{{${varName}}}`);
  };

  const togglePreview = (templateName) => {
    setPreviewOpen((prev) => ({ ...prev, [templateName]: !prev[templateName] }));
  };

  const getPreviewHtml = (html) => {
    const samples = {
      userName: 'John Doe',
      planName: 'Pro',
      amount: '₹4,075',
      nextBillingDate: '2025-09-01',
      resetLink: 'https://example.com/reset',
      reason: 'Policy violation',
      currentUsage: '950',
      limit: '1000',
      feature: 'Messages'
    };
    return (html || '').replace(/\{\{\s*(\w+)\s*\}\}/g, (_, v) => samples[v] || `{{${v}}}`);
  };

  if (loading) return <div className="text-center">Loading email settings...</div>;
  if (!settings) return <div className="text-center text-danger">Failed to load settings</div>;

  return (
    <div className="email-settings-manager">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>Email Settings</h3>
        <div>
          <button className="btn btn-outline-primary me-2" onClick={handleTestSMTP} disabled={testing}>
            {testing ? 'Testing...' : 'Test SMTP'}
          </button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {message && (
        <div className={`alert alert-${message.includes('success') || message.includes('completed') ? 'success' : 'danger'} alert-dismissible fade show`}>
          {message}
          <button type="button" className="btn-close" onClick={() => setMessage('')}></button>
        </div>
      )}

      <div className="row">
        <div className="col-md-3">
          <div className="nav flex-column nav-pills">
            <button className={`nav-link ${activeTab === 'smtp' ? 'active' : ''}`} onClick={() => setActiveTab('smtp')}>
              SMTP Configuration
            </button>
            <button className={`nav-link ${activeTab === 'templates' ? 'active' : ''}`} onClick={() => setActiveTab('templates')}>
              Email Templates
            </button>
            <button className={`nav-link ${activeTab === 'preferences' ? 'active' : ''}`} onClick={() => setActiveTab('preferences')}>
              Preferences
            </button>
          </div>
        </div>

        <div className="col-md-9">
          <div className="card">
            <div className="card-body">
              {activeTab === 'smtp' && (
                <div>
                  <h5>SMTP Configuration</h5>
                  
                  <div className="form-check form-switch mb-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="smtpActive"
                      checked={settings.smtp?.isActive || false}
                      onChange={(e) => updateField('smtp.isActive', e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="smtpActive">
                      Enable SMTP
                    </label>
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">SMTP Host *</label>
                        <input
                          type="text"
                          className="form-control"
                          value={settings.smtp?.host || ''}
                          onChange={(e) => updateField('smtp.host', e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">SMTP Port *</label>
                        <input
                          type="number"
                          className="form-control"
                          value={settings.smtp?.port || ''}
                          onChange={(e) => updateField('smtp.port', parseInt(e.target.value))}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Username *</label>
                        <input
                          type="text"
                          className="form-control"
                          value={settings.smtp?.username || ''}
                          onChange={(e) => updateField('smtp.username', e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Password *</label>
                        <input
                          type="password"
                          className="form-control"
                          value={settings.smtp?.password || ''}
                          onChange={(e) => updateField('smtp.password', e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Encryption</label>
                        <select
                          className="form-select"
                          value={settings.smtp?.encryption || 'tls'}
                          onChange={(e) => updateField('smtp.encryption', e.target.value)}
                        >
                          <option value="tls">TLS</option>
                          <option value="ssl">SSL</option>
                          <option value="none">None</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Secure Connection</label>
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="smtpSecure"
                            checked={settings.smtp?.secure || false}
                            onChange={(e) => updateField('smtp.secure', e.target.checked)}
                          />
                          <label className="form-check-label" htmlFor="smtpSecure">
                            Use secure connection
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">From Email *</label>
                        <input
                          type="email"
                          className="form-control"
                          value={settings.smtp?.fromEmail || ''}
                          onChange={(e) => updateField('smtp.fromEmail', e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">From Name *</label>
                        <input
                          type="text"
                          className="form-control"
                          value={settings.smtp?.fromName || ''}
                          onChange={(e) => updateField('smtp.fromName', e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'templates' && (
                <div>
                  <h5>Email Templates</h5>
                  
                  <div className="accordion" id="emailTemplatesAccordion">
                    {Object.entries(settings.templates || {}).map(([templateName, template]) => (
                      <div key={templateName} className="accordion-item">
                        <h2 className="accordion-header">
                          <button
                            className="accordion-button collapsed"
                            type="button"
                            data-bs-toggle="collapse"
                            data-bs-target={`#collapse-${templateName}`}
                          >
                            {templateName.charAt(0).toUpperCase() + templateName.slice(1)} Template
                          </button>
                        </h2>
                        <div id={`collapse-${templateName}`} className="accordion-collapse collapse" data-bs-parent="#emailTemplatesAccordion">
                          <div className="accordion-body">
                            <div className="form-check form-switch mb-3">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id={`${templateName}Active`}
                                checked={template.isActive || false}
                                onChange={(e) => updateTemplate(templateName, 'isActive', e.target.checked)}
                              />
                              <label className="form-check-label" htmlFor={`${templateName}Active`}>
                                Enable this template
                              </label>
                            </div>
                            
                            <div className="mb-3">
                              <label className="form-label">Subject *</label>
                              <input
                                type="text"
                                className="form-control"
                                value={template.subject || ''}
                                onChange={(e) => updateTemplate(templateName, 'subject', e.target.value)}
                                maxLength={200}
                              />
                            </div>
                            
                            <div className="mb-3">
                              <label className="form-label">Email Body *</label>
                              <div className="d-flex gap-2 mb-2">
                                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => wrapSelection(templateName, '<strong>', '</strong>')}>
                                  Bold
                                </button>
                                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => wrapSelection(templateName, '<em>', '</em>')}>
                                  Italic
                                </button>
                                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => wrapSelection(templateName, '<u>', '</u>')}>
                                  Underline
                                </button>
                                <div className="dropdown">
                                  <button className="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                                    Insert Variable
                                  </button>
                                  <ul className="dropdown-menu">
                                    {['userName','planName','amount','nextBillingDate','resetLink','reason','currentUsage','limit','feature'].map(v => (
                                      <li key={v}><button type="button" className="dropdown-item" onClick={() => insertVariable(templateName, v)}>{`{{${v}}}`}</button></li>
                                    ))}
                                  </ul>
                                </div>
                                <button type="button" className="btn btn-sm btn-outline-primary ms-auto" onClick={() => togglePreview(templateName)}>
                                  {previewOpen[templateName] ? 'Hide Preview' : 'Preview'}
                                </button>
                              </div>
                              <textarea
                                ref={(el) => (editorRefs.current[templateName] = el)}
                                className="form-control"
                                rows="8"
                                value={template.body || ''}
                                onChange={(e) => updateTemplate(templateName, 'body', e.target.value)}
                                maxLength={5000}
                              />
                              {previewOpen[templateName] && (
                                <div className="mt-2 p-3 border rounded" style={{ background: '#fafafa' }}>
                                  <div dangerouslySetInnerHTML={{ __html: getPreviewHtml(template.body) }} />
                                </div>
                              )}
                              <small className="text-muted">
                                Available variables: {'{{userName}}'}, {'{{planName}}'}, {'{{amount}}'}, {'{{nextBillingDate}}'}, {'{{resetLink}}'}, {'{{reason}}'}, {'{{currentUsage}}'}, {'{{limit}}'}, {'{{feature}}'}
                              </small>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'preferences' && (
                <div>
                  <h5>Email Preferences</h5>
                  
                  <div className="card">
                    <div className="card-body">
                      <div className="form-check form-switch mb-3">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="sendWelcomeEmail"
                          checked={settings.preferences?.sendWelcomeEmail || false}
                          onChange={(e) => updateField('preferences.sendWelcomeEmail', e.target.checked)}
                        />
                        <label className="form-check-label" htmlFor="sendWelcomeEmail">
                          Send welcome email to new users
                        </label>
                      </div>
                      
                      <div className="form-check form-switch mb-3">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="sendPlanPurchaseEmail"
                          checked={settings.preferences?.sendPlanPurchaseEmail || false}
                          onChange={(e) => updateField('preferences.sendPlanPurchaseEmail', e.target.checked)}
                        />
                        <label className="form-check-label" htmlFor="sendPlanPurchaseEmail">
                          Send confirmation email for plan purchases
                        </label>
                      </div>
                      
                      <div className="form-check form-switch mb-3">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="sendAccountApprovalEmail"
                          checked={settings.preferences?.sendAccountApprovalEmail || false}
                          onChange={(e) => updateField('preferences.sendAccountApprovalEmail', e.target.checked)}
                        />
                        <label className="form-check-label" htmlFor="sendAccountApprovalEmail">
                          Send email when account is approved
                        </label>
                      </div>
                      
                      <div className="form-check form-switch mb-3">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="sendUsageLimitEmail"
                          checked={settings.preferences?.sendUsageLimitEmail || false}
                          onChange={(e) => updateField('preferences.sendUsageLimitEmail', e.target.checked)}
                        />
                        <label className="form-check-label" htmlFor="sendUsageLimitEmail">
                          Send email when usage limit is reached
                        </label>
                      </div>
                      
                      <div className="form-check form-switch mb-3">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="sendMonthlyReport"
                          checked={settings.preferences?.sendMonthlyReport || false}
                          onChange={(e) => updateField('preferences.sendMonthlyReport', e.target.checked)}
                        />
                        <label className="form-check-label" htmlFor="sendMonthlyReport">
                          Send monthly usage reports
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailSettingsManager;
