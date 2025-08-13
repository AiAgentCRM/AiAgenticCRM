// Mock data for payment gateways and payment history
// This file provides sample data for testing the payment gateway functionality

export const mockPaymentGateways = [
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

export const mockPaymentHistory = [
  {
    id: '1',
    transactionId: 'TXN_001_2024_001',
    tenantName: 'Tech Solutions Inc',
    tenantEmail: 'admin@techsolutions.com',
    planName: 'Gold Plan',
    planDuration: 'Monthly',
    gateway: 'Razorpay',
    amount: 99.99,
    currency: 'USD',
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
    amount: 49.99,
    currency: 'USD',
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
    amount: 99.99,
    currency: 'USD',
    status: 'failed',
    createdAt: '2024-01-13T09:15:00Z'
  },
  {
    id: '4',
    transactionId: 'TXN_004_2024_001',
    tenantName: 'E-commerce Store',
    tenantEmail: 'support@ecommercestore.com',
    planName: 'Platinum Plan',
    planDuration: 'Monthly',
    gateway: 'Stripe',
    amount: 199.99,
    currency: 'USD',
    status: 'pending',
    createdAt: '2024-01-12T14:20:00Z'
  },
  {
    id: '5',
    transactionId: 'TXN_005_2024_001',
    tenantName: 'Consulting Firm',
    tenantEmail: 'info@consultingfirm.com',
    planName: 'Silver Plan',
    planDuration: 'Monthly',
    gateway: 'PayPal',
    amount: 49.99,
    currency: 'USD',
    status: 'refunded',
    createdAt: '2024-01-11T11:30:00Z'
  },
  {
    id: '6',
    transactionId: 'TXN_006_2024_001',
    tenantName: 'Web Development Co',
    tenantEmail: 'dev@webdevelopmentco.com',
    planName: 'Gold Plan',
    planDuration: 'Monthly',
    gateway: 'Cashfree',
    amount: 99.99,
    currency: 'USD',
    status: 'success',
    createdAt: '2024-01-10T16:45:00Z'
  },
  {
    id: '7',
    transactionId: 'TXN_007_2024_001',
    tenantName: 'Mobile App Studio',
    tenantEmail: 'hello@mobileappstudio.com',
    planName: 'Platinum Plan',
    planDuration: 'Monthly',
    gateway: 'Razorpay',
    amount: 199.99,
    currency: 'USD',
    status: 'cancelled',
    createdAt: '2024-01-09T13:10:00Z'
  },
  {
    id: '8',
    transactionId: 'TXN_008_2024_001',
    tenantName: 'AI Solutions Ltd',
    tenantEmail: 'contact@aisolutions.com',
    planName: 'Gold Plan',
    planDuration: 'Monthly',
    gateway: 'PayPal',
    amount: 99.99,
    currency: 'USD',
    status: 'success',
    createdAt: '2024-01-08T08:55:00Z'
  }
];

// Helper function to filter payment history
export const filterPaymentHistory = (payments, filters) => {
  return payments.filter(payment => {
    if (filters.status && payment.status !== filters.status) return false;
    if (filters.gateway && payment.gateway.toLowerCase() !== filters.gateway.toLowerCase()) return false;
    if (filters.dateFrom && new Date(payment.createdAt) < new Date(filters.dateFrom)) return false;
    if (filters.dateTo && new Date(payment.createdAt) > new Date(filters.dateTo)) return false;
    return true;
  });
};
