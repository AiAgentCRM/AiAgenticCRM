const express = require('express');
const router = express.Router();

// Mock data for payment gateways (replace with database queries)
const mockPaymentGateways = [
  {
    id: 'razorpay',
    name: 'Razorpay',
    description: 'Leading payment gateway for India',
    icon: '💳',
    enabled: true,
    config: {
      apiKey: 'rzp_test_1234567890',
      secretKey: 'secret_1234567890',
      webhookUrl: 'https://your-domain.com/webhook/razorpay',
      isTestMode: true
    },
    features: [
      'UPI Payments',
      'Credit/Debit Cards',
      'Net Banking',
      'Digital Wallets',
      'International Payments'
    ]
  },
  {
    id: 'cashfree',
    name: 'Cashfree',
    description: 'Fast and secure payment solutions',
    icon: '💰',
    enabled: false,
    config: {
      apiKey: '',
      secretKey: '',
      webhookUrl: '',
      isTestMode: true
    },
    features: [
      'UPI Payments',
      'Credit/Debit Cards',
      'Net Banking',
      'Pay Later',
      'Subscription Billing'
    ]
  },
  {
    id: 'paypal',
    name: 'PayPal',
    description: 'Global payment platform',
    icon: '🔵',
    enabled: true,
    config: {
      apiKey: 'paypal_client_id_123',
      secretKey: 'paypal_secret_123',
      webhookUrl: 'https://your-domain.com/webhook/paypal',
      isTestMode: false
    },
    features: [
      'Global Payments',
      'Credit/Debit Cards',
      'PayPal Balance',
      'Buy Now Pay Later',
      'Recurring Payments'
    ]
  },
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Complete payment platform',
    icon: '💳',
    enabled: false,
    config: {
      apiKey: '',
      secretKey: '',
      webhookUrl: '',
      isTestMode: true
    },
    features: [
      'Global Payments',
      'Credit/Debit Cards',
      'Digital Wallets',
      'Bank Transfers',
      'Subscription Management'
    ]
  }
];

// Mock payment history data (replace with database queries)
const mockPaymentHistory = [
  {
    id: '1',
    transactionId: 'TXN_001_2024_001',
    tenantName: 'Tech Solutions Inc',
    tenantEmail: 'admin@techsolutions.com',
    planName: 'Gold Plan',
    planDuration: 'Monthly',
    gateway: 'Razorpay',
    amount: 8,325,
    currency: 'INR',
    status: 'success',
    createdAt: '2024-01-15T10:30:00Z'
  },
  {
    id: '2',
    transactionId: 'TXN_002_2024_001',
    tenantName: 'Digital Marketing Pro',
    tenantEmail: 'contact@digitalmarketingpro.com',
    planName: 'Silver Plan',
    planDuration: 'Monthly',
    gateway: 'PayPal',
    amount: 4,150,
    currency: 'INR',
    status: 'success',
    createdAt: '2024-01-14T15:45:00Z'
  },
  {
    id: '3',
    transactionId: 'TXN_003_2024_001',
    tenantName: 'Startup Ventures',
    tenantEmail: 'hello@startupventures.com',
    planName: 'Gold Plan',
    planDuration: 'Monthly',
    gateway: 'Razorpay',
    amount: 8,325,
    currency: 'INR',
    status: 'failed',
    createdAt: '2024-01-13T09:15:00Z'
  }
];

// Get all payment gateways
router.get('/admin/payment-gateways', (req, res) => {
  try {
    res.json(mockPaymentGateways);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch payment gateways' });
  }
});

// Update payment gateway configuration
router.put('/admin/payment-gateways/:gatewayId', (req, res) => {
  try {
    const { gatewayId } = req.params;
    const config = req.body;
    
    // Find and update the gateway
    const gateway = mockPaymentGateways.find(g => g.id === gatewayId);
    if (!gateway) {
      return res.status(404).json({ error: 'Payment gateway not found' });
    }
    
    // Update configuration
    gateway.config = { ...gateway.config, ...config };
    
    res.json({ message: 'Payment gateway updated successfully', gateway });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update payment gateway' });
  }
});

// Toggle payment gateway status
router.post('/admin/payment-gateways/:gatewayId/toggle', (req, res) => {
  try {
    const { gatewayId } = req.params;
    const { enabled } = req.body;
    
    // Find and update the gateway
    const gateway = mockPaymentGateways.find(g => g.id === gatewayId);
    if (!gateway) {
      return res.status(404).json({ error: 'Payment gateway not found' });
    }
    
    // Update enabled status
    gateway.enabled = enabled;
    
    res.json({ message: `Payment gateway ${enabled ? 'enabled' : 'disabled'} successfully`, gateway });
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle payment gateway' });
  }
});

// Get payment history with filters
router.get('/admin/payment-history', (req, res) => {
  try {
    const { status, gateway, dateFrom, dateTo } = req.query;
    
    let filteredPayments = [...mockPaymentHistory];
    
    // Apply filters
    if (status) {
      filteredPayments = filteredPayments.filter(p => p.status === status);
    }
    
    if (gateway) {
      filteredPayments = filteredPayments.filter(p => 
        p.gateway.toLowerCase() === gateway.toLowerCase()
      );
    }
    
    if (dateFrom) {
      filteredPayments = filteredPayments.filter(p => 
        new Date(p.createdAt) >= new Date(dateFrom)
      );
    }
    
    if (dateTo) {
      filteredPayments = filteredPayments.filter(p => 
        new Date(p.createdAt) <= new Date(dateTo)
      );
    }
    
    res.json(filteredPayments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch payment history' });
  }
});

// Create payment intent
router.post('/admin/payment-intent', (req, res) => {
  try {
    const { planId, gatewayId } = req.body;
    
    // Mock payment intent creation
    const paymentIntent = {
      id: `pi_${Date.now()}`,
      planId,
      gatewayId,
      amount: 8,325, // Mock amount
      currency: 'INR',
      status: 'requires_payment_method',
      created_at: new Date().toISOString()
    };
    
    res.json(paymentIntent);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

// Process payment
router.post('/admin/process-payment', (req, res) => {
  try {
    const paymentData = req.body;
    
    // Mock payment processing
    const payment = {
      id: `pay_${Date.now()}`,
      transactionId: `TXN_${Date.now()}`,
      ...paymentData,
      status: 'success',
      createdAt: new Date().toISOString()
    };
    
    res.json({ message: 'Payment processed successfully', payment });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process payment' });
  }
});

module.exports = router;
