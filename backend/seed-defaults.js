/**
 * Seed default Admin and User tenants for AiAgenticCRM
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const Tenant = require('./models/Tenant');
const Settings = require('./models/Settings');
const Knowledgebase = require('./models/Knowledgebase');

const MONGODB_URI = process.env.MONGODB_URI ||
  'mongodb+srv://aiagenticcrm:TechDB%40%232025@cluster0.d2sgkdm.mongodb.net/aiagentcrm?retryWrites=true&w=majority&appName=Cluster0';

async function upsertTenant({ tenantId, businessName, ownerName, email, password, subscriptionPlan }) {
  const existing = await Tenant.findOne({ email });
  if (existing) return existing;
  const hashed = await bcrypt.hash(password, 10);
  const tenant = new Tenant({
    tenantId,
    businessName,
    ownerName,
    email,
    password: hashed,
    isActive: true,
    isApproved: true,
    subscriptionPlan: subscriptionPlan || 'silver',
    subscriptionStartDate: new Date(),
  });
  await tenant.save();
  return tenant;
}

async function ensureSettings(tenantId) {
  const s = await Settings.findOne({ tenantId });
  if (s) return s;
  const defaults = new Settings({
    tenantId,
    messageTemplate: 'Hi {name}, thanks for reaching out to AiAgenticCRM!',
    batchSize: 1,
    messageDelay: 3000,
    globalAutoFollowupEnabled: false,
  });
  await defaults.save();
  return defaults;
}

async function ensureKnowledgebase(tenantId) {
  const kb = await Knowledgebase.findOne({ tenantId });
  if (kb) return kb;
  const created = new Knowledgebase({
    tenantId,
    content: 'Welcome to AiAgenticCRM. We help automate WhatsApp lead capture and AI responses.'
  });
  await created.save();
  return created;
}

async function run() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('✅ Connected');

    // Default Super Admin (uses Tenant model for login endpoints)
    const adminTenant = await upsertTenant({
      tenantId: 'tenant_admin',
      businessName: 'AiAgenticCRM Admin',
      ownerName: 'Super Admin',
      email: 'admin@aiagenticcrm.local',
      password: 'Admin@123',
      subscriptionPlan: 'platinum',
    });
    await ensureSettings(adminTenant.tenantId);
    await ensureKnowledgebase(adminTenant.tenantId);

    // Default Demo User Tenant
    const userTenant = await upsertTenant({
      tenantId: 'tenant_demo',
      businessName: 'Demo Company',
      ownerName: 'Demo User',
      email: 'user@aiagenticcrm.local',
      password: 'User@123',
      subscriptionPlan: 'silver',
    });
    await ensureSettings(userTenant.tenantId);
    await ensureKnowledgebase(userTenant.tenantId);

    console.log('\n🎉 Seed complete');
    console.log('Admin login -> email: admin@aiagenticcrm.local  password: Admin@123');
    console.log('User  login -> email: user@aiagenticcrm.local   password: User@123');
  } catch (e) {
    console.error('❌ Seed failed:', e.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Connection closed');
  }
}

if (require.main === module) run();

module.exports = run;


