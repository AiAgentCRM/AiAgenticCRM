const mongoose = require("mongoose");
const Lead = require("./models/Lead");
require("dotenv").config();

async function updateExistingLeads() {
  try {
    const mongoURI = process.env.MONGODB_URI || "mongodb://localhost:27017/whatsappautoresponder";
    console.log("🔌 Connecting to MongoDB...");
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log("✅ MongoDB connected successfully!");
    
    // Find all leads that don't have the aiReplyEnabled field
    const leadsToUpdate = await Lead.find({ aiReplyEnabled: { $exists: false } });
    console.log(`📊 Found ${leadsToUpdate.length} leads without aiReplyEnabled field`);
    
    if (leadsToUpdate.length > 0) {
      // Update all leads to set aiReplyEnabled to false
      const result = await Lead.updateMany(
        { aiReplyEnabled: { $exists: false } },
        { $set: { aiReplyEnabled: false } }
      );
      
      console.log(`✅ Updated ${result.modifiedCount} leads with aiReplyEnabled: false`);
    } else {
      console.log("✅ All leads already have the aiReplyEnabled field");
    }
    
    // Verify the update
    const totalLeads = await Lead.countDocuments();
    const leadsWithField = await Lead.countDocuments({ aiReplyEnabled: { $exists: true } });
    
    console.log(`📊 Total leads: ${totalLeads}`);
    console.log(`📊 Leads with aiReplyEnabled field: ${leadsWithField}`);
    
    console.log("✅ Update completed successfully!");
    
  } catch (error) {
    console.error("❌ Error updating leads:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 MongoDB disconnected");
  }
}

// Run the update
updateExistingLeads();
