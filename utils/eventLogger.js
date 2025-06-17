const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

class EventLogger {
    constructor() {
        this.logsPath = path.join(__dirname, '../logs/events.json');
        this.stats = {
            commands: new Map(),
            moderationActions: new Map(),
            userActivity: new Map()
        };
    }

    logEvent(type, data) {
        const event = {
            type,
            timestamp: Date.now(),
            data,
            id: this.generateEventId()
        };

        this.saveToFile(event);
        this.updateStats(event);
        return event;
    }

    async sendToModLog(guild, embed) {
        const modChannel = guild.channels.cache.find(ch => 
            ch.name.includes('mod-logs') || 
            ch.name.includes('logs') ||
            ch.name.includes('audit')
        );

        if (modChannel) {
            await modChannel.send({ embeds: [embed] });
        }
    }

    // ... autres méthodes
}

module.exports = new EventLogger();
