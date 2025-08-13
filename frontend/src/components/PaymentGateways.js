import React, { useState, useEffect } from 'react';
import { fetchPaymentGateways, updatePaymentGateway, togglePaymentGateway } from '../services/api';
import { mockPaymentGateways } from '../data/mockPaymentData';
import './PaymentGateways.css';

const PaymentGateways = () => {
  const [gateways, setGateways] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [editingGateway, setEditingGateway] = useState(null);

  useEffect(() => {
    loadGateways();
  }, []);

  const loadGateways = async () => {
    try {
      setLoading(true);
      // For now, use mock data. Replace with actual API call when backend is ready
      // const data = await fetchPaymentGateways();
      const data = mockPaymentGateways;
      setGateways(data);
    } catch (error) {
      setMessage('Failed to load payment gateways');
      console.error('Error loading gateways:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleGateway = async (gatewayId, enabled) => {
    try {
      // For now, simulate API call. Replace with actual API call when backend is ready
      // await togglePaymentGateway(gatewayId, enabled);
      console.log(`Toggling gateway ${gatewayId} to ${enabled}`);
      setMessage(`Gateway ${enabled ? 'enabled' : 'disabled'} successfully`);
      loadGateways(); // Reload to get updated state
    } catch (error) {
      setMessage('Failed to update gateway status');
      console.error('Error toggling gateway:', error);
    }
  };

  const handleUpdateGateway = async (gatewayId, config) => {
    try {
      // For now, simulate API call. Replace with actual API call when backend is ready
      // await updatePaymentGateway(gatewayId, config);
      console.log(`Updating gateway ${gatewayId} with config:`, config);
      setMessage('Gateway configuration updated successfully');
      setEditingGateway(null);
      loadGateways(); // Reload to get updated data
    } catch (error) {
      setMessage('Failed to update gateway configuration');
      console.error('Error updating gateway:', error);
    }
  };

  const handleEditClick = (gateway) => {
    setEditingGateway(gateway);
  };

  const handleCancelEdit = () => {
    setEditingGateway(null);
  };

  const handleSubmitConfig = (e, gatewayId) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const config = {
      apiKey: formData.get('apiKey'),
      secretKey: formData.get('secretKey'),
      webhookUrl: formData.get('webhookUrl'),
      isTestMode: formData.get('isTestMode') === 'true'
    };
    handleUpdateGateway(gatewayId, config);
  };

  if (loading) {
    return (
      <div className="payment-gateways-container">
        <div className="loading-spinner">Loading payment gateways...</div>
      </div>
    );
  }

  return (
    <div className="payment-gateways-container">
      <div className="payment-gateways-header">
        <h2>💳 Payment Gateways</h2>
        <p>Configure and manage payment gateway integrations</p>
      </div>

      {message && (
        <div className={`message ${message.includes('successfully') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <div className="gateways-grid">
        {gateways.map((gateway) => (
          <div key={gateway.id} className={`gateway-card ${gateway.enabled ? 'enabled' : 'disabled'}`}>
            <div className="gateway-header">
              <div className="gateway-info">
                <div className="gateway-icon">{gateway.icon}</div>
                <div className="gateway-details">
                  <h3>{gateway.name}</h3>
                  <p>{gateway.description}</p>
                  <span className={`status ${gateway.enabled ? 'active' : 'inactive'}`}>
                    {gateway.enabled ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <div className="gateway-actions">
                <button
                  className={`toggle-btn ${gateway.enabled ? 'enabled' : 'disabled'}`}
                  onClick={() => handleToggleGateway(gateway.id, !gateway.enabled)}
                >
                  {gateway.enabled ? 'Disable' : 'Enable'}
                </button>
                <button
                  className="edit-btn"
                  onClick={() => handleEditClick(gateway)}
                >
                  Configure
                </button>
              </div>
            </div>

            {editingGateway?.id === gateway.id && (
              <div className="gateway-config-form">
                <form onSubmit={(e) => handleSubmitConfig(e, gateway.id)}>
                  <div className="form-group">
                    <label htmlFor={`apiKey-${gateway.id}`}>API Key</label>
                    <input
                      type="password"
                      id={`apiKey-${gateway.id}`}
                      name="apiKey"
                      defaultValue={gateway.config?.apiKey || ''}
                      placeholder="Enter API Key"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor={`secretKey-${gateway.id}`}>Secret Key</label>
                    <input
                      type="password"
                      id={`secretKey-${gateway.id}`}
                      name="secretKey"
                      defaultValue={gateway.config?.secretKey || ''}
                      placeholder="Enter Secret Key"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor={`webhookUrl-${gateway.id}`}>Webhook URL</label>
                    <input
                      type="url"
                      id={`webhookUrl-${gateway.id}`}
                      name="webhookUrl"
                      defaultValue={gateway.config?.webhookUrl || ''}
                      placeholder="https://your-domain.com/webhook"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor={`isTestMode-${gateway.id}`}>Test Mode</label>
                    <select
                      id={`isTestMode-${gateway.id}`}
                      name="isTestMode"
                      defaultValue={gateway.config?.isTestMode ? 'true' : 'false'}
                    >
                      <option value="true">Enabled</option>
                      <option value="false">Disabled</option>
                    </select>
                  </div>
                  
                  <div className="form-actions">
                    <button type="submit" className="save-btn">
                      Save Configuration
                    </button>
                    <button
                      type="button"
                      className="cancel-btn"
                      onClick={handleCancelEdit}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="gateway-features">
              <h4>Features:</h4>
              <ul>
                {gateway.features?.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PaymentGateways;
