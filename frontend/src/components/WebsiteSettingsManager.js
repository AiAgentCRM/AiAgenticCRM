import React, { useState, useEffect } from 'react';
import { fetchWebsiteSettings, updateWebsiteSettings } from '../services/api';

const WebsiteSettingsManager = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await fetchWebsiteSettings();
      setSettings(data);
    } catch (error) {
      console.error('Failed to load website settings:', error);
      setMessage('Failed to load website settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateWebsiteSettings(settings);
      setMessage('Website settings updated successfully');
    } catch (error) {
      setMessage('Failed to update website settings');
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

  const addFeature = () => {
    const newFeature = { title: '', description: '', icon: '' };
    setSettings({
      ...settings,
      homepage: {
        ...settings.homepage,
        features: [...(settings.homepage.features || []), newFeature]
      }
    });
  };

  const removeFeature = (index) => {
    const newFeatures = settings.homepage.features.filter((_, i) => i !== index);
    setSettings({
      ...settings,
      homepage: {
        ...settings.homepage,
        features: newFeatures
      }
    });
  };

  const updateFeature = (index, field, value) => {
    const newFeatures = [...settings.homepage.features];
    newFeatures[index] = { ...newFeatures[index], [field]: value };
    setSettings({
      ...settings,
      homepage: {
        ...settings.homepage,
        features: newFeatures
      }
    });
  };

  const addTestimonial = () => {
    const newTestimonial = { name: '', company: '', text: '', rating: 5 };
    setSettings({
      ...settings,
      homepage: {
        ...settings.homepage,
        testimonials: [...(settings.homepage.testimonials || []), newTestimonial]
      }
    });
  };

  const removeTestimonial = (index) => {
    const newTestimonials = settings.homepage.testimonials.filter((_, i) => i !== index);
    setSettings({
      ...settings,
      homepage: {
        ...settings.homepage,
        testimonials: newTestimonials
      }
    });
  };

  const updateTestimonial = (index, field, value) => {
    const newTestimonials = [...settings.homepage.testimonials];
    newTestimonials[index] = { ...newTestimonials[index], [field]: value };
    setSettings({
      ...settings,
      homepage: {
        ...settings.homepage,
        testimonials: newTestimonials
      }
    });
  };

  if (loading) {
    return <div className="text-center">Loading website settings...</div>;
  }

  if (!settings) {
    return <div className="text-center text-danger">Failed to load settings</div>;
  }

  return (
    <div className="website-settings-manager">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>Website Settings</h3>
        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={saving}
        >
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
            <button
              className={`nav-link ${activeTab === 'general' ? 'active' : ''}`}
              onClick={() => setActiveTab('general')}
            >
              General
            </button>
            <button
              className={`nav-link ${activeTab === 'homepage' ? 'active' : ''}`}
              onClick={() => setActiveTab('homepage')}
            >
              Homepage
            </button>
            <button
              className={`nav-link ${activeTab === 'contact' ? 'active' : ''}`}
              onClick={() => setActiveTab('contact')}
            >
              Contact Info
            </button>
            <button
              className={`nav-link ${activeTab === 'footer' ? 'active' : ''}`}
              onClick={() => setActiveTab('footer')}
            >
              Footer
            </button>
            <button
              className={`nav-link ${activeTab === 'seo' ? 'active' : ''}`}
              onClick={() => setActiveTab('seo')}
            >
              SEO
            </button>
          </div>
        </div>

        <div className="col-md-9">
          <div className="card">
            <div className="card-body">
              {activeTab === 'general' && (
                <div>
                  <h5>General Settings</h5>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Site Name</label>
                        <input
                          type="text"
                          className="form-control"
                          value={settings.siteName || ''}
                          onChange={(e) => updateField('siteName', e.target.value)}
                          maxLength={100}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Site Logo URL</label>
                        <input
                          type="url"
                          className="form-control"
                          value={settings.siteLogo || ''}
                          onChange={(e) => updateField('siteLogo', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Site Favicon URL</label>
                    <input
                      type="url"
                      className="form-control"
                      value={settings.siteFavicon || ''}
                      onChange={(e) => updateField('siteFavicon', e.target.value)}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'homepage' && (
                <div>
                  <h5>Homepage Content</h5>
                  
                  <div className="mb-3">
                    <label className="form-label">Hero Title</label>
                    <input
                      type="text"
                      className="form-control"
                      value={settings.homepage?.heroTitle || ''}
                      onChange={(e) => updateField('homepage.heroTitle', e.target.value)}
                      maxLength={200}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Hero Subtitle</label>
                    <input
                      type="text"
                      className="form-control"
                      value={settings.homepage?.heroSubtitle || ''}
                      onChange={(e) => updateField('homepage.heroSubtitle', e.target.value)}
                      maxLength={500}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Hero Description</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={settings.homepage?.heroDescription || ''}
                      onChange={(e) => updateField('homepage.heroDescription', e.target.value)}
                      maxLength={1000}
                    />
                  </div>

                  <h6>Features</h6>
                  {(settings.homepage?.features || []).map((feature, index) => (
                    <div key={index} className="card mb-3">
                      <div className="card-body">
                        <div className="row">
                          <div className="col-md-4">
                            <label className="form-label">Icon</label>
                            <input
                              type="text"
                              className="form-control"
                              value={feature.icon || ''}
                              onChange={(e) => updateFeature(index, 'icon', e.target.value)}
                              placeholder="🚀"
                            />
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">Title</label>
                            <input
                              type="text"
                              className="form-control"
                              value={feature.title || ''}
                              onChange={(e) => updateFeature(index, 'title', e.target.value)}
                              maxLength={100}
                            />
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">Actions</label>
                            <button
                              type="button"
                              className="btn btn-sm btn-danger"
                              onClick={() => removeFeature(index)}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                        <div className="mt-2">
                          <label className="form-label">Description</label>
                          <textarea
                            className="form-control"
                            rows="2"
                            value={feature.description || ''}
                            onChange={(e) => updateFeature(index, 'description', e.target.value)}
                            maxLength={300}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button type="button" className="btn btn-outline-primary" onClick={addFeature}>
                    Add Feature
                  </button>

                  <h6 className="mt-4">Testimonials</h6>
                  {(settings.homepage?.testimonials || []).map((testimonial, index) => (
                    <div key={index} className="card mb-3">
                      <div className="card-body">
                        <div className="row">
                          <div className="col-md-3">
                            <label className="form-label">Name</label>
                            <input
                              type="text"
                              className="form-control"
                              value={testimonial.name || ''}
                              onChange={(e) => updateTestimonial(index, 'name', e.target.value)}
                              maxLength={100}
                            />
                          </div>
                          <div className="col-md-3">
                            <label className="form-label">Company</label>
                            <input
                              type="text"
                              className="form-control"
                              value={testimonial.company || ''}
                              onChange={(e) => updateTestimonial(index, 'company', e.target.value)}
                              maxLength={100}
                            />
                          </div>
                          <div className="col-md-2">
                            <label className="form-label">Rating</label>
                            <select
                              className="form-select"
                              value={testimonial.rating || 5}
                              onChange={(e) => updateTestimonial(index, 'rating', parseInt(e.target.value))}
                            >
                              {[1, 2, 3, 4, 5].map(rating => (
                                <option key={rating} value={rating}>{rating} ⭐</option>
                              ))}
                            </select>
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">Actions</label>
                            <button
                              type="button"
                              className="btn btn-sm btn-danger"
                              onClick={() => removeTestimonial(index)}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                        <div className="mt-2">
                          <label className="form-label">Testimonial Text</label>
                          <textarea
                            className="form-control"
                            rows="2"
                            value={testimonial.text || ''}
                            onChange={(e) => updateTestimonial(index, 'text', e.target.value)}
                            maxLength={500}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button type="button" className="btn btn-outline-primary" onClick={addTestimonial}>
                    Add Testimonial
                  </button>
                </div>
              )}

              {activeTab === 'contact' && (
                <div>
                  <h5>Contact Information</h5>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Email</label>
                        <input
                          type="email"
                          className="form-control"
                          value={settings.contact?.email || ''}
                          onChange={(e) => updateField('contact.email', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Phone</label>
                        <input
                          type="text"
                          className="form-control"
                          value={settings.contact?.phone || ''}
                          onChange={(e) => updateField('contact.phone', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Address</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      value={settings.contact?.address || ''}
                      onChange={(e) => updateField('contact.address', e.target.value)}
                    />
                  </div>
                  <h6>Social Media</h6>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Facebook</label>
                        <input
                          type="url"
                          className="form-control"
                          value={settings.contact?.socialMedia?.facebook || ''}
                          onChange={(e) => updateField('contact.socialMedia.facebook', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Twitter</label>
                        <input
                          type="url"
                          className="form-control"
                          value={settings.contact?.socialMedia?.twitter || ''}
                          onChange={(e) => updateField('contact.socialMedia.twitter', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">LinkedIn</label>
                        <input
                          type="url"
                          className="form-control"
                          value={settings.contact?.socialMedia?.linkedin || ''}
                          onChange={(e) => updateField('contact.socialMedia.linkedin', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Instagram</label>
                        <input
                          type="url"
                          className="form-control"
                          value={settings.contact?.socialMedia?.instagram || ''}
                          onChange={(e) => updateField('contact.socialMedia.instagram', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'footer' && (
                <div>
                  <h5>Footer Settings</h5>
                  <div className="mb-3">
                    <label className="form-label">Footer Description</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={settings.footer?.description || ''}
                      onChange={(e) => updateField('footer.description', e.target.value)}
                      maxLength={500}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'seo' && (
                <div>
                  <h5>SEO Settings</h5>
                  <div className="mb-3">
                    <label className="form-label">Meta Title</label>
                    <input
                      type="text"
                      className="form-control"
                      value={settings.seo?.metaTitle || ''}
                      onChange={(e) => updateField('seo.metaTitle', e.target.value)}
                      maxLength={60}
                    />
                    <small className="text-muted">Maximum 60 characters</small>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Meta Description</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      value={settings.seo?.metaDescription || ''}
                      onChange={(e) => updateField('seo.metaDescription', e.target.value)}
                      maxLength={160}
                    />
                    <small className="text-muted">Maximum 160 characters</small>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Meta Keywords</label>
                    <input
                      type="text"
                      className="form-control"
                      value={settings.seo?.metaKeywords || ''}
                      onChange={(e) => updateField('seo.metaKeywords', e.target.value)}
                      maxLength={500}
                    />
                    <small className="text-muted">Comma-separated keywords</small>
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

export default WebsiteSettingsManager;
