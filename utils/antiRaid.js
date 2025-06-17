const { EmbedBuilder } = require('discord.js');

class AntiRaid {
    constructor(client) {
        this.client = client;
        this.recentJoins = new Map();
        this.raidMode = new Map();
        this.settings = {
            maxJoins: 5,
            timeWindow: 10000,
            lockdownDuration: 300000, // 5 minutes
            accountAgeTreshold: 86400000 // 24 heures
        };
    }

    async handleJoin(member) {
        const guildId = member.guild.id;
        const now = Date.now();
        
        // Vérification de l'âge du compte
        const accountAge = now - member.user.createdTimestamp;
        if (accountAge < this.settings.accountAgeTreshold) {
            await this.handleSuspiciousJoin(member, 'Compte trop récent');
            return;
        }

        // Gestion des joins récents
        if (!this.recentJoins.has(guildId)) {
            this.recentJoins.set(guildId, []);
        }

        const recentJoins = this.recentJoins.get(guildId);
        this.cleanOldJoins(recentJoins, now);
        recentJoins.push({ timestamp: now, userId: member.id });

        // Détection de raid
        if (recentJoins.length >= this.settings.maxJoins) {
            await this.enableRaidMode(member.guild, 'Détection de raid - Joins massifs');
        }
    }

    async enableRaidMode(guild, reason) {
        if (this.raidMode.get(guild.id)) return;

        this.raidMode.set(guild.id, {
            enabled: true,
            timestamp: Date.now(),
            reason: reason
        });

        // Actions de protection
        await this.applyRaidProtection(guild, reason);

        // Notification aux modérateurs
        const modChannel = guild.channels.cache.find(ch => 
            ch.name.includes('mod-logs') || ch.name.includes('raid-logs')
        );

        if (modChannel) {
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('🚨 Mode Anti-Raid Activé')
                .setDescription(reason)
                .addFields(
                    { name: 'Actions prises', value: '• Verrouillage des canaux\n• Vérification renforcée\n• Surveillance accrue' },
                    { name: 'Durée', value: 'Mode manuel - Désactivation requise' }
                )
                .setTimestamp();

            await modChannel.send({ embeds: [embed] });
        }

        // Désactivation automatique après un délai
        setTimeout(() => this.disableRaidMode(guild), this.settings.lockdownDuration);
    }

    // ...autres méthodes utiles
}

module.exports = AntiRaid;
