const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

// Simple test endpoint
app.get("/", (req, res) => {
  res.send("WhatsApp CRM API Running - Test Mode");
});

// Test endpoint for WhatsApp launcher
app.get("/api/test", (req, res) => {
  res.json({ 
    success: true, 
    message: "WhatsApp launcher test endpoint working!" 
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Test Server running on port ${PORT}`);
  console.log(`🎯 WhatsApp launcher feature ready to test!`);
  console.log(`📱 Open http://localhost:3000 to test the frontend`);
}); 