const { Client, LocalAuth } = require("whatsapp-web.js");
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: false,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  },
});
client.on("qr", (qr) => console.log("Scan QR:", qr));
client.on("ready", async () => {
  try {
    await client.sendMessage(
      "919547441407@c.us",
      "Test message from minimal backend!"
    );
    console.log("Message sent!");
  } catch (e) {
    console.error("Failed to send:", e);
  }
});
client.initialize();
