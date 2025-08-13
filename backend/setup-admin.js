const mongoose = require("mongoose");
const Admin = require("./models/Admin");
const dotenv = require("dotenv");

dotenv.config();

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || "mongodb://localhost:27017/whatsappautoresponder";
    console.log("🔌 Connecting to MongoDB...");
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log("✅ MongoDB connected successfully!");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    process.exit(1);
  }
};

const createAdmin = async () => {
  try {
    // Check if any admin already exists
    const adminCount = await Admin.countDocuments();
    if (adminCount > 0) {
      console.log("⚠️  Admin account already exists. Setup already completed.");
      return;
    }

    // Get admin credentials from command line arguments or use defaults
    const username = process.argv[2] || "admin";
    const email = process.argv[3] || "admin@aiagenticcrm.com";
    const password = process.argv[4] || "admin123456";

    if (password.length < 8) {
      console.error("❌ Password must be at least 8 characters long");
      process.exit(1);
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
    
    console.log("✅ Super admin account created successfully!");
    console.log(`👤 Username: ${username}`);
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: ${password}`);
    console.log(`👑 Role: Super Admin`);
    console.log("\n🚀 You can now log in to the admin panel at /admin/login");
    
  } catch (error) {
    console.error("❌ Error creating admin account:", error.message);
    process.exit(1);
  }
};

const main = async () => {
  console.log("🔧 Setting up initial admin account...\n");
  
  await connectDB();
  await createAdmin();
  
  console.log("\n✅ Setup completed successfully!");
  process.exit(0);
};

main();
