const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/whatsappautoresponder", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const Tenant = require('./models/Tenant');

async function debugSessionFolders() {
  console.log('🔍 DEBUGGING SESSION FOLDERS AND WHATSAPP CLIENTS');
  console.log('=' .repeat(60));
  
  try {
    // Get all tenants
    const tenants = await Tenant.find({ isActive: true });
    console.log(`📊 Found ${tenants.length} active tenants`);
    
    const sessionBasePath = path.join(__dirname, '.wwebjs_auth');
    console.log(`📁 Session base path: ${sessionBasePath}`);
    
    if (!fs.existsSync(sessionBasePath)) {
      console.log('❌ Session base directory does not exist!');
      return;
    }
    
    console.log('✅ Session base directory exists');
    
    // Check each tenant's session folder
    for (const tenant of tenants) {
      console.log(`\n👤 TENANT: ${tenant.businessName} (${tenant.tenantId})`);
      console.log('-'.repeat(40));
      
      const sessionDir = path.join(sessionBasePath, `session-${tenant.tenantId}`);
      console.log(`📂 Session folder: ${sessionDir}`);
      
      if (fs.existsSync(sessionDir)) {
        console.log('✅ Session folder exists');
        
        // Check session folder contents
        try {
          const contents = fs.readdirSync(sessionDir);
          console.log(`📋 Folder contents: ${contents.length} items`);
          
          // Check for critical subdirectories
          const criticalDirs = ['Default', 'Local State', 'Preferences'];
          criticalDirs.forEach(dir => {
            const dirPath = path.join(sessionDir, dir);
            if (fs.existsSync(dirPath)) {
              console.log(`  ✅ ${dir} exists`);
            } else {
              console.log(`  ❌ ${dir} missing`);
            }
          });
          
          // Check Default subdirectory contents
          const defaultDir = path.join(sessionDir, 'Default');
          if (fs.existsSync(defaultDir)) {
            const defaultContents = fs.readdirSync(defaultDir);
            console.log(`  📁 Default contents: ${defaultContents.length} items`);
            
            // Check for critical files
            const criticalFiles = ['Cookies', 'Local Storage', 'Session Storage'];
            criticalFiles.forEach(file => {
              const filePath = path.join(defaultDir, file);
              if (fs.existsSync(filePath)) {
                const stats = fs.statSync(filePath);
                console.log(`    ✅ ${file} exists (${stats.size} bytes)`);
              } else {
                console.log(`    ❌ ${file} missing`);
              }
            });
          }
          
        } catch (err) {
          console.log(`❌ Error reading session folder: ${err.message}`);
        }
      } else {
        console.log('❌ Session folder does not exist');
        console.log('💡 This tenant will need to scan QR on first login');
      }
      
      // Check if tenant has WhatsApp client info
      console.log(`📱 WhatsApp Ready: ${tenant.whatsappReady ? 'YES' : 'NO'}`);
    }
    
    // Summary
    console.log('\n📊 SUMMARY');
    console.log('=' .repeat(40));
    
    const foldersWithSessions = tenants.filter(tenant => {
      const sessionDir = path.join(sessionBasePath, `session-${tenant.tenantId}`);
      return fs.existsSync(sessionDir);
    });
    
    const tenantsWithWhatsAppReady = tenants.filter(tenant => tenant.whatsappReady);
    
    console.log(`✅ Tenants with session folders: ${foldersWithSessions.length}/${tenants.length}`);
    console.log(`✅ Tenants with WhatsApp ready: ${tenantsWithWhatsAppReady.length}/${tenants.length}`);
    
    if (foldersWithSessions.length > 0) {
      console.log('\n🎯 TENANTS READY FOR AUTO-LOGIN:');
      foldersWithSessions.forEach(tenant => {
        console.log(`  - ${tenant.businessName} (${tenant.tenantId})`);
      });
    }
    
    if (tenants.length - foldersWithSessions.length > 0) {
      console.log('\n⚠️  TENANTS NEEDING QR SCAN:');
      tenants.filter(tenant => {
        const sessionDir = path.join(sessionBasePath, `session-${tenant.tenantId}`);
        return !fs.existsSync(sessionDir);
      }).forEach(tenant => {
        console.log(`  - ${tenant.businessName} (${tenant.tenantId})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error debugging session folders:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the debug script
debugSessionFolders(); 