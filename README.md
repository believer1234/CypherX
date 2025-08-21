🤖 CypherX WhatsApp Bot

A simple yet powerful WhatsApp bot built with Baileys (WebSocket library) that supports:

✅ Media support (images, videos, audio, docs, stickers)
✅ Download songs and movies
✅ Text-to-image (fancy styles)
✅ Owner-only commands
✅ Auto-restart + Keep Alive (for Katabump/Replit/Termux hosting)


📦 Installation

1️⃣ Clone or Upload

Upload all files (index.js, commands.js, config.js, server.js, package.json, README.md) into your project folder.

2️⃣ Install Dependencies

Run:

npm install

This will install:

@whiskeysockets/baileys (WhatsApp connection)

axios (fetch API, media, downloads)

express (for keep alive)


3️⃣ Start the Bot

npm start

This will run server.js, which launches the bot and keeps it alive.


---

⚙️ Configuration

Edit config.js:

module.exports = {
  ownerNumber: "233534970884", // Your WhatsApp number
  ownerName: "Believer",
  botName: "CypherX Bot",
  prefix: ".",
};


---

📜 Commands

Type in WhatsApp chat:

.menu        → Show all commands + owner info
.song <name> → Download a song
.movie <name> → Get movie info/download
.download <url> → Download media from link
.viewonce <on/off> → Toggle view-once feature

🎨 Text Effects

.metallic <text>
.ice <text>
.snow <text>
.neon <text>
.purple <text>
.thunder <text>
.matrix <text>
.arena <text>
.hacker <text>
.glitch <text>
.fire <text>


--

🚀 Hosting

▶ Termux

pkg update && pkg upgrade
//pkg install nodejs git//
git clone <your-bot-repo>
cd <bot-folder>
npm install
npm start

▶ Katabump / Replit

Upload your files

Add server.js as the entry point

Deploy

Copy your bot URL (example: https://mybot.katabump.app/)



---

🔄 Keep Alive

Use UptimeRobot or CronJob.org to ping your bot URL every 5 minutes.
This prevents the bot from sleeping.


---

👑 Owner Info

Owner: Believer

Number: 233534970884

Bot Name: CypherX Bot



---
