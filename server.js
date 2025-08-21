const express = require("express");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Katabump requires a health check endpoint
app.get("/", (req, res) => {
    res.json({
        status: "online",
        message: "WhatsApp Bot is running",
        owner: "Believer",
        timestamp: new Date().toISOString()
    });
});

// Health check endpoint (required by Katabump)
app.get("/health", (req, res) => {
    res.status(200).json({
        status: "OK",
        service: "whatsapp-bot",
        uptime: process.uptime()
    });
});

// Import and start the bot
function startBot() {
    console.log("🚀 Starting WhatsApp Bot on Katabump...");
    
    try {
        if (fs.existsSync(path.join(__dirname, 'index.js'))) {
            console.log("✅ Found index.js, starting bot...");
            const bot = spawn("node", ["index.js"], {
                stdio: "inherit",
                env: { ...process.env, NODE_ENV: "production" }
            });
            
            bot.on("close", (code) => {
                console.log(`⚠️ Bot crashed with code ${code}. Restarting in 5s...`);
                setTimeout(startBot, 5000);
            });
        } else {
            console.log("📁 index.js not found. Starting bot directly...");
            startBotDirectly();
        }
    } catch (error) {
        console.error("❌ Error starting bot:", error);
        setTimeout(startBot, 5000);
    }
}
    
    try {
        // Check if index.js exists
        if (fs.existsSync(path.join(__dirname, 'index.js'))) {
            console.log("✅ Found index.js, starting bot...");
            const bot = spawn("node", ["index.js"], {
                stdio: "inherit",
                env: { ...process.env, NODE_ENV: "production" }
            });
            
            bot.on("close", (code) => {
                console.log(`⚠️ Bot crashed with code ${code}. Restarting in 5s...`);
                setTimeout(startBot, 5000);
            });
        } else {
            console.log("❌ index.js not found. Starting bot directly from server.js");
            // If index.js doesn't exist, we'll run the bot code directly
            require('./bot-core.js'); // We'll create this file next
        }
    } catch (error) {
        console.error("❌ Error starting bot:", error);
        setTimeout(startBot, 5000);
    }

// Start server and bot
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Katabump server running on port ${PORT}`);
    console.log(`✅ Current directory: ${__dirname}`);
    console.log(`✅ Files in directory: ${fs.readdirSync(__dirname).join(', ')}`);
    startBot();
});