// bot-core.js - Contains your main bot logic
const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const fs = require('fs');
const P = require('pino');
const path = require('path');

// Load commands and config
const { handleCommand } = require('./commands');
const config = require('./config');

console.log("🤖 Starting WhatsApp Bot from bot-core.js...");

// Start WhatsApp bot
async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info");
  
  const sock = makeWASocket({
    logger: P({ level: "silent" }),
    printQRInTerminal: true,
    auth: state
  });
  
  // Connection handling
  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log("Connection closed. Reconnecting...", shouldReconnect);
      if (shouldReconnect) {
        startBot();
      }
    } else if (connection === "open") {
      console.log("✅ Bot connected successfully!");
    }
  });
  
  sock.ev.on("creds.update", saveCreds);
  
  // Handle incoming messages
  sock.ev.on("messages.upsert", async (m) => {
    const msg = m.messages[0];
    if (!msg.message || msg.key.fromMe) return;
    
    const from = msg.key.remoteJid;
    const type = Object.keys(msg.message)[0];
    const body =
      type === "conversation" ?
      msg.message.conversation :
      type === "extendedTextMessage" ?
      msg.message.extendedTextMessage.text :
      "";
    
    // Check for command prefix
    if (!body.startsWith(config.prefix)) return;
    const args = body.slice(1).trim().split(/ +/);
    const command = args.shift().toLowerCase();
    
    // Security: Only owner can run commands
    const sender = msg.key.participant || msg.key.remoteJid;
    const senderNumber = sender.replace(/@s\.whatsapp\.net/, "");
    const isOwner = senderNumber === config.OWNER_NUMBER;
    
    // Pass to command handler
    try {
      await handleCommand(sock, msg, from, command, args, {
        isOwner,
        OWNER_NAME: config.ownerName,
        OWNER_NUMBER: config.OWNER_NUMBER,
        BOT_NAME: config.BOT_NAME
      });
    } catch (err) {
      console.error("❌ Error handling command:", err);
    }
  });
}

// Start the bot
startBot();

module.exports = { startBot };