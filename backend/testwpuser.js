// index.js
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const client = new Client({
  authStrategy: new LocalAuth({ dataPath: './.wwebjs_auth' }), // keeps you logged in
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  },
});

client.on('qr', (qr) => {
  qrcode.generate(qr, { small: true });
  console.log('\nScan the QR above with WhatsApp → Linked devices.\n');
});

client.on('ready', () => {
  console.log('✅ WhatsApp client is ready. Waiting for messages...\n');
});

client.on('message', async (msg) => {
  try {
    const contact = await msg.getContact(); // the sender’s contact
    const chat = await msg.getChat();

    // The name the user set in their WhatsApp profile is contact.pushname.
    // Fallback to your saved name/short name/number if missing.
    const displayName =
      contact.pushname ||
      contact.name ||
      contact.shortName ||
      (await contact.getFormattedNumber());

    const where = chat.isGroup ? ` (group: ${chat.name})` : '';
    console.log(
      `[${new Date().toLocaleString()}] ${displayName} (${contact.number})${where}: ${msg.body}`
    );
  } catch (err) {
    console.error('Error handling incoming message:', err);
  }
});

client.initialize();
