const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { google } = require("googleapis");
const mongoose = require("mongoose");
require("dotenv").config();
const Settings = require("./models/Settings");
const Lead = require("./models/Lead");
const Knowledgebase = require("./models/Knowledgebase");

// Connect to MongoDB
mongoose.connect(
  process.env.MONGODB_URI || "mongodb+srv://aiagenticcrm:TechDB%40%232025@cluster0.d2sgkdm.mongodb.net/aiagentcrm?retryWrites=true&w=majority&appName=Cluster0"
);

// WhatsApp client
const client = new Client({
  authStrategy: new LocalAuth({ clientId: "excel-leads" }),
  puppeteer: {
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  },
});

client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
  console.log("📱 Scan this QR to login.");
});

client.on("ready", async () => {
  console.log("✅ WhatsApp client is ready.");
  await fetchLeadsAndSend();
  // Schedule periodic fetch
  setInterval(fetchLeadsAndSend, await getFetchIntervalMs());
});

async function getFetchIntervalMs() {
  const settings = await Settings.findOne().sort({ updatedAt: -1 });
  return (settings?.fetchIntervalMinutes || 3) * 60 * 1000;
}

async function fetchLeadsAndSend() {
  const settings = await Settings.findOne().sort({ updatedAt: -1 });
  const kb = await Knowledgebase.findOne().sort({ updatedAt: -1 });
  const MESSAGE_TEMPLATE =
    settings?.messageTemplate ||
    "Hi {name}, Thanks for filling the form. We will contact you soon.";
  const BATCH_SIZE = settings?.batchSize || 1;
  const MESSAGE_DELAY_MS = settings?.messageDelay || 3000;
  const SHEET_ID =
    process.env.SHEET_ID || "1_NgLV7pYWU8T4ZkzEX0YxuWhCCxBiJ3kR2-nnWJHFUo";
  const CREDENTIALS_PATH = path.join(__dirname, "google-credentials.json");
  const SHEET_RANGE = "Sheet1!A2:F";
  // Fetch from Google Sheets
  try {
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, "utf-8"));
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
      await Lead.findOneAndUpdate(
        { phone },
        {
          $set: {
            name,
            phone,
            email,
            status,
            source,
            timestamp: timestamp ? new Date(timestamp) : new Date(),
          },
        },
        { upsert: true, new: true }
      );
    }
    console.log(
      `Fetched and upserted ${rows.length} leads from Google Sheets.`
    );
  } catch (err) {
    console.error("❌ Error fetching leads from Google Sheets:", err.message);
    return;
  }
  // Send WhatsApp messages to unsent leads
  const leads = await Lead.find({ initialMessageSent: false })
    .sort({ timestamp: -1 })
    .limit(BATCH_SIZE);
  for (const lead of leads) {
    const waId = lead.phone.replace(/\D/g, "") + "@c.us";
    const message = MESSAGE_TEMPLATE.replace("{name}", lead.name || "there");
    console.log(`Attempting to send to ${waId}: ${message}`);
    try {
      await client.sendMessage(waId, message);
      console.log(`✅ Sent to ${waId}`);
      lead.initialMessageSent = true;
      lead.initialMessageTimestamp = new Date();
      await lead.save();
    } catch (err) {
      console.error(`❌ Failed to send to ${waId}:`, err.message);
    }
    await new Promise((res) => setTimeout(res, MESSAGE_DELAY_MS));
  }
  if (leads.length > 0) console.log("✅ Batch of unsent leads processed.");
}

client.initialize();
