// src/services/api.js
// Multi-tenant API service for backend integration

// Detect if running locally and use appropriate API base
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
// Force production backend URL unless explicitly overridden via env
const API_BASE = process.env.REACT_APP_API_BASE || "https://api.aiagenticcrm.com/api";
export const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || "https://api.aiagenticcrm.com";

// Log API configuration for debugging
console.log(`API Configuration: isLocalhost=${isLocalhost}, API_BASE=${API_BASE}, SOCKET_URL=${SOCKET_URL}`);

// Helper function to get auth headers
function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

// Helper function to get admin auth headers
function getAdminAuthHeaders() {
  const adminToken = localStorage.getItem("adminToken");
  return {
    "Content-Type": "application/json",
    ...(adminToken && { Authorization: `Bearer ${adminToken}` }),
  };
}

// Helper function to get tenant-scoped URL
function getTenantUrl(tenantId, endpoint) {
  return `${API_BASE}/${tenantId}/${endpoint}`;
}

// Authentication APIs
export async function register(businessData) {
  const res = await fetch(`${API_BASE}/admin/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(businessData),
  });
  return res.json();
}

export async function login(credentials) {
  const res = await fetch(`${API_BASE}/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
  return res.json();
}

// Admin Authentication APIs
export async function adminLogin(credentials) {
  const res = await fetch(`${API_BASE}/admin/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
  return res.json();
}

export async function adminLogout() {
  const res = await fetch(`${API_BASE}/admin/auth/logout`, {
    method: "POST",
    headers: getAdminAuthHeaders(),
  });
  return res.json();
}

export async function getAdminProfile() {
  const res = await fetch(`${API_BASE}/admin/auth/profile`, {
    headers: getAdminAuthHeaders(),
  });
  return res.json();
}

export async function setupAdmin(adminData) {
  const res = await fetch(`${API_BASE}/admin/auth/setup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(adminData),
  });
  return res.json();
}

// ===== NOTIFICATION MANAGEMENT APIs =====

export async function fetchNotifications() {
  const res = await fetch(`${API_BASE}/admin/notifications`, {
    headers: getAdminAuthHeaders(),
  });
  return res.json();
}

export async function createNotification(notificationData) {
  const res = await fetch(`${API_BASE}/admin/notifications`, {
    method: "POST",
    headers: getAdminAuthHeaders(),
    body: JSON.stringify(notificationData),
  });
  return res.json();
}

export async function updateNotification(id, notificationData) {
  const res = await fetch(`${API_BASE}/admin/notifications/${id}`, {
    method: "PUT",
    headers: getAdminAuthHeaders(),
    body: JSON.stringify(notificationData),
  });
  return res.json();
}

export async function deleteNotification(id) {
  const res = await fetch(`${API_BASE}/admin/notifications/${id}`, {
    method: "DELETE",
    headers: getAdminAuthHeaders(),
  });
  return res.json();
}

// ===== WEBSITE SETTINGS APIs =====

export async function fetchWebsiteSettings() {
  const res = await fetch(`${API_BASE}/admin/website-settings`, {
    headers: getAdminAuthHeaders(),
  });
  return res.json();
}

export async function updateWebsiteSettings(settingsData) {
  const res = await fetch(`${API_BASE}/admin/website-settings`, {
    method: "PUT",
    headers: getAdminAuthHeaders(),
    body: JSON.stringify(settingsData),
  });
  return res.json();
}

// ===== SYSTEM SETTINGS APIs =====

export async function fetchSystemSettings() {
  const res = await fetch(`${API_BASE}/admin/system-settings`, {
    headers: getAdminAuthHeaders(),
  });
  return res.json();
}

export async function updateSystemSettings(settingsData) {
  const res = await fetch(`${API_BASE}/admin/system-settings`, {
    method: "PUT",
    headers: getAdminAuthHeaders(),
    body: JSON.stringify(settingsData),
  });
  return res.json();
}

// ===== EMAIL SETTINGS APIs =====

export async function fetchEmailSettings() {
  console.log('Fetching email settings from:', `${API_BASE}/admin/email-settings`);
  console.log('Headers:', getAdminAuthHeaders());
  const res = await fetch(`${API_BASE}/admin/email-settings`, {
    headers: getAdminAuthHeaders(),
  });
  console.log('Response status:', res.status);
  const data = await res.json();
  console.log('Response data:', data);
  return data;
}

export async function updateEmailSettings(settingsData) {
  const res = await fetch(`${API_BASE}/admin/email-settings`, {
    method: "PUT",
    headers: getAdminAuthHeaders(),
    body: JSON.stringify(settingsData),
  });
  return res.json();
}

export async function testSMTPConnection(smtpData) {
  const res = await fetch(`${API_BASE}/admin/email-settings/test`, {
    method: "POST",
    headers: getAdminAuthHeaders(),
    body: JSON.stringify({ smtp: smtpData }),
  });
  return res.json();
}

// ===== PUBLIC APIs =====

export async function fetchPublicWebsiteSettings() {
  const res = await fetch(`${API_BASE}/website-settings`);
  return res.json();
}

export async function fetchPublicNotifications() {
  const res = await fetch(`${API_BASE}/notifications`);
  return res.json();
}

// Super Admin APIs
export async function fetchTenants() {
  const res = await fetch(`${API_BASE}/admin/tenants`, {
    headers: getAdminAuthHeaders(),
  });
  return res.json();
}

export async function approveTenant(tenantId) {
  const res = await fetch(`${API_BASE}/admin/tenants/${tenantId}/approve`, {
    method: "POST",
    headers: getAdminAuthHeaders(),
  });
  return res.json();
}

export async function blockTenant(tenantId) {
  const res = await fetch(`${API_BASE}/admin/tenants/${tenantId}/block`, {
    method: "POST",
    headers: getAdminAuthHeaders(),
  });
  return res.json();
}

export async function unblockTenant(tenantId) {
  const res = await fetch(`${API_BASE}/admin/tenants/${tenantId}/unblock`, {
    method: "POST",
    headers: getAdminAuthHeaders(),
  });
  return res.json();
}

export async function fetchPlans() {
  const res = await fetch(`${API_BASE}/admin/plans`, {
    headers: getAdminAuthHeaders(),
  });
  return res.json();
}

export async function fetchPublicPlans() {
  try {
    console.log(`Fetching plans from: ${API_BASE}/plans`);
    const res = await fetch(`${API_BASE}/plans`, {
      headers: { "Content-Type": "application/json" },
    });
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const data = await res.json();
    console.log('Plans response:', data);
    
    // Ensure we always return an array
    if (Array.isArray(data)) {
      return data;
    } else if (data && typeof data === 'object') {
      console.warn('Plans response is not an array:', data);
      return [];
    } else {
      console.warn('Unexpected plans response type:', typeof data, data);
      return [];
    }
  } catch (error) {
    console.error('Error fetching plans:', error);
    
    // Check if it's a network error (backend not reachable)
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.error('Network error - backend may not be running');
      throw new Error('Backend server is not reachable. Please ensure the backend is running.');
    }
    
    return [];
  }
}

export async function createOrUpdatePlan(planData) {
  const res = await fetch(`${API_BASE}/admin/plans`, {
    method: "POST",
    headers: getAdminAuthHeaders(),
    body: JSON.stringify(planData),
  });
  return res.json();
}

export async function fetchPlanRequests() {
  const res = await fetch(`${API_BASE}/admin/plan-requests`, {
    headers: getAdminAuthHeaders(),
  });
  return res.json();
}

export async function approvePlanRequest(tenantId, approve) {
  const res = await fetch(
    `${API_BASE}/admin/tenants/${tenantId}/plan-request`,
    {
      method: "POST",
      headers: getAdminAuthHeaders(),
      body: JSON.stringify({ approve }),
    }
  );
  return res.json();
}

// Tenant-scoped APIs
export async function fetchLeads(tenantId) {
  const res = await fetch(getTenantUrl(tenantId, "leads"), {
    headers: getAuthHeaders(),
  });
  return res.json();
}

export async function updateLead(tenantId, id, lead) {
  const res = await fetch(getTenantUrl(tenantId, `leads/${id}`), {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(lead),
  });
  return res.json();
}

export async function fetchSettings(tenantId) {
  const res = await fetch(getTenantUrl(tenantId, "settings"), {
    headers: getAuthHeaders(),
  });
  return res.json();
}

export async function updateSettings(tenantId, settings) {
  const res = await fetch(getTenantUrl(tenantId, "settings"), {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(settings),
  });
  return res.json();
}

export async function fetchKnowledgebase(tenantId) {
  const res = await fetch(getTenantUrl(tenantId, "knowledgebase"), {
    headers: getAuthHeaders(),
  });
  return res.json();
}

export async function updateKnowledgebase(tenantId, content) {
  const res = await fetch(getTenantUrl(tenantId, "knowledgebase"), {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ content }),
  });
  return res.json();
}

export async function fetchWhatsAppQR(tenantId) {
  const res = await fetch(getTenantUrl(tenantId, "whatsapp/qr"), {
    headers: getAuthHeaders(),
  });
  return res.json();
}

export async function fetchWhatsAppStatus(tenantId) {
  const res = await fetch(getTenantUrl(tenantId, "whatsapp/status"), {
    headers: getAuthHeaders(),
  });
  return res.json();
}

export async function fetchUsage(tenantId) {
  const res = await fetch(getTenantUrl(tenantId, "usage"), {
    headers: getAuthHeaders(),
  });
  return res.json();
}

export async function updateSubscription(tenantId, subscriptionPlan) {
  // This now requests a plan change (requires admin approval)
  const res = await fetch(getTenantUrl(tenantId, "request-plan-change"), {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ planId: subscriptionPlan }),
  });
  return res.json();
}

export async function deleteTenant(tenantId) {
  const res = await fetch(`${API_BASE}/admin/tenants/${tenantId}`, {
    method: "DELETE",
    headers: getAdminAuthHeaders(),
  });
  return res.json();
}

export async function updateSheetsConfig(
  tenantId,
  googleSheetId,
  googleCredentials
) {
  const res = await fetch(getTenantUrl(tenantId, "sheets-config"), {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ googleSheetId, googleCredentials }),
  });
  return res.json();
}

// --- Admin Plan CRUD and Tenant Stats ---
export async function createPlan(plan) {
  const res = await fetch(`${API_BASE}/admin/plans`, {
    method: "POST",
    headers: getAdminAuthHeaders(),
    body: JSON.stringify(plan),
  });
  return res.json();
}
export async function updatePlan(planId, plan) {
  const res = await fetch(`${API_BASE}/admin/plans/${planId}`, {
    method: "PUT",
    headers: getAdminAuthHeaders(),
    body: JSON.stringify(plan),
  });
  return res.json();
}
export async function deletePlan(planId) {
  const res = await fetch(`${API_BASE}/admin/plans/${planId}`, {
    method: "DELETE",
    headers: getAdminAuthHeaders(),
  });
  return res.json();
}
export async function fetchTenantStats(tenantId) {
  const res = await fetch(`${API_BASE}/admin/tenants/${tenantId}/stats`, {
    headers: getAdminAuthHeaders(),
  });
  return res.json();
}

// Legacy APIs (for backward compatibility)
export async function addLead(lead) {
  const res = await fetch(`${API_BASE}/leads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(lead),
  });
  return res.json();
}

export async function deleteLead(id) {
  const res = await fetch(`${API_BASE}/leads/${id}`, { method: "DELETE" });
  return res.json();
}

export async function fetchChatHistory(leadId) {
  const res = await fetch(`${API_BASE}/messages/${leadId}`);
  return res.json();
}

export async function sendMessage(message) {
  const res = await fetch(`${API_BASE}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(message),
  });
  return res.json();
}

export async function fetchAnalytics() {
  // Placeholder: implement real analytics endpoint later
  return {
    totalLeads: 0,
    conversions: 0,
    followUps: 0,
  };
}

export async function resetTenantUsage(tenantId) {
  const res = await fetch(`${API_BASE}/admin/tenants/${tenantId}/reset-usage`, {
    method: "POST",
    headers: getAdminAuthHeaders(),
  });
  return res.json();
}

export async function deduplicateLeads(tenantId) {
  const res = await fetch(`${API_BASE}/admin/deduplicate-leads/${tenantId}`, {
    method: "POST",
    headers: getAdminAuthHeaders(),
  });
  return res.json();
}

// Payment Gateway APIs
export async function fetchPaymentGateways() {
  const res = await fetch(`${API_BASE}/admin/payment-gateways`, {
    headers: getAdminAuthHeaders(),
  });
  return res.json();
}

export async function updatePaymentGateway(gatewayId, config) {
  const res = await fetch(`${API_BASE}/admin/payment-gateways/${gatewayId}`, {
    method: "PUT",
    headers: getAdminAuthHeaders(),
    body: JSON.stringify(config),
  });
  return res.json();
}

export async function togglePaymentGateway(gatewayId, enabled) {
  const res = await fetch(`${API_BASE}/admin/payment-gateways/${gatewayId}/toggle`, {
    method: "POST",
    headers: getAdminAuthHeaders(),
    body: JSON.stringify({ enabled }),
  });
  return res.json();
}

export async function fetchPaymentHistory(filters = {}) {
  const queryParams = new URLSearchParams(filters).toString();
  const res = await fetch(`${API_BASE}/admin/payment-history?${queryParams}`, {
    headers: getAuthHeaders(),
  });
  return res.json();
}

export async function createPaymentIntent(planId, gatewayId) {
  const res = await fetch(`${API_BASE}/admin/payment-intent`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ planId, gatewayId }),
  });
  return res.json();
}

export async function processPayment(paymentData) {
  const res = await fetch(`${API_BASE}/admin/process-payment`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(paymentData),
  });
  return res.json();
}