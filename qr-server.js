// qr-server.js - Enhanced server with web-based QR code
const express = require("express");
const QRCode = require('qrcode');
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

// Store QR code data
let qrData = null;
let botReady = false;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Create public directory if it doesn't exist
if (!fs.existsSync('public')) {
  fs.mkdirSync('public');
}

// Routes
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>WhatsApp Bot QR Code</title>
        <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .container { max-width: 600px; margin: 0 auto; }
            .qr-container { margin: 20px 0; }
            .status { padding: 10px; border-radius: 5px; margin: 10px 0; }
            .connected { background: #d4edda; color: #155724; }
            .disconnected { background: #f8d7da; color: #721c24; }
            .waiting { background: #fff3cd; color: #856404; }
        </style>
        <meta http-equiv="refresh" content="5">
    </head>
    <body>
        <div class="container">
            <h1>WhatsApp Bot QR Code</h1>
            <div class="status ${botReady ? 'connected' : 'waiting'}">
                ${botReady ? '✅ Bot Connected!' : '⏳ Waiting for QR scan...'}
            </div>
            ${qrData ? `
                <div class="qr-container">
                    <img src="${qrData}" alt="QR Code" style="max-width: 300px;">
                    <p>Scan this QR code with WhatsApp → Linked Devices</p>
                </div>
            ` : '<p>Generating QR code... Refresh in a few seconds.</p>'}
            <p>Owner: Believer | Bot: CypherX Bot</p>
        </div>
    </body>
    </html>
    `);
});

app.get("/qr", (req, res) => {
  if (qrData) {
    res.send(`<img src="${qrData}" alt="QR Code" style="max-width: 100%;">`);
  } else {
    res.send("QR code not generated yet. Please wait...");
  }
});

app.get("/health", (req, res) => {
  res.json({
    status: botReady ? "connected" : "waiting_qr",
    qr_available: !!qrData,
    timestamp: new Date().toISOString()
  });
});

// Start bot process
function startBot() {
  console.log("🚀 Starting WhatsApp Bot...");
  
  const botProcess = spawn("node", ["index.js"], {
    env: { ...process.env, NODE_ENV: "production" }
  });
  
  // Capture QR code output
  botProcess.stdout.on('data', (data) => {
    const output = data.toString();
    console.log('Bot:', output);
    
    // Check for QR code in output
    if (output.includes('QR:')) {
      const qrMatch = output.match(/QR:\s*([^\n]+)/);
      if (qrMatch && qrMatch[1]) {
        generateQRWeb(qrMatch[1].trim());
      }
    }
    
    // Check if connected
    if (output.includes('✅ Bot connected successfully!')) {
      botReady = true;
      qrData = null; // Clear QR code after connection
      console.log("✅ Bot is now connected!");
    }
  });
  
  botProcess.stderr.on('data', (data) => {
    console.error('Bot Error:', data.toString());
  });
  
  botProcess.on('close', (code) => {
    console.log(`⚠️ Bot process exited with code ${code}. Restarting in 5s...`);
    botReady = false;
    qrData = null;
    setTimeout(startBot, 5000);
  });
}

// Generate QR code for web display
async function generateQRWeb(qrText) {
  try {
    console.log("Generating QR code for web...");
    qrData = await QRCode.toDataURL(qrText);
    console.log("✅ QR code generated and available at /");
  } catch (err) {
    console.error("❌ QR generation error:", err);
  }
}

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ QR Server running on port ${PORT}`);
  console.log(`🌐 Open http://your-katabump-url.katabump.com to see QR code`);
  startBot();
});