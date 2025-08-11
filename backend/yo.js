const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const path = require("path");
const fs = require("fs");
const xlsx = require("xlsx"); // For reading Excel files

// Path to the Excel file
const excelFilePath = path.join(__dirname, "./media/recipients.xlsx"); // Replace with the path to your Excel file

// Define the accounts (add as many as you want)
const accounts = ["account1", "account2"]; // Replace with actual account names
let readyAccounts = 0;

// Delay between messages in milliseconds
const delay = 3000; // 3 seconds

// Function to read data from the Excel file
function readRecipientsFromExcel(filePath) {
  const workbook = xlsx.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return xlsx.utils.sheet_to_json(sheet);
}

// Initialize an empty array to hold all the client instances
const clients = [];

// Function to initialize each client
async function initializeClient(account) {
  const client = new Client({
    authStrategy: new LocalAuth({ clientId: account }),
    puppeteer: {
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    },
  });

  // QR Code Generation
  client.on("qr", (qr) => {
    qrcode.generate(qr, { small: true });
    console.log(`Scan the QR code for account "${account}".`);
  });

  // Client Ready Event
  client.on("ready", async () => {
    readyAccounts++;
    console.log(`WhatsApp Client "${account}" is ready! 🎉`);

    // If all accounts are ready, start the message sending process
    if (readyAccounts === accounts.length) {
      console.log("All accounts are ready! Starting to send messages...");
      await sendMessagesFromAccounts();
    }
  });

  // Error Handling
  client.on("auth_failure", (msg) => {
    console.error(`Authentication failed for account "${account}":`, msg);
  });

  client.on("disconnected", (reason) => {
    console.log(`Client "${account}" was disconnected:`, reason);
  });

  clients.push(client);
  client.initialize();
}

// Function to send messages and media from all accounts
async function sendMessagesFromAccounts() {
  const recipients = readRecipientsFromExcel(excelFilePath);

  // Validate recipients
  if (!recipients || recipients.length === 0) {
    console.error("No recipients found in the Excel file.");
    return;
  }

  let messageCounter = 0;
  let accountIndex = 0;
  const maxMessagesPerAccount = 2;

  while (true) {
    // Select current account
    const currentClient = clients[accountIndex];
    const currentAccount = accounts[accountIndex];

    console.log(
      `Sending ${maxMessagesPerAccount} messages from account "${currentAccount}"...`
    );

    for (let i = 0; i < maxMessagesPerAccount; i++) {
      const recipient = recipients[messageCounter++];

      if (!recipient) {
        console.log("No more recipients left.");
        break;
      }

      const { id, message, images, pdfs } = recipient;
      const chatId = id.includes("@") ? id : `${id}@c.us`; // Add @c.us for phone numbers

      try {
        // Send the message
        if (message) {
          await currentClient.sendMessage(chatId, message);
          console.log(`Text message sent to ${id}`);
        }

        // Send images
        if (images) {
          const imagePaths = images.split(",").map((img) => img.trim());
          for (const imagePath of imagePaths) {
            if (fs.existsSync(imagePath)) {
              const imageMedia = MessageMedia.fromFilePath(imagePath);
              console.log(`Sending image to ${id}...`);
              await currentClient.sendMessage(chatId, imageMedia);
              console.log(`Image sent to ${id}`);
            } else {
              console.error(`Image file not found: ${imagePath}`);
            }
          }
        }

        // Send PDFs
        if (pdfs) {
          const pdfPaths = pdfs.split(",").map((pdf) => pdf.trim());
          for (const pdfPath of pdfPaths) {
            if (fs.existsSync(pdfPath)) {
              const pdfMedia = MessageMedia.fromFilePath(pdfPath);
              console.log(`Sending PDF to ${id}...`);
              await currentClient.sendMessage(chatId, pdfMedia);
              console.log(`PDF sent to ${id}`);
            } else {
              console.error(`PDF file not found: ${pdfPath}`);
            }
          }
        }
      } catch (error) {
        console.error(
          `Failed to send message or media to ${id}:`,
          error.message
        );
      }

      // Wait for the specified delay before sending the next message
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    // Check if all recipients are processed
    if (messageCounter >= recipients.length) {
      console.log("All messages sent. 🎉");
      break;
    }

    // Rotate to the next account
    accountIndex = (accountIndex + 1) % clients.length;
  }
}

// Start initializing clients
accounts.forEach((account) => {
  initializeClient(account);
});
