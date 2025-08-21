const axios = require("axios");
const { downloadMediaMessage } = require("@whiskeysockets/baileys");

// Handle all commands here
async function handleCommand(sock, msg, from, command, args, config) {
    const { isOwner, OWNER_NAME, OWNER_NUMBER, BOT_NAME } = config;

    // Helper: send text
    const sendText = async (text) => {
        await sock.sendMessage(from, { text }, { quoted: msg });
    };

    // ====== MENU ======
    if (command === "menu") {
        let menuText = `👋 Hello! I am *${BOT_NAME}*  

👑 Owner: ${OWNER_NAME}  
📞 Contact: wa.me/${OWNER_NUMBER}  

📌 Available Commands:
┃ ◈ .menu
┃ ◈ .viewonce
┃ ◈ .song <name>
┃ ◈ .movie <name>
┃ ◈ .download (media reply)
┃ ◈ .metallic <text>
┃ ◈ .ice <text>
┃ ◈ .snow <text>
┃ ◈ .impressive <text>
┃ ◈ .matrix <text>
┃ ◈ .light <text>
┃ ◈ .neon <text>
┃ ◈ .devil <text>
┃ ◈ .purple <text>
┃ ◈ .thunder <text>
┃ ◈ .leaves <text>
┃ ◈ .1917 <text>
┃ ◈ .arena <text>
┃ ◈ .hacker <text>
┃ ◈ .sand <text>
┃ ◈ .blackpink <text>
┃ ◈ .glitch <text>
┃ ◈ .fire <text>`;
        await sendText(menuText);
    }

    // ====== VIEWONCE ======
    else if (command === "viewonce") {
        if (!isOwner) return sendText("❌ Only the owner can use this.");
        if (!msg.message.viewOnceMessageV2) {
            return sendText("⚠️ Reply to a *View Once* image/video.");
        }

        try {
            const media = await downloadMediaMessage(
                msg,
                "buffer",
                {},
                { logger: console }
            );

            const type = msg.message.viewOnceMessageV2.message.imageMessage
                ? "image"
                : "video";

            await sock.sendMessage(from, { [type]: media }, { quoted: msg });
        } catch (err) {
            console.error("ViewOnce error:", err);
            await sendText("❌ Failed to process view once media.");
        }
    }

    // ====== MEDIA DOWNLOADER ======
    else if (command === "download") {
        if (!msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
            return sendText("⚠️ Reply to a media message to download it.");
        }
        
        try {
            const quoted = msg.message.extendedTextMessage.contextInfo.quotedMessage;
            const media = await downloadMediaMessage(
                { message: quoted },
                "buffer",
                {},
                { logger: console }
            );
            
            let mtype = "document";
            if (quoted.imageMessage) mtype = "image";
            else if (quoted.videoMessage) mtype = "video";
            else if (quoted.audioMessage) mtype = "audio";
            
            await sock.sendMessage(from, { [mtype]: media }, { quoted: msg });
        } catch (err) {
            console.error("Download error:", err);
            await sendText("❌ Failed to download media.");
        }
    }

    // ====== SONG DOWNLOADER ======
    else if (command === "song") {
        if (!args[0]) return sendText("⚠️ Example: .song despacito");
        let query = args.join(" ");
        await sendText(`🎵 Searching for: ${query}...`);

        try {
            let res = await axios.get(
                `https://api.popcat.xyz/song?name=${encodeURIComponent(query)}`
            );
            
            if (!res.data || !res.data.preview) {
                return sendText("❌ Song not found or preview unavailable.");
            }
            
            await sock.sendMessage(from, {
                audio: { url: res.data.preview },
                mimetype: "audio/mpeg"
            }, { quoted: msg });
        } catch (e) {
            console.error("Song error:", e);
            await sendText("❌ Failed to fetch song.");
        }
    }

    // ====== MOVIE INFO ======
    else if (command === "movie") {
        if (!args[0]) return sendText("⚠️ Example: .movie avatar");
        let query = args.join(" ");
        await sendText(`🎬 Searching for movie: ${query}...`);

        try {
            let res = await axios.get(
                `https://www.omdbapi.com/?t=${encodeURIComponent(query)}&apikey=564727fa`
            );
            let m = res.data;
            if (m.Response === "False") return sendText("❌ Movie not found.");

            let movieInfo = `🎬 *${m.Title}* (${m.Year})  
⭐ Rating: ${m.imdbRating}  
📌 Genre: ${m.Genre}  
🕐 Runtime: ${m.Runtime}  
📖 Plot: ${m.Plot}`;
            
            await sock.sendMessage(from, 
                { 
                    image: { url: m.Poster }, 
                    caption: movieInfo 
                }, 
                { quoted: msg }
            );
        } catch (e) {
            console.error("Movie error:", e);
            await sendText("❌ Failed to fetch movie info.");
        }
    }

    // ====== TEXT STYLES ======
    else if (
        [
            "metallic", "ice", "snow", "impressive", "matrix", "light", "neon",
            "devil", "purple", "thunder", "leaves", "1917", "arena",
            "hacker", "sand", "blackpink", "glitch", "fire"
        ].includes(command)
    ) {
        if (!args[0]) return sendText(`⚠️ Example: .${command} believer`);
        let text = args.join(" ");
        let url = `https://api.popcat.xyz/text?text=${encodeURIComponent(text)}&theme=${command}`;
        
        try {
            await sock.sendMessage(from, 
                { 
                    image: { url }, 
                    caption: `✨ ${command} effect` 
                }, 
                { quoted: msg }
            );
        } catch (err) {
            console.error("Text style error:", err);
            await sendText("❌ Failed to generate text effect.");
        }
    }

    // ====== UNKNOWN COMMAND ======
    else {
        await sendText("❓ Unknown command. Type *.menu* for help.");
    }
}

module.exports = { handleCommand };