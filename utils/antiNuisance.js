const { EmbedBuilder } = require('discord.js');

class AntiNuisance {
    constructor(client) {
        this.client = client;
        this.mentions = new Map();
        this.emojis = new Map();
        this.attachments = new Map();
        this.thresholds = {
            mentions: 5,
            emojis: 8,
            attachments: 3,
            timeWindow: 10000
        };
    }

    async handleMessage(message) {
        if (message.author.bot) return;
        const now = Date.now();

        // Vérifier mentions excessives
        if (this.checkMentions(message, now) || 
            this.checkEmojis(message, now) || 
            this.checkAttachments(message, now)) {

            await this.handleViolation(message);
            return true;
        }
        return false;
    }

    checkMentions(message, now) {
        const mentions = message.mentions.users.size + message.mentions.roles.size;
        if (mentions === 0) return false;

        const userKey = `${message.guild.id}-${message.author.id}`;
        const userData = this.mentions.get(userKey) || [];
        this.cleanOldData(userData, now);
        userData.push({ count: mentions, timestamp: now });
        this.mentions.set(userKey, userData);

        const totalMentions = userData.reduce((sum, data) => sum + data.count, 0);
        return totalMentions > this.thresholds.mentions;
    }

    // ...autres méthodes de vérification...

    async handleViolation(message) {
        try {
            await message.delete();
            const warn = await message.channel.send({
                embeds: [new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('⚠️ Comportement nuisible détecté')
                    .setDescription(`${message.author}, évitez le spam et les mentions excessives.`)
                    .setTimestamp()]
            });
            setTimeout(() => warn.delete().catch(() => {}), 5000);
        } catch (error) {
            console.error('Erreur anti-nuisance:', error);
        }
    }
}

module.exports = AntiNuisance;
