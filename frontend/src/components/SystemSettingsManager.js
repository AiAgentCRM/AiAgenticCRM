import React, { useState, useEffect } from 'react';
import { fetchSystemSettings, updateSystemSettings } from '../services/api';

const SystemSettingsManager = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('company');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await fetchSystemSettings();
      setSettings(data);
    } catch (error) {
      console.error('Failed to load system settings:', error);
      setMessage('Failed to load system settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSystemSettings(settings);
      setMessage('System settings updated successfully');
    } catch (error) {
      setMessage('Failed to update system settings');
    } finally {
      setSaving(false);
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

  if (loading) return <div className="text-center">Loading system settings...</div>;
  if (!settings) return <div className="text-center text-danger">Failed to load settings</div>;

  return (
    <div className="system-settings-manager">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>System Settings</h3>
        <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {message && (
        <div className={`alert alert-${message.includes('success') ? 'success' : 'danger'} alert-dismissible fade show`}>
          {message}
          <button type="button" className="btn-close" onClick={() => setMessage('')}></button>
        </div>
      )}

      <div className="row">
        <div className="col-md-3">
          <div className="nav flex-column nav-pills">
            <button className={`nav-link ${activeTab === 'company' ? 'active' : ''}`} onClick={() => setActiveTab('company')}>
              Company Info
            </button>
            <button className={`nav-link ${activeTab === 'branding' ? 'active' : ''}`} onClick={() => setActiveTab('branding')}>
              Branding
            </button>
            <button className={`nav-link ${activeTab === 'theme' ? 'active' : ''}`} onClick={() => setActiveTab('theme')}>
              Theme
            </button>
            <button className={`nav-link ${activeTab === 'localization' ? 'active' : ''}`} onClick={() => setActiveTab('localization')}>
              Localization
            </button>
            <button className={`nav-link ${activeTab === 'modules' ? 'active' : ''}`} onClick={() => setActiveTab('modules')}>
              Modules
            </button>
            <button className={`nav-link ${activeTab === 'security' ? 'active' : ''}`} onClick={() => setActiveTab('security')}>
              Security
            </button>
            <button className={`nav-link ${activeTab === 'maintenance' ? 'active' : ''}`} onClick={() => setActiveTab('maintenance')}>
              Maintenance
            </button>
          </div>
        </div>

        <div className="col-md-9">
          <div className="card">
            <div className="card-body">
              {activeTab === 'company' && (
                <div>
                  <h5>Company Information</h5>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Company Name</label>
                        <input
                          type="text"
                          className="form-control"
                          value={settings.company?.name || ''}
                          onChange={(e) => updateField('company.name', e.target.value)}
                          maxLength={100}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Company Logo URL</label>
                        <input
                          type="url"
                          className="form-control"
                          value={settings.company?.logo || ''}
                          onChange={(e) => updateField('company.logo', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Support Phone Number</label>
                        <input
                          type="tel"
                          className="form-control"
                          value={settings.company?.supportPhone || ''}
                          onChange={(e) => updateField('company.supportPhone', e.target.value)}
                          maxLength={20}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Support Email</label>
                        <input
                          type="email"
                          className="form-control"
                          value={settings.company?.supportEmail || ''}
                          onChange={(e) => updateField('company.supportEmail', e.target.value)}
                          maxLength={100}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <h6 className="mt-4 mb-3">Address Information</h6>
                  <div className="row">
                    <div className="col-12">
                      <div className="mb-3">
                        <label className="form-label">Street Address</label>
                        <input
                          type="text"
                          className="form-control"
                          value={settings.company?.address?.street || ''}
                          onChange={(e) => updateField('company.address.street', e.target.value)}
                          maxLength={200}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">City</label>
                        <input
                          type="text"
                          className="form-control"
                          value={settings.company?.address?.city || ''}
                          onChange={(e) => updateField('company.address.city', e.target.value)}
                          maxLength={100}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">State/Province</label>
                        <input
                          type="text"
                          className="form-control"
                          value={settings.company?.address?.state || ''}
                          onChange={(e) => updateField('company.address.state', e.target.value)}
                          maxLength={100}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">ZIP/Postal Code</label>
                        <input
                          type="text"
                          className="form-control"
                          value={settings.company?.address?.zipCode || ''}
                          onChange={(e) => updateField('company.address.zipCode', e.target.value)}
                          maxLength={20}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Country</label>
                        <input
                          type="text"
                          className="form-control"
                          value={settings.company?.address?.country || ''}
                          onChange={(e) => updateField('company.address.country', e.target.value)}
                          maxLength={100}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'branding' && (
                <div>
                  <h5>Branding Settings</h5>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Company Name</label>
                        <input
                          type="text"
                          className="form-control"
                          value={settings.branding?.companyName || ''}
                          onChange={(e) => updateField('branding.companyName', e.target.value)}
                          maxLength={100}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Primary Color</label>
                        <input
                          type="color"
                          className="form-control form-control-color"
                          value={settings.branding?.primaryColor || '#667eea'}
                          onChange={(e) => updateField('branding.primaryColor', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Secondary Color</label>
                        <input
                          type="color"
                          className="form-control form-control-color"
                          value={settings.branding?.secondaryColor || '#764ba2'}
                          onChange={(e) => updateField('branding.secondaryColor', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Accent Color</label>
                        <input
                          type="color"
                          className="form-control form-control-color"
                          value={settings.branding?.accentColor || '#f093fb'}
                          onChange={(e) => updateField('branding.accentColor', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Light Logo URL</label>
                        <input
                          type="url"
                          className="form-control"
                          value={settings.branding?.logoLight || ''}
                          onChange={(e) => updateField('branding.logoLight', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Dark Logo URL</label>
                        <input
                          type="url"
                          className="form-control"
                          value={settings.branding?.logoDark || ''}
                          onChange={(e) => updateField('branding.logoDark', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'theme' && (
                <div>
                  <h5>Theme Settings</h5>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Theme Mode</label>
                        <select
                          className="form-select"
                          value={settings.theme?.mode || 'light'}
                          onChange={(e) => updateField('theme.mode', e.target.value)}
                        >
                          <option value="light">Light</option>
                          <option value="dark">Dark</option>
                          <option value="auto">Auto</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Border Radius</label>
                        <select
                          className="form-select"
                          value={settings.theme?.borderRadius || 'md'}
                          onChange={(e) => updateField('theme.borderRadius', e.target.value)}
                        >
                          <option value="none">None</option>
                          <option value="sm">Small</option>
                          <option value="md">Medium</option>
                          <option value="lg">Large</option>
                          <option value="xl">Extra Large</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Font Family</label>
                    <input
                      type="text"
                      className="form-control"
                      value={settings.theme?.fontFamily || 'Inter, system-ui, sans-serif'}
                      onChange={(e) => updateField('theme.fontFamily', e.target.value)}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'localization' && (
                <div>
                  <h5>Localization Settings</h5>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Default Language</label>
                        <select
                          className="form-select"
                          value={settings.localization?.defaultLanguage || 'en'}
                          onChange={(e) => updateField('localization.defaultLanguage', e.target.value)}
                        >
                          <option value="en">English</option>
                          <option value="es">Spanish</option>
                          <option value="fr">French</option>
                          <option value="de">German</option>
                          <option value="pt">Portuguese</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Timezone</label>
                        <select
                          className="form-select"
                          value={settings.localization?.timezone || 'UTC'}
                          onChange={(e) => updateField('localization.timezone', e.target.value)}
                        >
                          <option value="UTC">UTC</option>
                          <option value="America/New_York">Eastern Time</option>
                          <option value="America/Chicago">Central Time</option>
                          <option value="America/Denver">Mountain Time</option>
                          <option value="America/Los_Angeles">Pacific Time</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Date Format</label>
                        <select
                          className="form-select"
                          value={settings.localization?.dateFormat || 'MM/DD/YYYY'}
                          onChange={(e) => updateField('localization.dateFormat', e.target.value)}
                        >
                          <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                          <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                          <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Time Format</label>
                        <select
                          className="form-select"
                          value={settings.localization?.timeFormat || '12h'}
                          onChange={(e) => updateField('localization.timeFormat', e.target.value)}
                        >
                          <option value="12h">12-hour</option>
                          <option value="24h">24-hour</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'modules' && (
                <div>
                  <h5>Module Settings</h5>
                  
                  <div className="card mb-3">
                    <div className="card-header">
                      <h6>WhatsApp Module</h6>
                    </div>
                    <div className="card-body">
                      <div className="form-check form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="whatsappEnabled"
                          checked={settings.modules?.whatsapp?.enabled || false}
                          onChange={(e) => updateField('modules.whatsapp.enabled', e.target.checked)}
                        />
                        <label className="form-check-label" htmlFor="whatsappEnabled">
                          Enable WhatsApp Integration
                        </label>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Max Connections</label>
                        <input
                          type="number"
                          className="form-control"
                          value={settings.modules?.whatsapp?.maxConnections || 10}
                          onChange={(e) => updateField('modules.whatsapp.maxConnections', parseInt(e.target.value))}
                          min="1"
                          max="100"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="card mb-3">
                    <div className="card-header">
                      <h6>AI Module</h6>
                    </div>
                    <div className="card-body">
                      <div className="form-check form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="aiEnabled"
                          checked={settings.modules?.ai?.enabled || false}
                          onChange={(e) => updateField('modules.ai.enabled', e.target.checked)}
                        />
                        <label className="form-check-label" htmlFor="aiEnabled">
                          Enable AI Features
                        </label>
                      </div>
                      <div className="row">
                        <div className="col-md-6">
                          <div className="mb-3">
                            <label className="form-label">AI Provider</label>
                            <select
                              className="form-select"
                              value={settings.modules?.ai?.provider || 'groq'}
                              onChange={(e) => updateField('modules.ai.provider', e.target.value)}
                            >
                              <option value="groq">Groq</option>
                              <option value="openai">OpenAI</option>
                              <option value="anthropic">Anthropic</option>
                            </select>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="mb-3">
                            <label className="form-label">Max Tokens</label>
                            <input
                              type="number"
                              className="form-control"
                              value={settings.modules?.ai?.maxTokens || 1000}
                              onChange={(e) => updateField('modules.ai.maxTokens', parseInt(e.target.value))}
                              min="100"
                              max="4000"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="card mb-3">
                    <div className="card-header">
                      <h6>Analytics Module</h6>
                    </div>
                    <div className="card-body">
                      <div className="form-check form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="analyticsEnabled"
                          checked={settings.modules?.analytics?.enabled || false}
                          onChange={(e) => updateField('modules.analytics.enabled', e.target.checked)}
                        />
                        <label className="form-check-label" htmlFor="analyticsEnabled">
                          Enable Analytics
                        </label>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Data Retention (days)</label>
                        <input
                          type="number"
                          className="form-control"
                          value={settings.modules?.analytics?.retentionDays || 90}
                          onChange={(e) => updateField('modules.analytics.retentionDays', parseInt(e.target.value))}
                          min="7"
                          max="365"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div>
                  <h5>Security Settings</h5>
                  
                  <div className="card mb-3">
                    <div className="card-header">
                      <h6>Password Policy</h6>
                    </div>
                    <div className="card-body">
                      <div className="row">
                        <div className="col-md-6">
                          <div className="mb-3">
                            <label className="form-label">Minimum Length</label>
                            <input
                              type="number"
                              className="form-control"
                              value={settings.security?.passwordPolicy?.minLength || 8}
                              onChange={(e) => updateField('security.passwordPolicy.minLength', parseInt(e.target.value))}
                              min="6"
                              max="20"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="requireUppercase"
                          checked={settings.security?.passwordPolicy?.requireUppercase || false}
                          onChange={(e) => updateField('security.passwordPolicy.requireUppercase', e.target.checked)}
                        />
                        <label className="form-check-label" htmlFor="requireUppercase">
                          Require Uppercase Letters
                        </label>
                      </div>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="requireLowercase"
                          checked={settings.security?.passwordPolicy?.requireLowercase || false}
                          onChange={(e) => updateField('security.passwordPolicy.requireLowercase', e.target.checked)}
                        />
                        <label className="form-check-label" htmlFor="requireLowercase">
                          Require Lowercase Letters
                        </label>
                      </div>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="requireNumbers"
                          checked={settings.security?.passwordPolicy?.requireNumbers || false}
                          onChange={(e) => updateField('security.passwordPolicy.requireNumbers', e.target.checked)}
                        />
                        <label className="form-check-label" htmlFor="requireNumbers">
                          Require Numbers
                        </label>
                      </div>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="requireSpecialChars"
                          checked={settings.security?.passwordPolicy?.requireSpecialChars || false}
                          onChange={(e) => updateField('security.passwordPolicy.requireSpecialChars', e.target.checked)}
                        />
                        <label className="form-check-label" htmlFor="requireSpecialChars">
                          Require Special Characters
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="card mb-3">
                    <div className="card-header">
                      <h6>Session Settings</h6>
                    </div>
                    <div className="card-body">
                      <div className="row">
                        <div className="col-md-6">
                          <div className="mb-3">
                            <label className="form-label">Session Timeout (minutes)</label>
                            <input
                              type="number"
                              className="form-control"
                              value={settings.security?.sessionTimeout || 480}
                              onChange={(e) => updateField('security.sessionTimeout', parseInt(e.target.value))}
                              min="15"
                              max="1440"
                            />
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="mb-3">
                            <label className="form-label">Max Login Attempts</label>
                            <input
                              type="number"
                              className="form-control"
                              value={settings.security?.maxLoginAttempts || 5}
                              onChange={(e) => updateField('security.maxLoginAttempts', parseInt(e.target.value))}
                              min="3"
                              max="10"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'maintenance' && (
                <div>
                  <h5>Maintenance Settings</h5>
                  
                  <div className="form-check form-switch mb-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="maintenanceMode"
                      checked={settings.maintenance?.mode || false}
                      onChange={(e) => updateField('maintenance.mode', e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="maintenanceMode">
                      Enable Maintenance Mode
                    </label>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Maintenance Message</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={settings.maintenance?.message || ''}
                      onChange={(e) => updateField('maintenance.message', e.target.value)}
                      maxLength={500}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Allowed IP Addresses</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={settings.maintenance?.allowedIPs?.join('\n') || ''}
                      onChange={(e) => updateField('maintenance.allowedIPs', e.target.value.split('\n').filter(ip => ip.trim()))}
                      placeholder="Enter one IP address per line"
                    />
                    <small className="text-muted">Enter one IP address per line. Leave empty to allow all IPs.</small>
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

export default SystemSettingsManager;
