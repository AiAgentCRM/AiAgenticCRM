const jwt = require("jsonwebtoken");
const Lead = require("../models/Lead");
const Tenant = require("../models/Tenant");
const { cleanPhoneNumber } = require("../utils/phone");

// Lightweight auth: accept either a valid tenant JWT or a shared secret header
async function authorizeWebhook(req, res, next) {
  const authHeader = req.headers["authorization"]; // Bearer <token>
  const sharedSecret = process.env.WEBHOOK_SHARED_SECRET;
  const providedSecret = req.headers["x-webhook-secret"]; // optional shared secret header
  const tenantIdParam = req.params.tenantId;

  // Option C (per request): Allow unauthenticated usage if only tenantId is provided (user requested low restriction)
  // NOTE: This reduces security; keep tenant active/approved check in route handler.
  if (!authHeader && !providedSecret) {
    return next();
  }

  // Option A: Shared secret header (no tenant lookup required)
  if (sharedSecret && providedSecret && sharedSecret === providedSecret) {
    return next();
  }

  // Option B: JWT (must include tenantId matching the URL)
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Missing auth (JWT or X-Webhook-Secret)" });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
    if (!payload || !payload.tenantId || payload.tenantId !== tenantIdParam) {
      return res.status(403).json({ error: "Forbidden: tenant mismatch" });
    }
    return next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

function validateBody(body) {
  const errors = [];
  if (!body || typeof body !== "object") {
    errors.push("Body must be a JSON object");
    return errors;
  }
  if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
    errors.push("'name' is required and must be a non-empty string");
  }
  if (!body.phone || typeof body.phone !== "string" || !body.phone.trim()) {
    errors.push("'phone' is required and must be a non-empty string");
  }
  if (body.status && !["New", "Cold", "Warm", "Hot", "Converted"].includes(body.status)) {
    errors.push("'status' must be one of: New, Cold, Warm, Hot, Converted");
  }
  return errors;
}

module.exports = function attachWebhookRoutes(app, io) {
  // POST /api/:tenantId/webhook/leads  → create/update a lead for a tenant
  app.post("/api/:tenantId/webhook/leads", authorizeWebhook, async (req, res) => {
    try {
      const tenantId = req.params.tenantId;
      const tenant = await Tenant.findOne({ tenantId });
      if (!tenant || !tenant.isActive || !tenant.isApproved) {
        return res.status(403).json({ error: "Tenant not found or not active/approved" });
      }

      const errors = validateBody(req.body);
      if (errors.length > 0) {
        return res.status(400).json({ error: "Validation failed", details: errors });
      }

      const name = String(req.body.name).trim();
      const phone = cleanPhoneNumber(String(req.body.phone).trim());
      const email = req.body.email ? String(req.body.email).trim() : undefined;
      const status = req.body.status || "New";
      const source = req.body.source ? String(req.body.source).trim() : "Webhook";
      const notes = req.body.notes ? String(req.body.notes) : undefined;
      const autoFollowupEnabled = req.body.autoFollowupEnabled === undefined ? undefined : !!req.body.autoFollowupEnabled;

      // Upsert by tenantId + phone
      let lead = await Lead.findOne({ tenantId, phone });
      if (!lead) {
        lead = new Lead({ tenantId, name, phone, email, status, source, timestamp: new Date() });
        if (notes !== undefined) lead.notes = notes;
        if (autoFollowupEnabled !== undefined) lead.autoFollowupEnabled = autoFollowupEnabled;
        await lead.save();
      } else {
        // Update basic fields; preserve Incoming Message source if present
        lead.name = name || lead.name;
        if (email !== undefined) lead.email = email;
        if (status) lead.status = status;
        if (lead.source !== "Incoming Message") {
          lead.source = source || lead.source;
        }
        if (notes !== undefined) lead.notes = notes;
        if (autoFollowupEnabled !== undefined) lead.autoFollowupEnabled = autoFollowupEnabled;
        await lead.save();
      }

      // Real-time notify tenant dashboards
      try { io.to(tenantId).emit("lead-updated", lead); } catch (_) {}

      return res.status(201).json({ message: "Lead created/updated", lead });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  });
};


