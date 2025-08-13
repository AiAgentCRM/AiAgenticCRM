import React, { useState, useEffect } from 'react';
import { fetchPaymentHistory } from '../services/api';
import { mockPaymentHistory, filterPaymentHistory } from '../data/mockPaymentData';
import './PaymentHistory.css';

const PaymentHistory = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    gateway: '',
    dateFrom: '',
    dateTo: ''
  });
  const [showRefundConfirm, setShowRefundConfirm] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

  useEffect(() => {
    loadPaymentHistory();
  }, [filters]);

  const loadPaymentHistory = async () => {
    try {
      setLoading(true);
      // For now, use mock data. Replace with actual API call when backend is ready
      // const data = await fetchPaymentHistory(filters);
      const data = filterPaymentHistory(mockPaymentHistory, filters);
      setPayments(data);
    } catch (error) {
      setMessage('Failed to load payment history');
      console.error('Error loading payment history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      gateway: '',
      dateFrom: '',
      dateTo: ''
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'success': { class: 'success', icon: '✅' },
      'failed': { class: 'failed', icon: '❌' },
      'pending': { class: 'pending', icon: '⏳' },
      'refunded': { class: 'refunded', icon: '↩️' },
      'cancelled': { class: 'cancelled', icon: '🚫' }
    };

    const config = statusConfig[status.toLowerCase()] || { class: 'unknown', icon: '❓' };

    return (
      <span className={`status-badge ${config.class}`}>
        {config.icon} {status}
      </span>
    );
  };

  const getGatewayIcon = (gateway) => {
    const gatewayIcons = {
      'razorpay': '💳',
      'cashfree': '💰',
      'paypal': '🔵',
      'stripe': '💳'
    };
    return gatewayIcons[gateway.toLowerCase()] || '💳';
  };

  if (loading) {
    return (
      <div className="payment-history-container">
        <div className="loading-spinner">Loading payment history...</div>
      </div>
    );
  }

  return (
    <div className="payment-history-container">
      <div className="payment-history-header">
        <h2>📊 Payment History</h2>
        <p>View and manage payment transactions</p>
      </div>

      {message && (
        <div className="message error">
          {message}
        </div>
      )}

      {/* Filters Section */}
      <div className="filters-section">
        <h3>Filters</h3>
        <div className="filters-grid">
          <div className="filter-group">
            <label htmlFor="status">Payment Status</label>
            <select
              id="status"
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
            >
              <option value="">All Status</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
              <option value="refunded">Refunded</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="gateway">Payment Gateway</label>
            <select
              id="gateway"
              name="gateway"
              value={filters.gateway}
              onChange={handleFilterChange}
            >
              <option value="">All Gateways</option>
              <option value="razorpay">Razorpay</option>
              <option value="cashfree">Cashfree</option>
              <option value="paypal">PayPal</option>
              <option value="stripe">Stripe</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="dateFrom">From Date</label>
            <input
              type="date"
              id="dateFrom"
              name="dateFrom"
              value={filters.dateFrom}
              onChange={handleFilterChange}
            />
          </div>

          <div className="filter-group">
            <label htmlFor="dateTo">To Date</label>
            <input
              type="date"
              id="dateTo"
              name="dateTo"
              value={filters.dateTo}
              onChange={handleFilterChange}
            />
          </div>
        </div>

        <div className="filter-actions">
          <button className="clear-filters-btn" onClick={clearFilters}>
            Clear Filters
          </button>
        </div>
      </div>

      {/* Payment History Table */}
      <div className="payment-history-table-container">
        <div className="table-header">
          <h3>Transaction History</h3>
          <span className="total-count">
            Total: {payments.length} transactions
          </span>
        </div>

        {payments.length === 0 ? (
          <div className="no-data">
            <div className="no-data-icon">📭</div>
            <p>No payment transactions found</p>
            <small>Try adjusting your filters or check back later</small>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="payment-history-table">
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Tenant</th>
                  <th>Plan</th>
                  <th>Gateway</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date & Time</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className={`payment-row ${payment.status.toLowerCase()}`}>
                    <td className="transaction-id">
                      <span className="id-text">{payment.transactionId}</span>
                      <button 
                        className="copy-btn"
                        onClick={() => navigator.clipboard.writeText(payment.transactionId)}
                        title="Copy Transaction ID"
                      >
                        📋
                      </button>
                    </td>
                    <td className="tenant-info">
                      <div className="tenant-name">{payment.tenantName}</div>
                      <div className="tenant-email">{payment.tenantEmail}</div>
                    </td>
                    <td className="plan-info">
                      <div className="plan-name">{payment.planName}</div>
                      <div className="plan-duration">{payment.planDuration}</div>
                    </td>
                    <td className="gateway-info">
                      <span className="gateway-icon">
                        {getGatewayIcon(payment.gateway)}
                      </span>
                      <span className="gateway-name">{payment.gateway}</span>
                    </td>
                    <td className="amount">
                      <span className="amount-value">{formatAmount(payment.amount)}</span>
                      <div className="currency">{payment.currency}</div>
                    </td>
                    <td className="status">
                      {getStatusBadge(payment.status)}
                    </td>
                    <td className="date-time">
                      {formatDate(payment.createdAt)}
                    </td>
                    <td className="actions">
                      <button 
                        className="view-details-btn"
                        onClick={() => alert(`Transaction Details:\n\nID: ${payment.transactionId}\nAmount: ${formatAmount(payment.amount)}\nStatus: ${payment.status}\nGateway: ${payment.gateway}\nPlan: ${payment.planName}\nTenant: ${payment.tenantName}`)}
                        title="View Details"
                      >
                        👁️
                      </button>
                      {payment.status === 'success' && (
                        <button 
                          className="refund-btn"
                          onClick={() => {
                            setSelectedPayment(payment);
                            setShowRefundConfirm(true);
                          }}
                          title="Process Refund"
                        >
                          ↩️
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary Statistics */}
      {payments.length > 0 && (
        <div className="payment-summary">
          <h3>Summary</h3>
          <div className="summary-grid">
            <div className="summary-card">
              <div className="summary-icon">💰</div>
              <div className="summary-content">
                <div className="summary-value">
                  {formatAmount(payments.reduce((sum, p) => sum + (p.status === 'success' ? p.amount : 0), 0))}
                </div>
                <div className="summary-label">Total Revenue</div>
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-icon">✅</div>
              <div className="summary-content">
                <div className="summary-value">
                  {payments.filter(p => p.status === 'success').length}
                </div>
                <div className="summary-label">Successful Payments</div>
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-icon">❌</div>
              <div className="summary-content">
                <div className="summary-value">
                  {payments.filter(p => p.status === 'failed').length}
                </div>
                <div className="summary-label">Failed Payments</div>
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-icon">↩️</div>
              <div className="summary-content">
                <div className="summary-value">
                  {payments.filter(p => p.status === 'refunded').length}
                </div>
                <div className="summary-label">Refunded</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Refund Confirmation Dialog */}
      {showRefundConfirm && selectedPayment && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Confirm Refund</h3>
            <p>Are you sure you want to process a refund for transaction {selectedPayment.transactionId}?</p>
            <div className="modal-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  setShowRefundConfirm(false);
                  setSelectedPayment(null);
                }}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={() => {
                  alert('Refund functionality would be implemented here');
                  setShowRefundConfirm(false);
                  setSelectedPayment(null);
                }}
              >
                Confirm Refund
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentHistory;
