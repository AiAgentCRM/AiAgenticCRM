const fs = require("fs");

// Read the current file
let content = fs.readFileSync("index.js", "utf8");

// Add SEO and marketing keywords to service_inquiry
content = content.replace(
  '"catalog",',
  '"catalog", "seo", "digital marketing", "marketing",'
);

content = content.replace('"portfolio",', '"portfolio", "optimization",');

// Add "okay" to context responses
content = content.replace('"fine",', '"fine", "okay",');

// Write the fixed content back
fs.writeFileSync("index.js", content);

console.log("✅ Lead qualification keywords fixed!");
console.log("Added: seo, digital marketing, marketing, optimization");
console.log("Added: okay to context responses");
