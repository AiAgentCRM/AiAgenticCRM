/**
 * AiAgenticCRM Database Initialization Script
 * Creates all necessary collections for the application
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import all models to ensure collections are created with proper schemas
const Tenant = require('./models/Tenant');
const Lead = require('./models/Lead');
const Settings = require('./models/Settings');
const Knowledgebase = require('./models/Knowledgebase');
const Message = require('./models/Message');
const Reminder = require('./models/Reminder');
const SubscriptionPlan = require('./models/SubscriptionPlan');

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://aiagenticcrm:TechDB@#2025@cluster0.d2sgkdm.mongodb.net/aiagentcrm?retryWrites=true&w=majority&appName=Cluster0";

async function initializeDatabase() {
  try {
    console.log('🚀 Starting AiAgenticCRM Database Initialization...');
    
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB Atlas successfully!');

    // Get database instance
    const db = mongoose.connection.db;
    const dbName = db.databaseName;
    console.log(`📂 Working with database: ${dbName}`);

    // Collections to create
    const collections = [
      {
        name: 'tenants',
        model: Tenant,
        description: 'Tenant/Business accounts with subscription plans'
      },
      {
        name: 'leads',
        model: Lead,
        description: 'Lead management and tracking'
      },
      {
        name: 'settings',
        model: Settings,
        description: 'Tenant-specific configuration settings'
      },
      {
        name: 'knowledgebases',
        model: Knowledgebase,
        description: 'AI knowledge base content for each tenant'
      },
      {
        name: 'messages',
        model: Message,
        description: 'WhatsApp message history and tracking'
      },
      {
        name: 'reminders',
        model: Reminder,
        description: 'Follow-up reminders and scheduling'
      },
      {
        name: 'subscriptionplans',
        model: SubscriptionPlan,
        description: 'Available subscription plans and pricing'
      }
    ];

    console.log('\n📋 Creating collections...');

    // Get existing collections
    const existingCollections = await db.listCollections().toArray();
    const existingNames = existingCollections.map(col => col.name);

    for (const collection of collections) {
      try {
        if (existingNames.includes(collection.name)) {
          console.log(`✓ Collection '${collection.name}' already exists`);
        } else {
          // Create collection by inserting and removing a dummy document
          const tempDoc = new collection.model({});
          await tempDoc.save();
          await collection.model.deleteOne({ _id: tempDoc._id });
          console.log(`✅ Created collection '${collection.name}' - ${collection.description}`);
        }
      } catch (error) {
        console.log(`⚠️  Collection '${collection.name}' creation: ${error.message}`);
      }
    }

    // Create default subscription plans
    console.log('\n💼 Creating default subscription plans...');
    
    const defaultPlans = [
      {
        planId: 'silver',
        planName: 'Silver Plan',
        price: 29.99,
        initialMessageLimit: 1000,
        conversationLimit: 500,
        followupLimit: 3,
        features: ['Basic AI Responses', 'Lead Tracking', 'WhatsApp Integration'],
        isActive: true
      },
      {
        planId: 'gold',
        planName: 'Gold Plan',
        price: 59.99,
        initialMessageLimit: 2500,
        conversationLimit: 1500,
        followupLimit: 5,
        features: ['Advanced AI Responses', 'Lead Tracking', 'WhatsApp Integration', 'Analytics Dashboard', 'Custom Branding'],
        isActive: true
      },
      {
        planId: 'platinum',
        planName: 'Platinum Plan',
        price: 99.99,
        initialMessageLimit: 5000,
        conversationLimit: 3000,
        followupLimit: 10,
        features: ['Premium AI Responses', 'Lead Tracking', 'WhatsApp Integration', 'Advanced Analytics', 'Custom Branding', 'Priority Support', 'API Access'],
        isActive: true
      }
    ];

    for (const plan of defaultPlans) {
      try {
        const existingPlan = await SubscriptionPlan.findOne({ planId: plan.planId });
        if (!existingPlan) {
          await SubscriptionPlan.create(plan);
          console.log(`✅ Created subscription plan: ${plan.planName}`);
        } else {
          console.log(`✓ Subscription plan '${plan.planName}' already exists`);
        }
      } catch (error) {
        console.log(`⚠️  Error creating plan ${plan.planName}: ${error.message}`);
      }
    }

    // Create indexes for better performance
    console.log('\n📊 Creating database indexes...');
    
    try {
      await Tenant.collection.createIndex({ email: 1 }, { unique: true });
      await Tenant.collection.createIndex({ tenantId: 1 }, { unique: true });
      console.log('✅ Created indexes for tenants collection');
    } catch (error) {
      console.log(`⚠️  Tenant indexes: ${error.message}`);
    }

    try {
      await Lead.collection.createIndex({ tenantId: 1, phone: 1 }, { unique: true });
      await Lead.collection.createIndex({ tenantId: 1, timestamp: -1 });
      console.log('✅ Created indexes for leads collection');
    } catch (error) {
      console.log(`⚠️  Lead indexes: ${error.message}`);
    }

    try {
      await Settings.collection.createIndex({ tenantId: 1 }, { unique: true });
      console.log('✅ Created indexes for settings collection');
    } catch (error) {
      console.log(`⚠️  Settings indexes: ${error.message}`);
    }

    try {
      await Knowledgebase.collection.createIndex({ tenantId: 1 }, { unique: true });
      console.log('✅ Created indexes for knowledgebases collection');
    } catch (error) {
      console.log(`⚠️  Knowledgebase indexes: ${error.message}`);
    }

    // Display collection statistics
    console.log('\n📈 Database Statistics:');
    const stats = await db.stats();
    console.log(`Database: ${stats.db}`);
    console.log(`Collections: ${stats.collections}`);
    console.log(`Documents: ${stats.objects}`);
    console.log(`Storage Size: ${(stats.storageSize / 1024 / 1024).toFixed(2)} MB`);

    console.log('\n🎉 Database initialization completed successfully!');
    console.log('\n📋 Collections created:');
    for (const collection of collections) {
      console.log(`   ✓ ${collection.name} - ${collection.description}`);
    }

    console.log('\n💼 Subscription Plans:');
    for (const plan of defaultPlans) {
      console.log(`   ✓ ${plan.planName} - $${plan.price}/month`);
    }

    console.log('\n🚀 AiAgenticCRM database is ready for use!');

  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed.');
    process.exit(0);
  }
}

// Run initialization
if (require.main === module) {
  initializeDatabase();
}

module.exports = initializeDatabase;
