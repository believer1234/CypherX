const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const fs = require('fs');
const P = require('pino');
const path = require('path');

// Load commands and config
const { handleCommand } = require('./commands');
const config = require('./config');

// Function to generate 8-letter pairing code
function generatePairingCode() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
}

// Store pairing code
let pairingCode = generatePairingCode();
let pairingExpiry = Date.now() + 5 * 60 * 1000; // 5 minutes expiry

// Start WhatsApp bot
async function startBot() {
    console.log("🤖 Starting WhatsApp Bot...");
    console.log("👑 Owner:", config.ownerName);
    console.log("📞 Number:", config.OWNER_NUMBER);
    console.log("🤖 Bot Name:", config.BOT_NAME);
    console.log("⚡ Prefix:", config.prefix);
    console.log("─".repeat(50));
    
    console.log("🔐 PAIRING CODE:", pairingCode);
    console.log("⏰ Code expires in: 5 minutes");
    console.log("─".repeat(50));
    console.log("📱 INSTRUCTIONS:");
    console.log("1. Open WhatsApp on your phone");
    console.log("2. Go to Settings → Linked Devices");
    console.log("3. Tap 'Link a Device'");
    console.log("4. Tap 'Use WhatsApp Web instead'");
    console.log("5. Enter this code:", pairingCode);
    console.log("─".repeat(50));
    
    const { state, saveCreds } = await useMultiFileAuthState("auth_info");
    
    const sock = makeWASocket({
        logger: P({ level: "silent" }),
        auth: state,
        mobile: false // Important for pairing code
    });
    
    // Connection handling
    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr, isNewLogin } = update;
        
        if (isNewLogin) {
            console.log("✅ New login detected - ready for pairing!");
        }
        
        if (connection === "close") {
            const shouldReconnect =
                lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log("🔌 Connection closed. Reconnecting...", shouldReconnect);
            if (shouldReconnect) {
                // Generate new pairing code on reconnect
                pairingCode = generatePairingCode();
                pairingExpiry = Date.now() + 5 * 60 * 1000;
                console.log("🔄 New pairing code:", pairingCode);
                setTimeout(startBot, 3000);
            }
        } else if (connection === "open") {
            console.log("✅ Bot connected successfully!");
            console.log("🤖 Bot is now ready to receive commands!");
            pairingCode = ""; // Clear code after successful connection
        }
    });
    
    sock.ev.on("creds.update", saveCreds);
    
    // Handle pairing events
    sock.ev.on("pairing.update", (update) => {
        if (update.code) {
            console.log("📋 Pairing code request received");
        }
    });
    
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
        
        console.log(`⚡ Command received: ${config.prefix}${command} from ${senderNumber}`);
        
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
            try {
                await sock.sendMessage(from, {
                    text: "❌ An error occurred while processing your command."
                }, { quoted: msg });
            } catch (sendError) {
                console.error("Failed to send error message:", sendError);
            }
        }
    });
    
    // Check pairing code expiry every minute
    setInterval(() => {
        if (pairingCode && Date.now() > pairingExpiry) {
            console.log("⏰ Pairing code expired! Generating new one...");
            pairingCode = generatePairingCode();
            pairingExpiry = Date.now() + 5 * 60 * 1000;
            console.log("🔄 New pairing code:", pairingCode);
        }
    }, 60000);
}

// Start the bot with error handling
async function main() {
    try {
        await startBot();
    } catch (error) {
        console.error("❌ Failed to start bot:", error);
        console.log("🔄 Restarting in 5 seconds...");
        // Generate new code on restart
        pairingCode = generatePairingCode();
        pairingExpiry = Date.now() + 5 * 60 * 1000;
        setTimeout(main, 5000);
    }
}

// Handle process errors
process.on('uncaughtException', (error) => {
    console.error('⚠️ Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('⚠️ Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start the application
console.log("🚀 Starting CypherX WhatsApp Bot...");
console.log("📅", new Date().toLocaleString());
console.log("─".repeat(50));

main();