// cleanup.js
// Handles automatic cleanup tasks (temp files, logs, etc.)

import fs from "fs"
import path from "path"
import cron from "node-cron"

const tempDir = path.resolve("./temp")

// Ensure temp directory exists
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true })
}

// 🧹 Helper: delete file safely
const safeDelete = (filePath) => {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath)
            console.log(`🧹 Deleted: ${filePath}`)
        }
    } catch (err) {
        console.error("❌ Cleanup error:", err)
    }
}

// ✅ Delete temp_ files every hour
cron.schedule("0 * * * *", () => {
    fs.readdir(tempDir, (err, files) => {
        if (err) return
        files.forEach(file => {
            if (file.startsWith("temp_")) {
                safeDelete(path.join(tempDir, file))
            }
        })
    })
})

// ✅ Delete old logs daily at midnight
cron.schedule("0 0 * * *", () => {
    fs.readdir(tempDir, (err, files) => {
        if (err) return
        files.forEach(file => {
            if (file.endsWith(".log")) {
                const filePath = path.join(tempDir, file)
                try {
                    const stats = fs.statSync(filePath)
                    const fileAge = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60 * 24)
                    
                    if (fileAge > 1) {
                        safeDelete(filePath)
                    }
                } catch (err) {
                    console.error("❌ Error checking file age:", err)
                }
            }
        })
    })
})

// ✅ Export cleanup (can be triggered manually too)
export const cleanup = () => {
    fs.readdir(tempDir, (err, files) => {
        if (err) return
        files.forEach(file => {
            if (file.startsWith("temp_") || file.endsWith(".log")) {
                safeDelete(path.join(tempDir, file))
            }
        })
    })
}