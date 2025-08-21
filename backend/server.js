const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
const attachedMessageHandlers = new WeakSet();
const dotenv = require("dotenv");
dotenv.config();
const fs = require("fs");
const path = require("path");
const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const { setTimeout: sleep } = require("timers/promises");
const { google } = require("googleapis");
const axios = require("axios");
const multer = require("multer");
const Settings = require("./models/Settings");
const Lead = require("./models/Lead");
const Knowledgebase = require("./models/Knowledgebase");
const Tenant = require("./models/Tenant");
const Admin = require("./models/Admin");
const Notification = require("./models/Notification");
const WebsiteSettings = require("./models/WebsiteSettings");
const SystemSettings = require("./models/SystemSettings");
const EmailSettings = require("./models/EmailSettings");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const tenantClients = new Map();
// Cache latest QR (as Data URL) per tenant to avoid timing issues where the QR
// was generated before the HTTP request arrived
const tenantLatestQR = new Map();
const SubscriptionPlan = require("./models/SubscriptionPlan");
const { cleanPhoneNumber, toWhatsAppId } = require("./utils/phone");
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// --- Multer Configuration for File Uploads ---
// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp and original extension
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    // Allow common document types
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "application/rtf",
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only documents are allowed."), false);
    }
  }
});

// Add a specific multer instance for the knowledgebase route that handles both file and form data
const knowledgebaseUpload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    console.log("Multer fileFilter called with file:", file);
    if (file) {
      // Allow common document types
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
        "application/rtf",
        "text/csv",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      ];
      
      if (allowedTypes.includes(file.mimetype)) {
        console.log("File type allowed:", file.mimetype);
        cb(null, true);
      } else {
        console.log("File type not allowed:", file.mimetype);
        cb(new Error("Invalid file type. Only documents are allowed."), false);
      }
    } else {
      console.log("No file provided, allowing form data only");
      cb(null, true); // No file, just form data
    }
  }
});

// --- Socket.IO connection logic ---
io.on("connection", (socket) => {
  console.log(`🔌 Main Socket.IO client connected: ${socket.id}`);
  // Join tenant room if tenantId is provided
  socket.on("join-tenant", (tenantId) => {
    if (tenantId) {
      socket.join(tenantId);
      console.log(`🔌 Client ${socket.id} joined tenant room: ${tenantId}`);
    }
  });
  
  socket.on("disconnect", () => {
    console.log(`🔌 Main Socket.IO client disconnected: ${socket.id}`);
  });
});

// --- Enhanced Lead Stage Detection Helper ---
function determineLeadStage(message, phoneNumber, leadStages, currentStage = null) {
  const lowerMessage = message.toLowerCase();
  let detectedStage = null;
  let confidence = 0;
  
  // Use dynamic leadStages if provided, else fallback to default
  const defaultStages = [
    {
      stage: "Initial Contact",
      description: "First contact - gathering basic information",
      keywords: ["hello", "hi", "hey", "interested", "information", "tell me", "what do you do", "help", "support"],
      priority: 1
    },
    {
      stage: "Service Inquiry",
      description: "Asking about specific services and pricing",
      keywords: ["website", "app", "mobile", "cloud", "development", "services", "pricing", "cost", "price", "features", "what can you do", "capabilities"],
      priority: 2
    },
    {
      stage: "Budget Discussion",
      description: "Discussing budget and financial considerations",
      keywords: ["budget", "afford", "expensive", "cheap", "cost-effective", "investment", "roi", "return", "money", "payment", "plan", "package"],
      priority: 3
    },
    {
      stage: "Timeline Inquiry",
      description: "Asking about project timeline and deadlines",
      keywords: ["when", "timeline", "deadline", "urgent", "quick", "fast", "time", "schedule", "how long", "duration", "start", "finish"],
      priority: 4
    },
    {
      stage: "Meeting Request",
      description: "Requesting a meeting or appointment",
      keywords: ["meeting", "appointment", "call", "schedule", "demo", "discussion", "talk", "consultation", "call me", "contact me"],
      priority: 5
    },
    {
      stage: "Ready to Proceed",
      description: "Ready to move forward with the project",
      keywords: ["yes", "okay", "sure", "let's do it", "proceed", "start", "begin", "go ahead", "perfect", "great", "sounds good"],
      priority: 6
    }
  ];
  
  const stagesToUse = Array.isArray(leadStages) && leadStages.length > 0 ? leadStages : defaultStages;
  
  // Enhanced keyword matching with context awareness
  for (const stageInfo of stagesToUse) {
    const keywordMatches = (stageInfo.keywords || []).filter((keyword) =>
      lowerMessage.includes(keyword)
    );
    
    if (keywordMatches.length > 0) {
      // Calculate confidence based on keyword matches and context
      let stageConfidence = keywordMatches.length / (stageInfo.keywords ? stageInfo.keywords.length : 1);
      
      // Boost confidence for stage progression (moving forward in the funnel)
      if (currentStage && stageInfo.priority > getStagePriority(currentStage, stagesToUse)) {
        stageConfidence *= 1.5; // Boost confidence for progression
      }
      
      // Boost confidence for exact matches
      if (keywordMatches.length === stageInfo.keywords.length) {
        stageConfidence *= 1.3;
      }
      
      // Boost confidence for longer, more specific messages
      if (lowerMessage.length > 20) {
        stageConfidence *= 1.2;
      }
      
      if (stageConfidence > confidence) {
        confidence = stageConfidence;
        detectedStage = stageInfo;
      }
    }
  }
  
  // If no stage detected but we have a current stage, maintain it
  if (!detectedStage && currentStage) {
    detectedStage = { stage: currentStage, description: "Maintaining current stage" };
  }
  
  return detectedStage;
}

// Helper function to get stage priority
function getStagePriority(stageName, stages) {
  const stage = stages.find(s => s.stage === stageName);
  return stage ? (stage.priority || 0) : 0;
}

// --- Lead Status Debug Helper ---
function printLeadStatus(phoneNumber, stage, message) {
  const stageStr = stage && stage.stage ? stage.stage : "UNKNOWN";
  console.log(
    `[LEAD STATUS] Phone: ${phoneNumber}, Stage: ${stageStr}, Message: '${message}'`
  );
}

// CORS configuration for production (allow staging subdomains)
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,https://aiagenticcrm.com,https://www.aiagenticcrm.com,https://app.aiagenticcrm.com').split(',');
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith('.aiagenticcrm.com') ||
      origin === 'https://aiagenticcrm.com'
    ) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
// Only parse JSON for specific routes that need it
// app.use(express.json()); // Removed global JSON parsing to avoid conflicts with FormData

// Root route
app.get("/", (req, res) => {
  res.json({
    message: "AiAgenticCRM API is running!",
    version: "1.0.0",
    status: "active",
    timestamp: new Date().toISOString(),
    endpoints: {
      health: "/api/health",
      leads: "/api/leads",
      messages: "/api/messages",
      settings: "/api/settings",
      knowledgebase: "/api/knowledgebase",
      whatsapp: "/api/whatsapp"
    }
  });
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "healthy", 
    timestamp: new Date().toISOString(),
    database: "connected"
  });
});

// Payment Gateway Routes
const paymentGatewayRoutes = require('./routes/payment-gateways');
app.use('/api', paymentGatewayRoutes);

// MongoDB Connection with proper error handling
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || "mongodb://localhost:27017/whatsappautoresponder";
    console.log("🔌 Attempting to connect to MongoDB...");
    console.log("📡 Connection string:", mongoURI.replace(/\/\/[^:]+:[^@]+@/, "//***:***@")); // Hide credentials in logs
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    });
    
    console.log("✅ MongoDB connected successfully!");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    
    if (error.message.includes("IP whitelist")) {
      console.error("\n🔧 SOLUTION: Your IP address is not whitelisted in MongoDB Atlas.");
      console.error("📋 To fix this:");
      console.error("   1. Go to https://cloud.mongodb.com");
      console.error("   2. Navigate to your cluster → Network Access");
      console.error("   3. Click 'Add IP Address'");
      console.error("   4. Add your current IP or use '0.0.0.0/0' for all IPs");
      console.error("   5. Or use 'localhost' for local development");
    } else if (error.message.includes("authentication")) {
      console.error("\n🔧 SOLUTION: Check your MongoDB connection string and credentials.");
      console.error("📋 Make sure your MONGODB_URI is correct in your .env file");
    } else if (error.message.includes("ENOTFOUND")) {
      console.error("\n🔧 SOLUTION: Cannot resolve MongoDB host.");
      console.error("📋 Check your internet connection and MongoDB Atlas cluster status");
    }
    
    console.error("\n💡 For local development, you can:");
    console.error("   1. Install MongoDB locally: https://docs.mongodb.com/manual/installation/");
    console.error("   2. Or use MongoDB Atlas with proper IP whitelisting");
    console.error("   3. Or set MONGODB_URI in your .env file");
    
    process.exit(1); // Exit the process if DB connection fails
  }
};

// Connect to MongoDB with fallback
(async () => {
  try {
    await connectDB();
  } catch (error) {
    console.log("⚠️  MongoDB Atlas connection failed, using local fallback");
    console.log("✅ Server is running on port 5000");
    console.log("🎯 WhatsApp launcher feature is ready to test!");
    console.log("💡 To fix MongoDB: Whitelist your IP in MongoDB Atlas");
  }
})();

// Helper function to add JSON parsing to specific routes
function withJsonParsing(handler) {
  return (req, res, next) => {
    express.json()(req, res, (err) => {
      if (err) return next(err);
      handler(req, res, next);
    });
  };
}

// JWT Auth Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Access token required" });
  jwt.verify(
    token,
    process.env.JWT_SECRET || "your-secret-key",
    (err, user) => {
      if (err) return res.status(403).json({ error: "Invalid token" });
      req.user = user;
      next();
    }
  );
}
// Tenant Middleware
function tenantMiddleware(req, res, next) {
  const tenantId = req.params.tenantId || req.user.tenantId;
  if (!tenantId) return res.status(400).json({ error: "Tenant ID required" });
  req.tenantId = tenantId;
  next();
}

// Admin Authentication Middleware
function authenticateAdmin(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  
  if (!token) {
    return res.status(401).json({ error: "Admin access token required" });
  }
  
  jwt.verify(
    token,
    process.env.JWT_SECRET || "your-secret-key",
    async (err, decoded) => {
      if (err) {
        return res.status(403).json({ error: "Invalid admin token" });
      }
      
      try {
        const admin = await Admin.findById(decoded.adminId);
        if (!admin || !admin.isActive) {
          return res.status(403).json({ error: "Admin account not found or inactive" });
        }
        
        req.admin = admin;
        next();
      } catch (error) {
        return res.status(500).json({ error: "Authentication error" });
      }
    }
  );
}

// Admin Permission Middleware
function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({ error: "Admin authentication required" });
    }
    
    if (req.admin.role === 'super_admin') {
      return next(); // Super admin has all permissions
    }
    
    if (!req.admin.permissions.includes(permission)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    
    next();
  };
}

// Subscription Plan Management (Super Admin)
app.get("/api/admin/plans", authenticateAdmin, requirePermission('manage_plans'), async (req, res) => {
  const plans = await SubscriptionPlan.find({ isActive: true });
  res.json(plans);
});

// Public plans endpoint for registration
app.get("/api/plans", async (req, res) => {
  try {
    console.log("Public plans endpoint called");
    
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      console.error("MongoDB not connected. Connection state:", mongoose.connection.readyState);
      return res.status(500).json({ error: "Database connection not available" });
    }
    
    const plans = await SubscriptionPlan.find({ isActive: true });
    console.log(`Found ${plans.length} active plans:`, plans.map(p => ({ planId: p.planId, planName: p.planName })));
    res.json(plans);
  } catch (error) {
    console.error("Error in public plans endpoint:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/admin/plans", authenticateAdmin, requirePermission('manage_plans'), withJsonParsing(async (req, res) => {
  try {
    const {
      planId,
      planName,
      price,
      initialMessageLimit,
      conversationLimit,
      followupLimit,
      features,
    } = req.body;

    let plan = await SubscriptionPlan.findOne({ planId });
    if (plan) {
      plan.planName = planName;
      plan.price = price;
      plan.initialMessageLimit = initialMessageLimit;
      plan.conversationLimit = conversationLimit;
      plan.followupLimit = followupLimit;
      plan.features = features;
      plan.updatedAt = new Date();
    } else {
      plan = new SubscriptionPlan({
        planId,
        planName,
        price,
        initialMessageLimit,
        conversationLimit,
        followupLimit,
        features,
      });
    }
    await plan.save();
    res.status(201).json(plan);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}));

// Get tenant usage and plan info
app.get(
  "/api/:tenantId/usage",
  authenticateToken,
  tenantMiddleware,
  async (req, res) => {
    try {
      // Always fetch the latest tenant after any updates
      let tenant = await Tenant.findOne({ tenantId: req.tenantId });
      const plan = await SubscriptionPlan.findOne({
        planId: tenant.subscriptionPlan,
      });

      // Reset monthly usage if it's a new month
      const now = new Date();
      const resetDate = new Date(tenant.monthlyUsage.resetDate);
      if (
        now.getMonth() !== resetDate.getMonth() ||
        now.getFullYear() !== resetDate.getFullYear()
      ) {
        tenant.monthlyUsage = {
          initialMessagesSent: 0,
          aiConversations: 0,
          followupMessagesSent: 0,
          resetDate: now,
        };
        await tenant.save();
        // Re-fetch after save to get the latest
        tenant = await Tenant.findOne({ tenantId: req.tenantId });
      }

      res.json({
        tenant: {
          subscriptionPlan: tenant.subscriptionPlan,
          subscriptionStartDate: tenant.subscriptionStartDate,
          subscriptionEndDate: tenant.subscriptionEndDate,
          googleSheetId: tenant.googleSheetId || "",
          pendingPlanRequest: tenant.pendingPlanRequest || null,
        },
        plan: plan,
        usage: tenant.monthlyUsage,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Update tenant subscription plan
app.post(
  "/api/:tenantId/subscription",
  authenticateToken,
  tenantMiddleware,
  withJsonParsing(async (req, res) => {
    try {
      const { subscriptionPlan } = req.body;
      const tenant = await Tenant.findOne({ tenantId: req.tenantId });
      const plan = await SubscriptionPlan.findOne({ planId: subscriptionPlan });

      if (!plan) {
        return res.status(400).json({ error: "Invalid plan selected" });
      }

      tenant.subscriptionPlan = subscriptionPlan;
      tenant.subscriptionStartDate = new Date();
      tenant.subscriptionEndDate = new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      ); // 30 days
      tenant.monthlyUsage = {
        initialMessagesSent: 0,
        aiConversations: 0,
        followupMessagesSent: 0,
        resetDate: new Date(),
      };

      await tenant.save();
      res.json({ message: "Subscription plan updated successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  })
);

// Register new business (pending approval) - Updated with plan selection
app.post("/api/admin/register", withJsonParsing(async (req, res) => {
  try {
    const { businessName, ownerName, email, password, subscriptionPlan } = req.body;
    const existingTenant = await Tenant.findOne({ email });
    if (existingTenant)
      return res.status(400).json({ error: "Business already registered" });
    // Determine default plan: use provided plan only if valid and active; otherwise fallback to free plan
    let planIdToUse = subscriptionPlan;
    let plan = null;
    if (planIdToUse) {
      plan = await SubscriptionPlan.findOne({ planId: planIdToUse, isActive: true });
    }
    if (!plan) {
      plan = await SubscriptionPlan.findOne({ planId: "free", isActive: true });
      planIdToUse = plan ? plan.planId : null;
    }
    if (!planIdToUse) {
      return res.status(500).json({ error: "Default Free plan not configured" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const tenant = new Tenant({
      tenantId: `tenant_${Date.now()}`,
      businessName,
      ownerName,
      email,
      password: hashedPassword,
      subscriptionPlan: planIdToUse,
      subscriptionStartDate: new Date(),
      subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      monthlyUsage: {
        initialMessagesSent: 0,
        aiConversations: 0,
        followupMessagesSent: 0,
        resetDate: new Date(),
      },
    });
    await tenant.save();
    console.log(`[ADMIN] Tenant added: ${tenant.businessName} (${tenant.tenantId})`);
    res.status(201).json({
      message: "Registration successful. Waiting for admin approval.",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}));
// Login for business owner (tenant login)
app.post("/api/admin/login", withJsonParsing(async (req, res) => {
  try {
    const { email, password } = req.body;
    const tenant = await Tenant.findOne({ email });
    if (!tenant) return res.status(400).json({ error: "Invalid credentials" });
    if (!tenant.isApproved)
      return res.status(403).json({ error: "Account not approved yet" });
    if (!tenant.isActive)
      return res.status(403).json({ error: "Account is blocked" });
    const validPassword = await bcrypt.compare(password, tenant.password);
    if (!validPassword)
      return res.status(400).json({ error: "Invalid credentials" });
    const token = jwt.sign(
      { userId: tenant._id, tenantId: tenant.tenantId, email: tenant.email },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "24h" }
    );
    res.json({
      token,
      tenantId: tenant.tenantId,
      businessName: tenant.businessName,
      ownerName: tenant.ownerName,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}));

// Admin Authentication Routes
app.post("/api/admin/auth/login", withJsonParsing(async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Input validation
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }
    
    // Find admin by username or email
    const admin = await Admin.findOne({
      $or: [{ username }, { email: username }]
    });
    
    if (!admin) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
    // Check if account is locked
    if (admin.isLocked()) {
      return res.status(423).json({ 
        error: "Account is temporarily locked due to multiple failed login attempts. Please try again later." 
      });
    }
    
    // Check if account is active
    if (!admin.isActive) {
      return res.status(403).json({ error: "Account is deactivated" });
    }
    
    // Verify password
    const isValidPassword = await admin.comparePassword(password);
    if (!isValidPassword) {
      // Increment login attempts
      await admin.incLoginAttempts();
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
    // Reset login attempts on successful login
    await admin.resetLoginAttempts();
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        adminId: admin._id, 
        username: admin.username, 
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions
      },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "8h" }
    );
    
    res.json({
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions,
        lastLogin: admin.lastLogin
      }
    });
    
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}));

// Admin logout (optional - for server-side session management)
app.post("/api/admin/auth/logout", authenticateAdmin, async (req, res) => {
  try {
    // In a stateless JWT system, logout is typically handled client-side
    // But we can log the logout event for audit purposes
    console.log(`Admin ${req.admin.username} logged out`);
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ error: "Logout error" });
  }
});

// Get current admin profile
app.get("/api/admin/auth/profile", authenticateAdmin, async (req, res) => {
  try {
    res.json({
      admin: {
        id: req.admin._id,
        username: req.admin.username,
        email: req.admin.email,
        role: req.admin.role,
        permissions: req.admin.permissions,
        lastLogin: req.admin.lastLogin,
        createdAt: req.admin.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// Create initial admin account (for first-time setup)
app.post("/api/admin/auth/setup", withJsonParsing(async (req, res) => {
  try {
    // Check if any admin already exists
    const adminCount = await Admin.countDocuments();
    if (adminCount > 0) {
      return res.status(403).json({ error: "Admin setup already completed" });
    }
    
    const { username, email, password } = req.body;
    
    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }
    
    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters long" });
    }
    
    // Create super admin
    const admin = new Admin({
      username,
      email,
      password,
      role: 'super_admin',
      permissions: [
        'manage_tenants',
        'manage_plans', 
        'view_analytics',
        'manage_payments',
        'system_settings',
        'user_management'
      ]
    });
    
    await admin.save();
    
    console.log(`Initial super admin created: ${username}`);
    
    res.status(201).json({ 
      message: "Super admin account created successfully",
      admin: {
        username: admin.username,
        email: admin.email,
        role: admin.role
      }
    });
    
  } catch (error) {
    console.error("Admin setup error:", error);
    res.status(500).json({ error: "Failed to create admin account" });
  }
}));

// ===== NOTIFICATION MANAGEMENT ROUTES =====

// Get all notifications
app.get("/api/admin/notifications", authenticateAdmin, requirePermission('system_settings'), async (req, res) => {
  try {
    const notifications = await Notification.find()
      .populate('createdBy', 'username email')
      .sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new notification
app.post("/api/admin/notifications", authenticateAdmin, requirePermission('system_settings'), withJsonParsing(async (req, res) => {
  try {
    const notificationData = {
      ...req.body,
      createdBy: req.admin._id
    };
    
    const notification = new Notification(notificationData);
    await notification.save();
    
    const populatedNotification = await Notification.findById(notification._id)
      .populate('createdBy', 'username email');
    
    res.status(201).json(populatedNotification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}));

// Update notification
app.put("/api/admin/notifications/:id", authenticateAdmin, requirePermission('system_settings'), withJsonParsing(async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    ).populate('createdBy', 'username email');
    
    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }
    
    res.json(notification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}));

// Delete notification
app.delete("/api/admin/notifications/:id", authenticateAdmin, requirePermission('system_settings'), async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);
    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }
    res.json({ message: "Notification deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== WEBSITE SETTINGS ROUTES =====

// Get website settings
app.get("/api/admin/website-settings", authenticateAdmin, requirePermission('system_settings'), async (req, res) => {
  try {
    let settings = await WebsiteSettings.findOne();
    if (!settings) {
      settings = new WebsiteSettings();
      await settings.save();
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update website settings
app.put("/api/admin/website-settings", authenticateAdmin, requirePermission('system_settings'), withJsonParsing(async (req, res) => {
  try {
    let settings = await WebsiteSettings.findOne();
    if (!settings) {
      settings = new WebsiteSettings();
    }
    
    Object.assign(settings, req.body, {
      updatedBy: req.admin._id,
      updatedAt: new Date()
    });
    
    await settings.save();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}));

// ===== SYSTEM SETTINGS ROUTES =====

// Get system settings
app.get("/api/admin/system-settings", authenticateAdmin, requirePermission('system_settings'), async (req, res) => {
  try {
    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = new SystemSettings();
      await settings.save();
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update system settings
app.put("/api/admin/system-settings", authenticateAdmin, requirePermission('system_settings'), withJsonParsing(async (req, res) => {
  try {
    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = new SystemSettings();
    }
    
    Object.assign(settings, req.body, {
      updatedBy: req.admin._id,
      updatedAt: new Date()
    });
    
    await settings.save();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}));

// ===== EMAIL SETTINGS ROUTES =====

// Test route to check if backend is working
app.get("/api/test", (req, res) => {
  res.json({ message: "Backend is working!" });
});

// Test route to check if socket server is working
app.get("/api/socket-test", (req, res) => {
  res.json({ 
    message: "Socket server is working!", 
    socketPort: SOCKET_PORT,
    socketUrl: `http://localhost:${SOCKET_PORT}`
  });
});

// Get email settings (mask password)
app.get("/api/admin/email-settings", authenticateAdmin, requirePermission('system_settings'), async (req, res) => {
  try {
    console.log('Email settings request received');
    // Select password to compute hasPassword, then remove it
    let settings = await EmailSettings.findOne().select('+smtp.password');
    console.log('Settings found:', !!settings);
    if (!settings) {
      // Return an unsaved document with defaults (do not save to avoid validation before user provides values)
      settings = new EmailSettings();
      console.log('Created new settings object');
    }
    const obj = settings.toObject({ getters: true, virtuals: false });
    if (!obj.smtp) obj.smtp = {};
    obj.smtp.hasPassword = Boolean(obj.smtp && obj.smtp.password);
    delete obj.smtp.password;
    console.log('Sending response:', Object.keys(obj));
    return res.json(obj);
  } catch (error) {
    console.error('Email settings error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Update email settings (preserve password if not provided)
app.put("/api/admin/email-settings", authenticateAdmin, requirePermission('system_settings'), withJsonParsing(async (req, res) => {
  try {
    let settings = await EmailSettings.findOne().select('+smtp.password');
    if (!settings) {
      settings = new EmailSettings();
    }

    const incoming = req.body || {};
    // Merge shallowly while preserving password unless explicitly provided and non-empty
    if (incoming.smtp) {
      const { password, ...restSmtp } = incoming.smtp;
      settings.smtp = settings.smtp || {};
      Object.assign(settings.smtp, restSmtp);
      if (typeof password === 'string' && password.length > 0) {
        settings.smtp.password = password;
      }
    }
    if (incoming.templates) {
      settings.templates = { ...(settings.templates || {}), ...incoming.templates };
    }
    if (incoming.preferences) {
      settings.preferences = { ...(settings.preferences || {}), ...incoming.preferences };
    }
    settings.updatedBy = req.admin._id;
    settings.updatedAt = new Date();

    await settings.save();

    const obj = settings.toObject();
    if (obj.smtp) delete obj.smtp.password;
    return res.json(obj);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}));

// Test SMTP connection
app.post("/api/admin/email-settings/test", authenticateAdmin, requirePermission('system_settings'), withJsonParsing(async (req, res) => {
  try {
    const { smtp } = req.body || {};
    if (!smtp || !smtp.host || !smtp.port || !smtp.username || !smtp.password) {
      return res.status(400).json({ error: 'Missing required SMTP fields' });
    }

    const nodemailer = require('nodemailer');
    const useSecure = Boolean(smtp.secure) || String(smtp.encryption).toLowerCase() === 'ssl';
    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: useSecure,
      auth: { user: smtp.username, pass: smtp.password },
      tls: String(smtp.encryption).toLowerCase() === 'tls' ? { ciphers: 'SSLv3' } : undefined
    });

    await transporter.verify();
    return res.json({ message: 'SMTP test successful' });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'SMTP test failed' });
  }
}));

// ===== PUBLIC ROUTES FOR FRONTEND =====

// Get public website settings (for frontend)
app.get("/api/website-settings", async (req, res) => {
  try {
    let settings = await WebsiteSettings.findOne();
    if (!settings) {
      settings = new WebsiteSettings();
      await settings.save();
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get active notifications for tenants
app.get("/api/notifications", async (req, res) => {
  try {
    const now = new Date();
    const notifications = await Notification.find({
      isActive: true,
      $or: [
        { isGlobal: true },
        { targetAudience: 'all' },
        { targetAudience: 'tenants' }
      ],
      $or: [
        { endDate: { $exists: false } },
        { endDate: { $gt: now } }
      ],
      $or: [
        { startDate: { $exists: false } },
        { startDate: { $lte: now } }
      ]
    }).sort({ priority: -1, createdAt: -1 });
    
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// Super admin: list, approve, block tenants
app.get("/api/admin/tenants", authenticateAdmin, requirePermission('manage_tenants'), async (req, res) => {
  const tenants = await Tenant.find();
  res.json(tenants);
});
app.post("/api/admin/tenants/:tenantId/approve", authenticateAdmin, requirePermission('manage_tenants'), async (req, res) => {
  const tenant = await Tenant.findOne({ tenantId: req.params.tenantId });
  if (!tenant) return res.status(404).json({ error: "Tenant not found" });
  tenant.isApproved = true;
  await tenant.save();
  res.json({ message: "Tenant approved" });
});
app.post("/api/admin/tenants/:tenantId/block", authenticateAdmin, requirePermission('manage_tenants'), async (req, res) => {
  const tenant = await Tenant.findOne({ tenantId: req.params.tenantId });
  if (!tenant) return res.status(404).json({ error: "Tenant not found" });
  tenant.isActive = false;
  await tenant.save();
  res.json({ message: "Tenant blocked" });
});
app.post("/api/admin/tenants/:tenantId/unblock", authenticateAdmin, requirePermission('manage_tenants'), async (req, res) => {
  const tenant = await Tenant.findOne({ tenantId: req.params.tenantId });
  if (!tenant) return res.status(404).json({ error: "Tenant not found" });
  tenant.isActive = true;
  await tenant.save();
  res.json({ message: "Tenant unblocked" });
});
// Robust tenant deletion: destroy WhatsApp client and remove session folder
app.delete("/api/admin/tenants/:tenantId", authenticateAdmin, requirePermission('manage_tenants'), async (req, res) => {
  try {
    const tenantId = req.params.tenantId;
    // Destroy WhatsApp client if exists
    const client = tenantClients.get(tenantId);
    const sessionDir = path.join(__dirname, ".wwebjs_auth", `session-${tenantId}`);
    if (client) {
      try {
        await client.destroy();
        // Wait for browser to fully close (add delay for Puppeteer)
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (e) {
        console.error(`[ADMIN] Error destroying WhatsApp client for tenant ${tenantId}:`, e);
      }
      tenantClients.delete(tenantId);
    }
    // Always try to delete the session folder, even if client was already disconnected
    try {
      if (fs.existsSync(sessionDir)) {
        fs.rmSync(sessionDir, { recursive: true, force: true });
        console.log(`[ADMIN] Session folder deleted for tenant ${tenantId}`);
      }
    } catch (err) {
      console.error(`[ADMIN] Failed to delete session folder for tenant ${tenantId}:`, err);
    }
    // Delete tenant from DB
    await Tenant.deleteOne({ tenantId });
    console.log(`[ADMIN] Tenant deleted: ${tenantId}`);
    res.json({ message: "Tenant and WhatsApp session deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// Tenant-scoped APIs (Leads, Settings, Knowledgebase, WhatsApp QR)
app.get(
  "/api/:tenantId/leads",
  authenticateToken,
  tenantMiddleware,
  async (req, res) => {
    const leads = await Lead.find({ tenantId: req.tenantId }).sort({
      timestamp: -1,
    });
    const settings = await Settings.findOne({ tenantId: req.tenantId });
    console.log(`[${req.tenantId}] Returning leads with stages:`, settings && settings.leadStages ? settings.leadStages.map(s => s.stage) : []);
    res.json(leads);
  }
);
app.put(
  "/api/:tenantId/leads/:id",
  authenticateToken,
  tenantMiddleware,
  withJsonParsing(async (req, res) => {
    const { notes, autoFollowupEnabled, detectedStage } = req.body;
    const lead = await Lead.findOne({
      _id: req.params.id,
      tenantId: req.tenantId,
    });
    if (!lead) return res.status(404).json({ error: "Lead not found" });
    if (notes !== undefined) lead.notes = notes;
    if (autoFollowupEnabled !== undefined)
      lead.autoFollowupEnabled = autoFollowupEnabled;
    if (detectedStage !== undefined) lead.detectedStage = detectedStage;
    await lead.save();
    res.json(lead);
  })
);
// --- Always provide default lead stages in settings API ---
const DEFAULT_LEAD_STAGES = [
  {
    stage: "Initial Contact",
    description: "First contact - gathering basic information",
    keywords: ["hello", "hi", "hey", "interested", "information", "tell me", "what do you do"],
  },
  {
    stage: "Service Inquiry",
    description: "Asking about specific services and pricing",
    keywords: ["website", "app", "mobile", "cloud", "development", "services", "pricing", "cost", "price"],
  },
  {
    stage: "Budget Discussion",
    description: "Discussing budget and financial considerations",
    keywords: ["budget", "afford", "expensive", "cheap", "cost-effective", "investment", "roi", "return"],
  },
  {
    stage: "Timeline Inquiry",
    description: "Asking about project timeline and deadlines",
    keywords: ["when", "timeline", "deadline", "urgent", "quick", "fast", "time", "schedule"],
  },
  {
    stage: "Meeting Request",
    description: "Requesting a meeting or appointment",
    keywords: ["meeting", "appointment", "call", "schedule", "demo", "discussion", "talk"],
  },
];

// Patch settings API to always return default stages if empty (do not mutate DB object)
app.get(
  "/api/:tenantId/settings",
  authenticateToken,
  tenantMiddleware,
  async (req, res) => {
    let settings = await Settings.findOne({ tenantId: req.tenantId });
    if (!settings) settings = new Settings({ tenantId: req.tenantId });
    // Always provide default stages if empty (do not mutate DB)
    const leadStages = settings.leadStages && settings.leadStages.length > 0 ? settings.leadStages : DEFAULT_LEAD_STAGES;
    const autoFollowupForIncoming = settings.autoFollowupForIncoming === undefined ? false : settings.autoFollowupForIncoming;
    res.json(Object.assign({}, settings.toObject(), { leadStages, autoFollowupForIncoming }));
  }
);

// Patch settings POST to allow saving autoFollowupForIncoming
app.post(
  "/api/:tenantId/settings",
  authenticateToken,
  tenantMiddleware,
  withJsonParsing(async (req, res) => {
    let settings = await Settings.findOne({ tenantId: req.tenantId });
    if (!settings) settings = new Settings({ tenantId: req.tenantId });
    const {
      messageTemplate,
      batchSize,
      messageDelay,
      companyProfile,
      systemPrompt,
      followupMessages,
      followupDelays,
      fetchIntervalMinutes,
      globalAutoFollowupEnabled,
      leadStages,
      autoFollowupForIncoming,
    } = req.body;
    if (messageTemplate !== undefined) settings.messageTemplate = messageTemplate;
    if (batchSize !== undefined) settings.batchSize = batchSize;
    if (messageDelay !== undefined) settings.messageDelay = messageDelay;
    if (companyProfile !== undefined) settings.companyProfile = companyProfile;
    if (systemPrompt !== undefined) settings.systemPrompt = systemPrompt;
    if (followupMessages !== undefined) settings.followupMessages = followupMessages;
    if (followupDelays !== undefined) settings.followupDelays = followupDelays;
    if (fetchIntervalMinutes !== undefined) settings.fetchIntervalMinutes = fetchIntervalMinutes;
    if (globalAutoFollowupEnabled !== undefined) settings.globalAutoFollowupEnabled = globalAutoFollowupEnabled;
    if (leadStages !== undefined) settings.leadStages = leadStages;
    if (autoFollowupForIncoming !== undefined) settings.autoFollowupForIncoming = autoFollowupForIncoming;
    await settings.save();
    res.status(201).json(settings);
  }
));
app.get(
  "/api/:tenantId/knowledgebase",
  authenticateToken,
  tenantMiddleware,
  async (req, res) => {
    const kb = await Knowledgebase.findOne({ tenantId: req.tenantId });
    res.json(kb || { organizationName: "", content: "", knowledgeSources: [], uploadDocument: "" });
  }
);
app.post(
  "/api/:tenantId/knowledgebase",
  authenticateToken,
  tenantMiddleware,
  (req, res, next) => {
    knowledgebaseUpload.single("uploadDocument")(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        console.error("Multer error:", err);
        return res.status(400).json({ error: "File upload error: " + err.message });
      } else if (err) {
        console.error("Other error:", err);
        return res.status(400).json({ error: "Upload error: " + err.message });
      }
      next();
    });
  },
  async (req, res) => {
    try {
      // Debug logging
      console.log("Knowledgebase POST request received");
      console.log("req.body:", req.body);
      console.log("req.file:", req.file);
      console.log("req.headers:", req.headers);
      
      // Check if req.body exists and has the required fields
      if (!req.body) {
        console.error("req.body is undefined - multer parsing issue");
        return res.status(400).json({ error: "Form data parsing failed. Please check your request." });
      }
      
      const { organizationName, content, knowledgeSources } = req.body;
      
      if (!organizationName || !content) {
        console.error("Missing required fields:", { organizationName: !!organizationName, content: !!content });
        return res.status(400).json({ error: "Organization name and content are required" });
      }
      
      // Parse knowledgeSources from JSON string if it's a string
      let parsedKnowledgeSources = [];
      if (knowledgeSources) {
        try {
          parsedKnowledgeSources = typeof knowledgeSources === 'string' 
            ? JSON.parse(knowledgeSources) 
            : knowledgeSources;
        } catch (error) {
          console.error("Error parsing knowledgeSources:", error);
          parsedKnowledgeSources = [];
        }
      }
      
      let uploadDocument = "";
      if (req.file) {
        // File was uploaded, store the file path
        uploadDocument = req.file.filename;
      } else if (req.body.uploadDocument) {
        // Text input was provided (fallback for existing functionality)
        uploadDocument = req.body.uploadDocument;
      }
      
      let kb = await Knowledgebase.findOne({ tenantId: req.tenantId });
      if (kb) {
        kb.organizationName = organizationName;
        kb.content = content;
        kb.knowledgeSources = parsedKnowledgeSources;
        kb.uploadDocument = uploadDocument;
        kb.updatedAt = new Date();
      } else {
        kb = new Knowledgebase({ 
          tenantId: req.tenantId, 
          organizationName, 
          content, 
          knowledgeSources: parsedKnowledgeSources,
          uploadDocument: uploadDocument
        });
      }
      await kb.save();
      res.status(201).json(kb);
    } catch (error) {
      console.error("Error saving knowledgebase:", error);
      res.status(500).json({ error: "Failed to save knowledgebase" });
    }
  }
);

// Serve uploaded files
app.get("/uploads/:filename", (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(uploadsDir, filename);
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "File not found" });
  }
  
  // Send file
  res.sendFile(filePath);
});

app.get(
  "/api/:tenantId/whatsapp/qr",
  authenticateToken,
  tenantMiddleware,
  async (req, res) => {
    try {
      const tenantId = req.tenantId;
      let client = tenantClients.get(tenantId);
      const sessionDir = path.join(
        __dirname,
        ".wwebjs_auth",
        `session-${tenantId}`
      );
      // If client does not exist, create and initialize it
      if (!client) {
        client = new Client({
          authStrategy: new LocalAuth({ clientId: tenantId }),
          puppeteer: {
            headless: true,
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
            args: [
              "--no-sandbox",
              "--disable-setuid-sandbox",
              "--disable-dev-shm-usage",
              "--disable-gpu"
            ],
          },
        });
        // Attach all event handlers for this tenant only
        client.on("ready", async () => {
          const tenant = await Tenant.findOne({ tenantId });
          if (tenant) {
            tenant.whatsappReady = true;
            await tenant.save();
          }
          // Emit WhatsApp ready event to frontend via socket.io
          socketIo.to(tenantId).emit("whatsapp-ready", { tenantId });
        });
        client.on("disconnected", async () => {
          const tenant = await Tenant.findOne({ tenantId });
          if (tenant) {
            tenant.whatsappReady = false;
            await tenant.save();
          }
          tenantClients.delete(tenantId);
        });
        client.on("auth_failure", async () => {
          const tenant = await Tenant.findOne({ tenantId });
          if (tenant) {
            tenant.whatsappReady = false;
            await tenant.save();
          }
          tenantClients.delete(tenantId);
        });
        client.on("message", async (message) => {
          await handleIncomingMessage(message, tenantId);
        });
        tenantClients.set(tenantId, client);
        client.initialize();
      }
      // If client is ready, return already connected
      if (client.info) {
        return res.json({ status: "ready", message: "WhatsApp is already connected" });
      }
      // Otherwise, wait for QR or timeout
      let responded = false;
        const qrHandler = (qr) => {
          if (responded) return;
          responded = true;
          require("qrcode").toDataURL(qr, (err, dataUrl) => {
            if (!err) {
              // Emit QR code to frontend via socket.io
              socketIo.to(tenantId).emit("whatsapp-qr", { tenantId, qr: dataUrl });
              // Cache the latest QR for this tenant for a short period
              tenantLatestQR.set(tenantId, { qr: dataUrl, ts: Date.now() });
              res.json({ status: "qr", qr: dataUrl, message: "Scan this QR code with WhatsApp" });
            } else {
              res.status(500).json({ error: "Failed to generate QR code" });
            }
          });
          client.off("qr", qrHandler);
        };
        client.on("qr", qrHandler);
      // If a recent QR was cached in the last 25 seconds, return it immediately
        const cached = tenantLatestQR.get(tenantId);
        if (cached && Date.now() - cached.ts < 25000 && !responded) {
          responded = true;
          return res.json({ status: "qr", qr: cached.qr, message: "Scan this QR code with WhatsApp" });
        }
      // Timeout for QR
        setTimeout(() => {
          if (!responded && !res.headersSent) {
            responded = true;
            res.status(408).json({ error: "QR code generation timeout" });
            client.off("qr", qrHandler);
          }
        }, 30000);
    } catch (error) {
      if (!res.headersSent) res.status(500).json({ error: error.message });
    }
  }
);
// Update Google Sheets config for tenant
app.post(
  "/api/:tenantId/sheets-config",
  authenticateToken,
  tenantMiddleware,
  withJsonParsing(async (req, res) => {
    try {
      const { googleSheetId, googleCredentials } = req.body;
      const tenant = await Tenant.findOne({ tenantId: req.tenantId });
      if (!tenant) return res.status(404).json({ error: "Tenant not found" });
      if (googleSheetId) tenant.googleSheetId = googleSheetId;
      if (googleCredentials) tenant.googleCredentials = googleCredentials;
      await tenant.save();
      res.json({ message: "Google Sheets configuration updated successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  })
);
// Tenant requests plan change
app.post(
  "/api/:tenantId/request-plan-change",
  authenticateToken,
  tenantMiddleware,
  withJsonParsing(async (req, res) => {
    try {
      const { planId } = req.body;
      const tenant = await Tenant.findOne({ tenantId: req.tenantId });
      if (!tenant) return res.status(404).json({ error: "Tenant not found" });
      if (tenant.subscriptionPlan === planId)
        return res.status(400).json({ error: "Already on this plan" });
      tenant.pendingPlanRequest = {
        planId,
        requestedAt: new Date(),
        status: "pending",
      };
      await tenant.save();
      res.json({
        message: "Plan change request submitted. Awaiting admin approval.",
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  })
);


  // List all plans (duplicate removed - using the one above that filters for isActive: true)

  // Create a new plan (duplicate removed - using the one above)

  // Edit a plan
  app.put("/api/admin/plans/:planId", authenticateAdmin, requirePermission('manage_plans'), withJsonParsing(async (req, res) => {
    try {
      const { planName, price, initialMessageLimit, conversationLimit, followupLimit, features } = req.body;
      const plan = await SubscriptionPlan.findOne({ planId: req.params.planId });
      if (!plan) return res.status(404).json({ error: "Plan not found" });
      if (planName !== undefined) plan.planName = planName;
      if (price !== undefined) plan.price = price;
      if (initialMessageLimit !== undefined) plan.initialMessageLimit = initialMessageLimit;
      if (conversationLimit !== undefined) plan.conversationLimit = conversationLimit;
      if (followupLimit !== undefined) plan.followupLimit = followupLimit;
      if (features !== undefined) plan.features = features;
      plan.updatedAt = new Date();
      await plan.save();
      res.json(plan);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }));

  // Delete a plan
  app.delete("/api/admin/plans/:planId", authenticateAdmin, requirePermission('manage_plans'), async (req, res) => {
    try {
      await SubscriptionPlan.deleteOne({ planId: req.params.planId });
      res.json({ message: "Plan deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // List all tenants (duplicate removed - using the one above that filters for isActive: true)

  // Get stats for a tenant
  app.get("/api/admin/tenants/:tenantId/stats", authenticateAdmin, requirePermission('view_analytics'), async (req, res) => {
    try {
      const tenant = await Tenant.findOne({ tenantId: req.params.tenantId });
      if (!tenant) return res.status(404).json({ error: "Tenant not found" });
      const plan = await SubscriptionPlan.findOne({ planId: tenant.subscriptionPlan });
      const leadCount = await Lead.countDocuments({ tenantId: tenant.tenantId });
      res.json({
        tenant,
        plan,
        leadCount,
        usage: tenant.monthlyUsage,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
// Admin approves/rejects plan change
app.post("/api/admin/tenants/:tenantId/plan-request", authenticateAdmin, requirePermission('manage_plans'), withJsonParsing(async (req, res) => {
  try {
    const { approve } = req.body;
    const tenant = await Tenant.findOne({ tenantId: req.params.tenantId });
    if (
      !tenant ||
      !tenant.pendingPlanRequest ||
      tenant.pendingPlanRequest.status !== "pending"
    ) {
      return res.status(400).json({ error: "No pending plan request" });
    }
    if (approve) {
      tenant.subscriptionPlan = tenant.pendingPlanRequest.planId;
      tenant.subscriptionStartDate = new Date();
      tenant.subscriptionEndDate = new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      );
      tenant.pendingPlanRequest = null;
    } else {
      tenant.pendingPlanRequest.status = "rejected";
    }
    await tenant.save();
    res.json({
      message: approve ? "Plan change approved" : "Plan change rejected",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}));
// Update /api/:tenantId/usage to show pendingPlanRequest
app.get(
  "/api/:tenantId/usage",
  authenticateToken,
  tenantMiddleware,
  async (req, res) => {
    try {
      const tenant = await Tenant.findOne({ tenantId: req.tenantId });
      const plan = await SubscriptionPlan.findOne({
        planId: tenant.subscriptionPlan,
      });
      // Reset monthly usage if it's a new month
      const now = new Date();
      const resetDate = new Date(tenant.monthlyUsage.resetDate);
      if (
        now.getMonth() !== resetDate.getMonth() ||
        now.getFullYear() !== resetDate.getFullYear()
      ) {
        tenant.monthlyUsage = {
          initialMessagesSent: 0,
          aiConversations: 0,
          followupMessagesSent: 0,
          resetDate: now,
        };
        await tenant.save();
      }
      res.json({
        tenant: {
          subscriptionPlan: tenant.subscriptionPlan,
          subscriptionStartDate: tenant.subscriptionStartDate,
          subscriptionEndDate: tenant.subscriptionEndDate,
          googleSheetId: tenant.googleSheetId || "",
          pendingPlanRequest: tenant.pendingPlanRequest || null,
        },
        plan: plan,
        usage: tenant.monthlyUsage,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);
// Admin fetches all pending plan change requests
app.get("/api/admin/plan-requests", authenticateAdmin, requirePermission('manage_plans'), async (req, res) => {
  try {
    const tenants = await Tenant.find({
      "pendingPlanRequest.status": "pending",
    });
    res.json(
      tenants.map((t) => ({
        tenantId: t.tenantId,
        businessName: t.businessName,
        ownerName: t.ownerName,
        email: t.email,
        currentPlan: t.subscriptionPlan,
        requestedPlan: t.pendingPlanRequest?.planId,
        requestedAt: t.pendingPlanRequest?.requestedAt,
      }))
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// Admin resets tenant usage
app.post("/api/admin/tenants/:tenantId/reset-usage", authenticateAdmin, requirePermission('manage_tenants'), async (req, res) => {
  try {
    const tenant = await Tenant.findOne({ tenantId: req.params.tenantId });
    if (!tenant) return res.status(404).json({ error: "Tenant not found" });
    tenant.monthlyUsage = {
      initialMessagesSent: 0,
      aiConversations: 0,
      followupMessagesSent: 0,
      resetDate: new Date(),
    };
    await tenant.save();
    // Also reset all leads for this tenant
    const result = await Lead.updateMany(
      { tenantId: req.params.tenantId },
      {
        $set: {
          initialMessageSent: false,
          initialMessageTimestamp: null,
          followupStatuses: [{}, {}, {}],
          lastRespondedAt: null,
        },
      }
    );
    console.log(`[ADMIN] Reset usage for tenant ${req.params.tenantId}, leads updated: ${result.modifiedCount}`);
    res.json({ message: `Tenant usage and ${result.modifiedCount} leads reset successfully`, usage: tenant.monthlyUsage });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// WhatsApp, Google Sheets, AI core logic (per tenant, unchanged core)
// --- Phone number formatting helpers ---
// Always returns a string in international format WITHOUT leading '+'
// function cleanPhoneNumber(phone) {
//   let num = String(phone).replace(/\D/g, "");
//   // If 10 digits, assume Indian number and add '91'
//   if (num.length === 10) {
//     num = "91" + num;
//   }
//   // If already starts with country code (e.g., 91), leave as is
//   // If too short/long, return as is (let WhatsApp handle or log error)
//   return num;
// }

// function toWhatsAppId(phone) {
//   // No plus, just digits + '@c.us'
//   return cleanPhoneNumber(phone) + "@c.us";
// }
async function fetchLeadsAndSend(tenantId) {
  const tenant = await Tenant.findOne({ tenantId });
  if (!tenant || !tenant.isActive) return;

  const plan = await SubscriptionPlan.findOne({
    planId: tenant.subscriptionPlan,
  });
  if (!plan) return;

  // Check if monthly usage needs reset
  const now = new Date();
  const resetDate = new Date(tenant.monthlyUsage.resetDate);
  if (
    now.getMonth() !== resetDate.getMonth() ||
    now.getFullYear() !== resetDate.getFullYear()
  ) {
    tenant.monthlyUsage = {
      initialMessagesSent: 0,
      aiConversations: 0,
      followupMessagesSent: 0,
      resetDate: now,
    };
    await tenant.save();
  }

  // Check if initial message limit reached
  if (tenant.monthlyUsage.initialMessagesSent >= plan.initialMessageLimit) {
    console.log(
      `[${tenantId}] Initial message limit reached (${plan.initialMessageLimit})`
    );
    return;
  }

  const settings = await Settings.findOne({ tenantId });
  const MESSAGE_TEMPLATE =
    settings?.messageTemplate ||
    "Hi {name}, Thanks for filling the form. We will contact you soon.";
  const BATCH_SIZE = Math.min(
    settings?.batchSize || 1,
    plan.initialMessageLimit - tenant.monthlyUsage.initialMessagesSent
  );
  const MESSAGE_DELAY_MS = settings?.messageDelay || 3000;
  const SHEET_ID = tenant.googleSheetId;
  if (!SHEET_ID) return;

  const CREDENTIALS_PATH = path.join(__dirname, "google-credentials.json");
  const SHEET_RANGE = "Sheet1!A2:F";

  try {
    // Use tenant's credentials if present
    const credentials = tenant.googleCredentials
      ? tenant.googleCredentials
      : JSON.parse(fs.readFileSync(CREDENTIALS_PATH, "utf-8"));
    const auth = new google.auth.JWT(
      credentials.client_email,
      null,
      credentials.private_key,
      ["https://www.googleapis.com/auth/spreadsheets.readonly"]
    );
    await auth.authorize();
    const sheets = google.sheets({ version: "v4", auth });
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: SHEET_RANGE,
    });
    const rows = res.data.values || [];
    for (const row of rows) {
      const [name, phone, email, status, source, timestamp] = row;
      if (!phone) continue;
      const normalizedPhone = cleanPhoneNumber(phone);
      let existingLead = await Lead.findOne({ tenantId, phone: normalizedPhone });
      if (existingLead && existingLead.source === 'Incoming Message') {
        // Only update non-source, non-lastRespondedAt fields
        await Lead.updateOne(
          { tenantId, phone: normalizedPhone },
          {
            $set: {
              name,
              email,
              status,
              timestamp: timestamp ? new Date(timestamp) : new Date(),
            },
          }
        );
      } else {
        await Lead.findOneAndUpdate(
          { tenantId, phone: normalizedPhone },
          {
            $set: {
              tenantId,
              name,
              phone: normalizedPhone,
              email,
              status,
              source,
              timestamp: timestamp ? new Date(timestamp) : new Date(),
            },
          },
          { upsert: true, new: true }
        );
      }
    }
  } catch (err) {
    return;
  }

  const client = tenantClients.get(tenantId);
  if (!client || !client.info) return;

  const leads = await Lead.find({
    tenantId,
    initialMessageSent: false,
    source: { $ne: "Incoming Message" },
    lastRespondedAt: null
  })
    .sort({ timestamp: -1 })
    .limit(BATCH_SIZE);

  for (const lead of leads) {
    // Check limit before sending
    if (tenant.monthlyUsage.initialMessagesSent >= plan.initialMessageLimit)
      break;

    const phone = cleanPhoneNumber(lead.phone || "");
    const waId = toWhatsAppId(phone);
    const message = MESSAGE_TEMPLATE.replace("{name}", lead.name || "there");

    try {
      await client.sendMessage(waId, message);
      lead.initialMessageSent = true;
      lead.initialMessageTimestamp = new Date();
      await lead.save();

      // Update usage
      tenant.monthlyUsage.initialMessagesSent += 1;
      await tenant.save();
      console.log(
        `[${tenantId}] Sent initial message to ${
          lead.phone
        } at ${lead.initialMessageTimestamp.toISOString()}`
      );
      console.log(
        `[${tenantId}] Initial messages remaining: ${
          plan.initialMessageLimit - tenant.monthlyUsage.initialMessagesSent
        }/${plan.initialMessageLimit}`
      );
    } catch (err) {}
    await new Promise((res) => setTimeout(res, MESSAGE_DELAY_MS));
  }
}
async function handleIncomingMessage(message, tenantId) {
  const tenant = await Tenant.findOne({ tenantId });
  if (!tenant || !tenant.isActive) return;

  const plan = await SubscriptionPlan.findOne({
    planId: tenant.subscriptionPlan,
  });
  if (!plan) return;

  // Check conversation limit
  if (tenant.monthlyUsage.aiConversations >= plan.conversationLimit) {
    console.log(
      `[${tenantId}] AI conversation limit reached (${plan.conversationLimit})`
    );
    return;
  }

  // Fetch tenant-specific settings and knowledgebase
  let settings = null;
  let knowledgebase = null;
  try {
    settings = await Settings.findOne({ tenantId });
    knowledgebase = await Knowledgebase.findOne({ tenantId });
  } catch (e) {
    console.error(`[${tenantId}] Error fetching settings/knowledgebase for AI reply:`, e.message);
    return;
  }

  if (!knowledgebase?.content) {
    console.log(`[${tenantId}] No knowledgebase content found. Cannot provide AI reply.`);
    return;
  }

  try {
    const aiReply = await getGroqReply(
      message.from,
      message.body,
      knowledgebase.content,
      settings?.systemPrompt
    );
    if (aiReply) {
      const client = tenantClients.get(tenantId);
      await client.sendMessage(message.from, aiReply);

      // Update conversation usage
      tenant.monthlyUsage.aiConversations += 1;
      await tenant.save();
      console.log(
        `[${tenantId}] Sent AI reply to ${
          message.from
        } at ${new Date().toISOString()}`
      );
      console.log(
        `[${tenantId}] AI conversations remaining: ${
          plan.conversationLimit - tenant.monthlyUsage.aiConversations
        }/${plan.conversationLimit}`
      );
    }
  } catch (error) {
    console.error(`[${tenantId}] Error in AI reply:`, error.message);
  }
  // Update lastRespondedAt for the lead
  try {
    const normalizedFrom = cleanPhoneNumber(message.from.replace(/@c\.us$/, ""));
    const lead = await Lead.findOne({ tenantId, phone: normalizedFrom });
    if (lead) {
      lead.lastRespondedAt = new Date();
      await lead.save();
    }
  } catch (err) {
    console.error("Error updating lastRespondedAt for lead:", err.message);
  }
}
async function getGroqReply(userId, message, memory, systemPrompt) {
  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama3-8b-8192",
        messages: [
          {
            role: "system",
            content:
              systemPrompt ||
              `You are a helpful customer service representative. Use this knowledge base to answer questions: ${memory}`,
          },
          { role: "user", content: message },
        ],
        temperature: 0.7,
        max_tokens: 1024,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data.choices[0].message.content;
  } catch (error) {
    return null;
  }
}

// --- Enhanced Follow-up Scheduling Logic ---
const followupTimeouts = {};
async function scheduleAutoFollowups(tenantId) {
  const tenant = await Tenant.findOne({ tenantId });
  if (!tenant || !tenant.isActive) {
    console.log(`[${tenantId}] Tenant not found or not active. Skipping auto followup.`);
    return;
  }
  
  const settings = await Settings.findOne({ tenantId });
  if (!settings) {
    console.log(`[${tenantId}] No settings found. Skipping auto followup.`);
    return;
  }
  
  // Always provide autoFollowupForIncoming (default false)
  const autoFollowupForIncoming = settings.autoFollowupForIncoming === undefined ? false : settings.autoFollowupForIncoming;
  const plan = await SubscriptionPlan.findOne({ planId: tenant.subscriptionPlan });
  if (!plan) {
    console.log(`[${tenantId}] No plan found. Skipping auto followup.`);
    return;
  }
  
  const followupMessages = settings.followupMessages || ["", "", ""];
  const followupDelays = settings.followupDelays || [86400000, 172800000, 259200000]; // 24h, 48h, 72h
  const followupLimit = plan.followupLimit || 3;

  console.log(`[${tenantId}] 🔄 Starting follow-up scheduling...`);
  console.log(`[${tenantId}] 📝 Follow-up templates:`, followupMessages.map((msg, i) => `#${i+1}: "${msg.substring(0, 30)}${msg.length > 30 ? '...' : ''}"`));
  console.log(`[${tenantId}] ⏰ Follow-up delays:`, followupDelays.map((delay, i) => `#${i+1}: ${Math.round(delay/3600000)}h`));
  console.log(`[${tenantId}] 🎯 Plan follow-up limit:`, followupLimit);
  console.log(`[${tenantId}] 🔄 Auto followup for incoming:`, autoFollowupForIncoming);

  // --- LOGGING FIX: Only log a single warning if not enough templates ---
  if (followupMessages.length < followupLimit) {
    console.log(`[${tenantId}] ⚠️ WARNING: Only ${followupMessages.length} follow-up templates provided, but plan allows ${followupLimit}. Will only send up to ${followupMessages.length} follow-ups.`);
  }

  // --- LOGGING FIX: Only log once per run for each blank template index ---
  const blankTemplateLogged = {};

  const globalAutoFollowupEnabled = !!settings.globalAutoFollowupEnabled;
  const client = tenantClients.get(tenantId);
  if (!client || !client.info) {
    console.log(`[${tenantId}] ❌ WhatsApp client not ready. Skipping auto followup.`);
    return;
  }
  
  // First, get all leads that have initial messages sent
  const allLeads = await Lead.find({ 
    tenantId, 
    initialMessageSent: true
  }).sort({ timestamp: -1 });

  // Filter leads that haven't responded after initial message
  const leads = allLeads.filter(lead => {
    try {
      // If no lastRespondedAt, they're eligible
      if (!lead.lastRespondedAt) return true;
      
      // Ensure lastRespondedAt is a valid date
      if (!(lead.lastRespondedAt instanceof Date) || isNaN(lead.lastRespondedAt.getTime())) {
        console.log(`[${tenantId}] ⚠️ Invalid lastRespondedAt for lead ${lead.phone}:`, lead.lastRespondedAt);
        return true; // Consider them eligible if we can't determine
      }
      
      // If they have initialMessageTimestamp, check if they responded after it
      if (lead.initialMessageTimestamp && lead.initialMessageTimestamp instanceof Date && !isNaN(lead.initialMessageTimestamp.getTime())) {
        return lead.lastRespondedAt < lead.initialMessageTimestamp;
      }
      
      // If no initialMessageTimestamp, use timestamp as fallback
      if (lead.timestamp && lead.timestamp instanceof Date && !isNaN(lead.timestamp.getTime())) {
        return lead.lastRespondedAt < lead.timestamp;
      }
      
      // If we can't determine, consider them eligible
      console.log(`[${tenantId}] ⚠️ Unable to determine timing for lead ${lead.phone}, considering eligible`);
      return true;
    } catch (error) {
      console.error(`[${tenantId}] ❌ Error filtering lead ${lead.phone}:`, error);
      return true; // Consider them eligible if there's an error
    }
  });

  console.log(`[${tenantId}] 📊 Found ${leads.length} leads eligible for follow-ups`);

  // Only attempt up to the number of templates or followupLimit, whichever is smaller
  const actualFollowupCount = Math.min(followupMessages.length, followupLimit);

  for (const lead of leads) {
    try {
      console.log(`[${tenantId}] 🔍 Processing lead ${lead.phone} for follow-ups...`);
      
      // ABSOLUTE: Never send follow-ups if user has responded after initial message
      if (lead.lastRespondedAt && lead.initialMessageTimestamp && lead.lastRespondedAt > lead.initialMessageTimestamp) {
        console.log(`[${tenantId}] ⏭️ ABSOLUTE: Skipping ALL follow-ups for ${lead.phone} (lead responded after initial message)`);
        continue;
      }
    
      // Skip follow-up if lead has responded after last sent follow-up or initial message
      let lastSent = lead.initialMessageTimestamp || lead.timestamp;
      if (lead.followupStatuses) {
        for (const status of lead.followupStatuses) {
          if (status.sent && status.timestamp && status.timestamp > lastSent) {
            lastSent = status.timestamp;
          }
        }
      }
      if (lead.lastRespondedAt && lead.lastRespondedAt > lastSent) {
        console.log(`[${tenantId}] ⏭️ Skipping follow-up for ${lead.phone} (lead has responded after last message)`);
        continue;
      }
      
      // --- NEW: Skip followups for incoming leads if disabled ---
      if (lead.source === "Incoming Message" && !autoFollowupForIncoming) {
        console.log(`[${tenantId}] ⏭️ Skipping follow-ups for incoming message lead ${lead.phone} (autoFollowupForIncoming is disabled)`);
        continue;
      }
      
      // Debug eligibility
      console.log(`[${tenantId}] 🔍 Lead ${lead.phone}: autoFollowupEnabled=${lead.autoFollowupEnabled}, globalAutoFollowupEnabled=${globalAutoFollowupEnabled}`);
      if (!(lead.autoFollowupEnabled || globalAutoFollowupEnabled)) {
        console.log(`[${tenantId}] ⏭️ Skipping lead ${lead.phone} because follow-up is not enabled`);
        continue;
      }
      
      // Ensure followupStatuses is an array of correct length
      if (!Array.isArray(lead.followupStatuses)) {
        lead.followupStatuses = Array(followupLimit).fill({});
      } else if (lead.followupStatuses.length < followupLimit) {
        while (lead.followupStatuses.length < followupLimit) lead.followupStatuses.push({});
      } else if (lead.followupStatuses.length > followupLimit) {
        lead.followupStatuses = lead.followupStatuses.slice(0, followupLimit);
      }
      
      const sentCount = lead.followupStatuses.filter((f) => f && f.sent).length;
      const remaining = followupLimit - sentCount;
      console.log(`[${tenantId}] 📊 Lead ${lead.phone}: Follow-ups sent: ${sentCount}, Remaining: ${remaining}/${followupLimit}`);
      
      for (let i = 0; i < actualFollowupCount; i++) {
        const template = followupMessages[i];
        if (!template || template.trim() === "") {
          if (!blankTemplateLogged[i]) {
            console.log(`[${tenantId}] ⚠️ Follow-up #${i + 1} template is blank, skipping for all leads.`);
            blankTemplateLogged[i] = true;
          }
          continue;
        }
        
        if (lead.followupStatuses[i] && lead.followupStatuses[i].sent) {
          console.log(`[${tenantId}] ⏭️ Follow-up #${i + 1} already sent for ${lead.phone}, skipping.`);
          continue;
        }
        
        // Calculate when the follow-up should be sent
        let baseTime = lead.initialMessageTimestamp;
        if (
          i > 0 &&
          lead.followupStatuses[i - 1] &&
          lead.followupStatuses[i - 1].sent &&
          lead.followupStatuses[i - 1].timestamp
        ) {
          baseTime = lead.followupStatuses[i - 1].timestamp;
        }
        
        // Validate baseTime
        if (!baseTime || !(baseTime instanceof Date) || isNaN(baseTime.getTime())) {
          console.log(`[${tenantId}] ⚠️ Invalid baseTime for follow-up #${i + 1} for ${lead.phone}:`, baseTime);
          continue;
        }
        
        // Validate followup delay
        const delay = followupDelays[i] || 0;
        if (typeof delay !== 'number' || isNaN(delay) || delay < 0) {
          console.log(`[${tenantId}] ⚠️ Invalid followup delay for #${i + 1}:`, delay);
          continue;
        }
        
        const dueTime = new Date(baseTime.getTime() + delay);
        const now = new Date();
        
        // Add detailed debugging
        console.log(`[${tenantId}] ⏰ Lead ${lead.phone} - Follow-up #${i + 1}:`);
        console.log(`   📅 Initial message sent at: ${lead.initialMessageTimestamp ? lead.initialMessageTimestamp.toISOString() : 'N/A'}`);
        console.log(`   📅 Base time for this followup: ${baseTime.toISOString()}`);
        console.log(`   ⏱️ Followup delay: ${Math.round((followupDelays[i] || 0)/3600000)}h`);
        console.log(`   🎯 Due time: ${dueTime.toISOString()}`);
        console.log(`   🕐 Current time: ${now.toISOString()}`);
        console.log(`   ✅ Eligible: ${lead.autoFollowupEnabled || globalAutoFollowupEnabled}`);
        
        if (now < dueTime) {
          console.log(`[${tenantId}] ⏳ Follow-up #${i + 1} for ${lead.phone} not due yet. Due at: ${dueTime.toISOString()}, now: ${now.toISOString()}`);
          continue;
        }
        
        const waId = toWhatsAppId(lead.phone);
        
        // --- Debug WhatsApp client state ---
        if (client.info) {
          console.log(`[${tenantId}] ✅ WhatsApp client state: READY, my number: ${client.info.wid._serialized}`);
        } else {
          console.log(`[${tenantId}] ❌ WhatsApp client state: NOT READY`);
        }
        
        // --- Prevent sending to self ---
        if (client.info && waId === client.info.wid._serialized) {
          console.log(`[${tenantId}] ⏭️ Skipping sending follow-up to self (${waId})`);
          continue;
        }
        
        const msgContent = template.replace("{name}", lead.name || "there");
        
        if (now >= dueTime) {
          // Send follow-up now
          try {
            console.log(`[${tenantId}] 🚀 Attempting to send follow-up #${i + 1} to ${lead.phone} (waId: ${waId})`);
            console.log(`[${tenantId}] 📝 Message content: "${msgContent}"`);
            
            const sentMsg = await client.sendMessage(waId, msgContent);
            console.log(`[${tenantId}] ✅ WhatsApp sendMessage result:`, sentMsg);
            
            // Ensure followupStatuses array exists and has enough elements
            if (!Array.isArray(lead.followupStatuses)) {
              lead.followupStatuses = [];
            }
            while (lead.followupStatuses.length <= i) {
              lead.followupStatuses.push({});
            }
            
            lead.followupStatuses[i] = {
              sent: true,
              timestamp: new Date(),
              failed: false,
              error: undefined,
            };
            
            try {
              await lead.save();
            } catch (saveError) {
              console.error(`[${tenantId}] ❌ Failed to save lead after sending follow-up #${i + 1}:`, saveError);
              // Continue with the process even if save fails
            }
            
            // Increment followup usage
            try {
              if (!tenant.monthlyUsage) {
                tenant.monthlyUsage = {};
              }
              tenant.monthlyUsage.followupMessagesSent = (tenant.monthlyUsage.followupMessagesSent || 0) + 1;
              await tenant.save();
            } catch (usageError) {
              console.error(`[${tenantId}] ❌ Failed to update tenant usage after follow-up #${i + 1}:`, usageError);
              // Continue with the process even if usage update fails
            }
            
            console.log(`[${tenantId}] ✅ Sent follow-up #${i + 1} to ${lead.phone} at ${lead.followupStatuses[i].timestamp.toISOString()}`);
            
            // Emit follow-up sent event to frontend
            try {
              if (io && tenantId) {
                io.to(tenantId).emit('followup-sent', {
                  leadId: lead._id,
                  phone: lead.phone,
                  followupNumber: i + 1,
                  message: msgContent,
                  timestamp: lead.followupStatuses[i].timestamp
                });
                console.log(`🔌 Follow-up sent event emitted for lead ${lead.phone}`);
              }
            } catch (socketError) {
              console.error(`[${tenantId}] ❌ Failed to emit follow-up sent event:`, socketError);
              // Continue with the process even if socket emission fails
            }
            
          } catch (err) {
            // Ensure followupStatuses array exists and has enough elements
            if (!Array.isArray(lead.followupStatuses)) {
              lead.followupStatuses = [];
            }
            while (lead.followupStatuses.length <= i) {
              lead.followupStatuses.push({});
            }
            
            lead.followupStatuses[i] = {
              sent: false,
              timestamp: new Date(),
              failed: true,
              error: err.message,
            };
            
            try {
              await lead.save();
            } catch (saveError) {
              console.error(`[${tenantId}] ❌ Failed to save lead after follow-up failure #${i + 1}:`, saveError);
              // Continue with the process even if save fails
            }
            
            console.error(`[${tenantId}] ❌ Failed to send follow-up #${i + 1} to ${lead.phone} (waId: ${waId}):`, err.message);
            
            // Emit follow-up failed event to frontend
            try {
              if (io && tenantId) {
                io.to(tenantId).emit('followup-failed', {
                  leadId: lead._id,
                  phone: lead.phone,
                  followupNumber: i + 1,
                  error: err.message,
                  timestamp: new Date()
                });
                console.log(`🔌 Follow-up failed event emitted for lead ${lead.phone}`);
              }
            } catch (socketError) {
              console.error(`[${tenantId}] ❌ Failed to emit follow-up failed event:`, socketError);
              // Continue with the process even if socket emission fails
            }
          }
        }
      }
    } catch (leadError) {
      console.error(`[${tenantId}] ❌ Error processing lead ${lead.phone} for follow-ups:`, leadError);
      // Continue with the next lead even if this one fails
      continue;
    }
  }
  
  console.log(`[${tenantId}] ✅ Follow-up scheduling completed for ${leads.length} leads`);
}

// --- Per-tenant fetch interval scheduler ---
const lastFetchTimes = {};
setInterval(async () => {
  const tenants = await Tenant.find({ isActive: true, isApproved: true });
  const now = Date.now();
  for (const tenant of tenants) {
    const settings = await Settings.findOne({ tenantId: tenant.tenantId });
    let intervalMin = 3;
    if (
      settings &&
      settings.fetchIntervalMinutes !== undefined &&
      settings.fetchIntervalMinutes !== null
    ) {
      intervalMin = parseFloat(settings.fetchIntervalMinutes);
      if (isNaN(intervalMin) || intervalMin <= 0) intervalMin = 3;
    }
    const intervalMs = Math.max(1, intervalMin) * 60 * 1000;
    if (
      !lastFetchTimes[tenant.tenantId] ||
      now - lastFetchTimes[tenant.tenantId] >= intervalMs
    ) {
      console.log(
        `[${tenant.tenantId}] Running fetchLeadsAndSend and scheduleAutoFollowups (interval: ${intervalMs} ms)`
      );
      await fetchLeadsAndSend(tenant.tenantId);
      await scheduleAutoFollowups(tenant.tenantId);
      lastFetchTimes[tenant.tenantId] = now;
    } else {
      console.log(
        `[${tenant.tenantId}] Skipping fetch, next run in ${
          (intervalMs - (now - lastFetchTimes[tenant.tenantId])) / 1000
        }s`
      );
    }
  }
}, 60 * 1000); // Check every minute

// WhatsApp status endpoint for robust frontend polling
app.get("/api/:tenantId/whatsapp/status", authenticateToken, tenantMiddleware, async (req, res) => {
  const tenant = await Tenant.findOne({ tenantId: req.tenantId });
  res.json({ status: tenant && tenant.whatsappReady ? "ready" : "not_ready" });
});

// --- WhatsApp Multi-Tenant Initialization ---
(async function initializeAllTenantWhatsAppClients() {
  try {
    const tenants = await Tenant.find({ isActive: true });
    for (const tenant of tenants) {
      if (!tenantClients.has(tenant.tenantId)) {
        const client = new Client({
          authStrategy: new LocalAuth({ clientId: tenant.tenantId }),
          puppeteer: {
            headless: true,
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
            args: [
              "--no-sandbox",
              "--disable-setuid-sandbox",
              "--disable-dev-shm-usage",
              "--disable-gpu"
            ],
          },
        });
        // Robust session cleanup with retry
        async function robustClearSession(sessionDir, retries = 5) {
          for (let i = 0; i < retries; i++) {
            try {
              if (fs.existsSync(sessionDir)) {
                fs.rmSync(sessionDir, { recursive: true, force: true });
                return true;
              }
              return true;
            } catch (err) {
              if (err.code === "EBUSY" && i < retries - 1) {
                await sleep(500);
                continue;
              } else {
                console.error(`[${tenant.tenantId}] Failed to delete WhatsApp session folder:`, err);
                return false;
              }
            }
          }
          return false;
        }
        const sessionDir = path.join(__dirname, ".wwebjs_auth", `session-${tenant.tenantId}`);
        client.on("ready", async () => {
          // Fetch WhatsApp number from client.info
          let waNumber = "UNKNOWN";
          if (client.info && client.info.wid && client.info.wid.user) {
            waNumber = client.info.wid.user;
          }
          const t = await Tenant.findOne({ tenantId: tenant.tenantId });
          const name = t ? t.businessName : tenant.tenantId;
          console.log(`TENANT ${name} WITH NUMBER ${waNumber} IS READY`);
          if (t) {
            t.whatsappReady = true;
            await t.save();
            // Emit WhatsApp ready event to frontend via socket.io
            socketIo.to(tenant.tenantId).emit("whatsapp-ready", { tenantId: tenant.tenantId });
          } else {
            console.log(`[READY EVENT] Tenant ${tenant.tenantId} not found (may have been deleted), skipping whatsappReady update.`);
          }
        });
        client.on("disconnected", async () => {
          console.log(`[${tenant.tenantId}] WhatsApp client disconnected.`);
          const t = await Tenant.findOne({ tenantId: tenant.tenantId });
          if (t) {
            t.whatsappReady = false;
            await t.save();
          } else {
            console.log(`[DISCONNECTED EVENT] Tenant ${tenant.tenantId} not found (may have been deleted), skipping whatsappReady update.`);
          }
          tenantClients.delete(tenant.tenantId);
          await robustClearSession(sessionDir);
        });
        client.on("auth_failure", async () => {
          console.log(`[${tenant.tenantId}] WhatsApp client auth failure.`);
          const t = await Tenant.findOne({ tenantId: tenant.tenantId });
          if (t) {
            t.whatsappReady = false;
            await t.save();
          } else {
            console.log(`[AUTH_FAILURE EVENT] Tenant ${tenant.tenantId} not found (may have been deleted), skipping whatsappReady update.`);
          }
          tenantClients.delete(tenant.tenantId);
          await robustClearSession(sessionDir);
        });
        // QR re-emission logic: convert to data URL, cache, and emit over socket
        let lastQR = null;
        let lastQRDataUrl = null;
        let qrInterval = null;
        client.on("qr", (qr) => {
          lastQR = qr;
          qrcode.generate(qr, { small: true });
          console.log(`[${tenant.tenantId}] Scan the QR code above with your WhatsApp mobile app.`);
          require("qrcode").toDataURL(qr, (err, dataUrl) => {
            if (!err) {
              lastQRDataUrl = dataUrl;
              tenantLatestQR.set(tenant.tenantId, { qr: dataUrl, ts: Date.now() });
              socketIo.to(tenant.tenantId).emit("whatsapp-qr", { tenantId: tenant.tenantId, qr: dataUrl });
            }
          });
          if (qrInterval) clearInterval(qrInterval);
          qrInterval = setInterval(() => {
            if (lastQRDataUrl) {
              socketIo.to(tenant.tenantId).emit("whatsapp-qr", { tenantId: tenant.tenantId, qr: lastQRDataUrl });
              tenantLatestQR.set(tenant.tenantId, { qr: lastQRDataUrl, ts: Date.now() });
              console.log(`[${tenant.tenantId}] (Re-emitting QR for scan)`);
            }
          }, 30000); // 30 seconds
        });
        client.on("ready", () => {
          if (qrInterval) clearInterval(qrInterval);
          lastQR = null;
          lastQRDataUrl = null;
        });
        // Attach message handler for incoming messages
        // --- Ensure WhatsApp client message handler is attached only once per client ---
        if (!attachedMessageHandlers.has(client)) {
          client.on("message", async (msg) => {
            console.log(`[DEBUG] WhatsApp message handler running for client ${client.info ? client.info.wid._serialized : "unknown"}, msg id: ${msg.id ? msg.id._serialized : "unknown"}`);
            if (msg.isStatus || msg.isGroupMsg) return;
            // --- Normalize phone number from msg.from ---
            let incomingPhone = cleanPhoneNumber(msg.from.replace(/@c\.us$/, ""));
            // --- Always find by tenantId and normalized phone ---
            let tenantId = null;
            let tenant = null;
            const contact = await msg.getContact(); // the sender’s contact

            // The name the user set in their WhatsApp profile is contact.pushname.
            // Fallback to your saved name/short name/number if missing.
            const displayName =
              contact.pushname ||
              contact.name ||
              contact.shortName ||
              (await contact.getFormattedNumber());
            // Try to find tenant by WhatsApp client (reverse lookup)
            for (const [tid, clientInstance] of tenantClients.entries()) {
              if (clientInstance === client) {
                tenantId = tid;
                break;
              }
            }
            if (!tenantId) {
              console.log(`[INCOMING] Message from ${msg.from}: '${msg.body}' - Could not determine tenant for this message, ignoring.`);
              return;
            }
            tenant = await Tenant.findOne({ tenantId });
            if (!tenant) {
              console.log(`[INCOMING] Message from ${msg.from}: '${msg.body}' - Tenant not found, ignoring.`);
              return;
            }
            let lead = await Lead.findOne({ tenantId, phone: incomingPhone });
            let isNewLeadFromIncoming = false;
            console.log(`[INCOMING] Looking for existing lead: tenantId=${tenantId}, phone=${incomingPhone}`);
            console.log(`[INCOMING] Existing lead found:`, lead ? `Yes (ID: ${lead._id})` : 'No');
            
            if (lead) {
              // Update source if needed
              if (lead.source !== "Incoming Message") {
                lead.source = "Incoming Message";
              }
              // Always update lastRespondedAt
              lead.lastRespondedAt = new Date();
              console.log(`[INCOMING] Updated existing lead: ${lead._id}`);
            } else {
              // Create new lead with minimal info, source as 'Incoming Message'
              lead = new Lead({
                tenantId,
                name: displayName,
                phone: incomingPhone,
                status: "New",
                source: "Incoming Message",
                timestamp: new Date(),
                lastRespondedAt: new Date(),
              });
              isNewLeadFromIncoming = true;
              console.log(`[INCOMING] Auto-created new lead for tenantId=${tenantId}, phone='${lead.phone}' from incoming message.`);
            }
            // Fetch plan details
            const plan = await SubscriptionPlan.findOne({ planId: tenant.subscriptionPlan });
            // Log all details
            console.log(`[INCOMING] Message for tenantId=${tenantId}, phone=${msg.from} (normalized: '${incomingPhone}')`);
            console.log(`  Message body: '${msg.body}'`);
            console.log(`  Tenant: { businessName: '${tenant.businessName}', isActive: ${tenant.isActive}, isApproved: ${tenant.isApproved}, subscriptionPlan: '${tenant.subscriptionPlan}' }`);
            if (plan) {
              console.log(`  Plan: { planId: '${plan.planId}', planName: '${plan.planName}', isActive: ${plan.isActive}, initialMessageLimit: ${plan.initialMessageLimit}, conversationLimit: ${plan.conversationLimit}, followupLimit: ${plan.followupLimit}, features: ${JSON.stringify(plan.features)} }`);
            } else {
              console.log(`  Plan: NOT FOUND for planId='${tenant.subscriptionPlan}'`);
            }
            if (!tenant.isActive || !tenant.isApproved) {
              console.log(`[INCOMING] Skipping AI/lead logic: tenant isActive=${tenant.isActive}, isApproved=${tenant.isApproved}`);
              return;
            }
            if (!plan || !plan.isActive) {
              console.log(`[INCOMING] Skipping AI/lead logic: plan is missing or not active.`);
              return;
            }
            // --- Ensure only the correct tenant's client responds ---
            const clientForTenant = tenantClients.get(tenantId);
            if (!clientForTenant || clientForTenant !== client) {
              console.log(`[INCOMING] Skipping: This client does not belong to tenantId=${tenantId}`);
              return;
            }
            // Continue with AI/lead logic
            console.log(`[INCOMING] Proceeding with AI/lead logic for tenantId=${tenantId}`);
            let leadStages = [];
            let knowledgebase = null;
            let settings = null;
            try {
              settings = await Settings.findOne({ tenantId });
              if (settings && Array.isArray(settings.leadStages)) {
                leadStages = settings.leadStages;
              }
              knowledgebase = await Knowledgebase.findOne({ tenantId });
              console.log(`[${tenantId}] Using knowledgebase:`, knowledgebase ? knowledgebase.content.slice(0, 60) + '...' : 'NONE');
            } catch (e) {
              console.error(`[${tenantId}] Error fetching settings/knowledgebase:`, e.message);
            }
            // Determine lead stage
            const leadStage = determineLeadStage(msg.body, msg.from, leadStages, lead.detectedStage);
            console.log(`[${tenantId}] Detected stage for ${msg.from}:`, leadStage ? leadStage.stage : "UNKNOWN");
            console.log(`[${tenantId}] Previous stage was:`, lead.detectedStage || "None");
            printLeadStatus(msg.from, leadStage, msg.body);
            
            // Update the detectedStage for the corresponding lead in the database
            try {
              if (lead && leadStage && leadStage.stage) {
                const previousStage = lead.detectedStage;
                lead.detectedStage = leadStage.stage;
                
                // Log stage progression
                if (previousStage && previousStage !== leadStage.stage) {
                  console.log(`[${tenantId}] 🎯 Lead ${lead.phone} progressed from "${previousStage}" to "${leadStage.stage}"`);
                } else if (!previousStage) {
                  console.log(`[${tenantId}] 🎯 Lead ${lead.phone} assigned initial stage: "${leadStage.stage}"`);
                }
              }
              
              // For new or updated leads, save after setting detectedStage and lastRespondedAt
              if (lead) {
                console.log(`[${tenantId}] Saving lead to database:`, lead._id);
                await lead.save();
                console.log(`[${tenantId}] Lead saved successfully:`, lead._id);
                
                // Emit real-time update to frontend for this tenant
                if (io && tenantId) {
                  console.log(`🔌 Emitting lead-updated event to tenant ${tenantId} for lead:`, lead._id);
                  io.to(tenantId).emit('lead-updated', lead);
                  console.log(`🔌 Lead update emitted successfully`);
                  
                  // Also emit a stage-change event for better frontend handling
                  if (lead.detectedStage) {
                    io.to(tenantId).emit('lead-stage-changed', {
                      leadId: lead._id,
                      phone: lead.phone,
                      oldStage: previousStage,
                      newStage: lead.detectedStage,
                      message: msg.body,
                      timestamp: new Date()
                    });
                    console.log(`🔌 Stage change event emitted: ${previousStage || 'None'} → ${lead.detectedStage}`);
                  }
                } else {
                  console.log(`🔌 Cannot emit lead update: io=${!!io}, tenantId=${tenantId}`);
                }
              }
            } catch (err) {
              console.error(`[${tenantId}] Error updating detectedStage for lead:`, err.message);
            }
            // Use the correct knowledgebase for AI reply (send only ONCE)
            try {
              if (knowledgebase && knowledgebase.content) {
                const aiReply = await getGroqReply(
                  msg.from,
                  msg.body,
                  knowledgebase.content,
                  settings?.systemPrompt
                );
                if (aiReply) {
                  await client.sendMessage(msg.from, aiReply);
                  console.log(
                    `[${tenantId}] Sent AI reply to ${msg.from} at ${new Date().toISOString()}`
                  );
                }
              }
            } catch (err) {
              console.error(`[${tenantId}] Error in AI reply:`, err.message);
            }
            // Do not send any other reply or initial message here
            // await handleIncomingMessage(msg, tenantId); // REMOVED
          });
          attachedMessageHandlers.add(client);
        }
        tenantClients.set(tenant.tenantId, client);
        client.initialize();
      } else {
        // Do NOT re-attach handler or re-initialize if client already exists
        console.log(`[${tenant.tenantId}] WhatsApp client already exists, skipping re-initialization and handler attachment.`);
      }
    }
  } catch (err) {
    console.error("Error initializing WhatsApp clients for tenants:", err.message);
  }
})();

// Admin endpoint to deduplicate leads for a tenant
app.post("/api/admin/deduplicate-leads/:tenantId", authenticateAdmin, requirePermission('manage_tenants'), async (req, res) => {
  try {
    const tenantId = req.params.tenantId;
    const leads = await Lead.find({ tenantId });
    const seen = new Map();
    let deduped = 0;
    for (const lead of leads) {
      const key = lead.phone;
      if (!seen.has(key)) {
        seen.set(key, lead);
      } else {
        const existing = seen.get(key);
        // Keep the one with the most recent lastRespondedAt or initialMessageTimestamp
        const leadTime = lead.lastRespondedAt || lead.initialMessageTimestamp || lead.timestamp;
        const existingTime = existing.lastRespondedAt || existing.initialMessageTimestamp || existing.timestamp;
        if (leadTime > existingTime) {
          // Merge fields: keep 'Incoming Message' source if either has it
          if (lead.source === 'Incoming Message' || existing.source === 'Incoming Message') {
            lead.source = 'Incoming Message';
          }
          await existing.deleteOne();
          seen.set(key, lead);
          deduped++;
        } else {
          if (lead.source === 'Incoming Message' || existing.source === 'Incoming Message') {
            existing.source = 'Incoming Message';
            await existing.save();
          }
          await lead.deleteOne();
          deduped++;
        }
      }
    }
    res.json({ message: `Deduplicated ${deduped} leads for tenant ${tenantId}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
const SOCKET_PORT = process.env.SOCKET_PORT || 5050;
const HOST = process.env.HOST || '0.0.0.0';

// Create a separate HTTP server for Socket.IO
const socketServer = http.createServer();
const socketIo = new Server(socketServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Socket.IO connection logic for the separate server
socketIo.on("connection", (socket) => {
  console.log("Socket.IO client connected");
  // Join tenant room if tenantId is provided
  socket.on("join-tenant", (tenantId) => {
    if (tenantId) {
      socket.join(tenantId);
      console.log(`🔌 Client ${socket.id} joined tenant room: ${tenantId}`);
    }
  });
  
  socket.on("disconnect", () => {
    console.log(`🔌 Main Socket.IO client disconnected: ${socket.id}`);
  });
});

// Set the socketIo instance in WhatsApp service
const whatsappService = require('./services/whatsapp');
whatsappService.setSocketIO(socketIo);

// Set the socketIo instance in Google Sheets service
const googleSheetsService = require('./services/googleSheets/syncLeads');
googleSheetsService.setSocketIO(socketIo);

// Start the main API server
server.listen(PORT, HOST, () => {
  console.log(`🚀 Multi-tenant WhatsApp Autoresponder running on ${HOST}:${PORT}`);
  console.log(`🌐 Production URL: https://api.aiagenticcrm.com`);
});

// Start the Socket.IO server
socketServer.listen(SOCKET_PORT, HOST, () => {
  console.log(`🔌 Socket.IO server running on ${HOST}:${SOCKET_PORT}`);
});

// --- Global error handlers to prevent server crash ---
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception thrown:', err);
});

// Test endpoint to manually create a lead and test socket emission
app.post("/api/test/create-lead/:tenantId", withJsonParsing(async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { phone, name = "Test User", message = "hi" } = req.body;
    
    if (!phone) {
      return res.status(400).json({ error: "Phone number is required" });
    }
    
    // Check if tenant exists
    const tenant = await Tenant.findOne({ tenantId });
    if (!tenant) {
      return res.status(404).json({ error: "Tenant not found" });
    }
    
    // Check if lead already exists
    let lead = await Lead.findOne({ tenantId, phone });
    if (!lead) {
      // Create new lead
      lead = new Lead({
        tenantId,
        name,
        phone,
        status: "New",
        source: "Test API",
        timestamp: new Date(),
        lastRespondedAt: new Date(),
      });
    } else {
      // Update existing lead
      lead.lastRespondedAt = new Date();
    }
    
    // Determine lead stage
    const leadStage = determineLeadStage(message, phone, []);
    if (leadStage && leadStage.stage) {
      lead.detectedStage = leadStage.stage;
    }
    
    // Save lead
    await lead.save();
    console.log(`[TEST] Created/updated lead:`, lead._id);
    
    // Emit socket event
    if (io && tenantId) {
      console.log(`[TEST] Emitting lead-updated event to tenant ${tenantId}`);
      io.to(tenantId).emit('lead-updated', lead);
      console.log(`[TEST] Lead update emitted successfully`);
    }
    
    res.json({ 
      success: true, 
      lead, 
      socketEmitted: !!(io && tenantId),
      message: "Lead created/updated and socket event emitted"
    });
    
  } catch (error) {
    console.error("[TEST] Error creating test lead:", error);
    res.status(500).json({ error: error.message });
  }
}));

// Test endpoint to manually trigger follow-ups
app.post("/api/:tenantId/test-followups", authenticateToken, tenantMiddleware, withJsonParsing(async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { leadId } = req.body;
    
    console.log(`[TEST] Testing follow-ups for tenant ${tenantId}, lead ${leadId}`);
    
    // Manually trigger follow-up scheduling
    await scheduleAutoFollowups(tenantId);
    
    res.json({ 
      success: true, 
      message: "Follow-up scheduling triggered successfully",
      timestamp: new Date()
    });
    
  } catch (error) {
    console.error("[TEST] Error testing follow-ups:", error);
    res.status(500).json({ error: error.message });
  }
}));



