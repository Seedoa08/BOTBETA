const fs = require('fs');
const path = require('path');

class LogManager {
    static async saveLog(guildId, logData) {
        const logsDir = path.join(__dirname, '../logs');
        const guildLogsFile = path.join(logsDir, `${guildId}_logs.json`);

        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
        }

        let logs = [];
        if (fs.existsSync(guildLogsFile)) {
            logs = JSON.parse(fs.readFileSync(guildLogsFile, 'utf8'));
        }

        logs.push({
            ...logData,
            id: Date.now()
        });

        // Rotation des logs
        if (logs.length > 1000) {
            const archiveFile = `${guildId}_logs_${Date.now()}.json`;
            fs.writeFileSync(path.join(logsDir, archiveFile), JSON.stringify(logs.slice(0, -1000), null, 2));
            logs = logs.slice(-1000);
        }

        fs.writeFileSync(guildLogsFile, JSON.stringify(logs, null, 2));
        return true;
    }

    static async getLogs(guildId, filter = null, limit = 100) {
        const guildLogsFile = path.join(__dirname, '../logs', `${guildId}_logs.json`);
        
        if (!fs.existsSync(guildLogsFile)) {
            return [];
        }

        let logs = JSON.parse(fs.readFileSync(guildLogsFile, 'utf8'));
        
        if (filter) {
            logs = logs.filter(log => log.type === filter);
        }

        return logs.slice(-limit).reverse();
    }
}

module.exports = LogManager;
