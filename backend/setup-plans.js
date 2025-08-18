const mongoose = require("mongoose");
const SubscriptionPlan = require("./models/SubscriptionPlan");
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

const createDefaultPlans = async () => {
  try {
    // Check if plans already exist
    // const planCount = await SubscriptionPlan.countDocuments();
    // if (planCount > 0) {
    //   console.log("⚠️  Subscription plans already exist. Setup already completed.");
    //   return;
    // }

    const defaultPlans = [
      {
        planId: "free",
        planName: "Free Plan",
        price: 0,
        initialMessageLimit: 50,
        conversationLimit: 50,
        followupLimit: 20,
        features: [
          "Basic WhatsApp connection",
          "Limited AI conversations",
          "Community support"
        ],
        isActive: true
      },
      // {
      //   planId: "silver",
      //   planName: "Silver Plan",
      //   price: 4150, // ₹4,150/month
      //   initialMessageLimit: 100,
      //   conversationLimit: 500,
      //   followupLimit: 200,
      //   features: [
      //     "100 Initial Messages",
      //     "500 AI Conversations",
      //     "200 Follow-up Messages",
      //     "Basic Support",
      //     "Email Notifications"
      //   ],
      //   isActive: true
      // },
      // {
      //   planId: "gold",
      //   planName: "Gold Plan",
      //   price: 8325, // ₹8,325/month
      //   initialMessageLimit: 250,
      //   conversationLimit: 1000,
      //   followupLimit: 500,
      //   features: [
      //     "250 Initial Messages",
      //     "1000 AI Conversations",
      //     "500 Follow-up Messages",
      //     "Priority Support",
      //     "Advanced Analytics",
      //     "Custom Templates"
      //   ],
      //   isActive: true
      // },
      // {
      //   planId: "platinum",
      //   planName: "Platinum Plan",
      //   price: 16600, // ₹16,600/month
      //   initialMessageLimit: 500,
      //   conversationLimit: 2500,
      //   followupLimit: 1000,
      //   features: [
      //     "500 Initial Messages",
      //     "2500 AI Conversations",
      //     "1000 Follow-up Messages",
      //     "24/7 Premium Support",
      //     "Advanced Analytics",
      //     "Custom Templates",
      //     "API Access",
      //     "Dedicated Account Manager"
      //   ],
      //   isActive: true
      // }
    ];

    for (const planData of defaultPlans) {
      const plan = new SubscriptionPlan(planData);
      await plan.save();
      console.log(`✅ Created ${planData.planName} - ₹${planData.price}/month`);
    }
    
    console.log("\n✅ All default subscription plans created successfully!");
    
  } catch (error) {
    console.error("❌ Error creating subscription plans:", error.message);
    process.exit(1);
  }
};

const main = async () => {
  console.log("🔧 Setting up default subscription plans...\n");
  
  await connectDB();
  await createDefaultPlans();
  
  console.log("\n✅ Setup completed successfully!");
  process.exit(0);
};

main();
