const { EmbedBuilder } = require('discord.js');

class SanctionReminder {
    constructor(client) {
        this.client = client;
        this.reminders = new Map();
    }

    addReminder(userId, type, duration, guildId) {
        const endTime = Date.now() + duration;
        
        this.reminders.set(userId, {
            type,
            endTime,
            guildId
        });

        setTimeout(() => this.checkReminder(userId), duration);
    }

    async checkReminder(userId) {
        const reminder = this.reminders.get(userId);
        if (!reminder) return;

        const guild = this.client.guilds.cache.get(reminder.guildId);
        if (!guild) return;

        const logChannel = guild.channels.cache.find(c => c.name === 'mod-logs');
        if (logChannel) {
            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('🕒 Sanction terminée')
                .setDescription(`La sanction de type ${reminder.type} pour <@${userId}> est terminée.`)
                .setTimestamp();

            await logChannel.send({ embeds: [embed] });
        }

        this.reminders.delete(userId);
    }
}

module.exports = SanctionReminder;
