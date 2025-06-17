const { PermissionsBitField, EmbedBuilder } = require('discord.js');

class RaidProtection {
    constructor(client) {
        this.client = client;
        this.joinQueue = new Map();
        this.raidMode = new Map();
        this.lockdownMode = new Map();
        this.quarantineRole = new Map();
        this.settings = {
            joinThreshold: 8,
            timeWindow: 10000,
            accountAgeDays: 7,
            actionDuration: 1800000 // 30 minutes
        };
    }

    async enableRaidMode(guild, reason) {
        if (this.raidMode.get(guild.id)) return;

        // Créer ou récupérer le rôle quarantaine
        let quarantineRole = this.quarantineRole.get(guild.id);
        if (!quarantineRole) {
            quarantineRole = await this.createQuarantineRole(guild);
            this.quarantineRole.set(guild.id, quarantineRole);
        }

        // Verrouiller les canaux
        await this.lockdownServer(guild, reason);

        this.raidMode.set(guild.id, {
            enabled: true,
            timestamp: Date.now(),
            reason: reason
        });

        // Envoyer notification aux modérateurs
        this.notifyModerators(guild, reason);
    }

    async createQuarantineRole(guild) {
        return await guild.roles.create({
            name: 'Quarantaine',
            color: 'RED',
            permissions: [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.ReadMessageHistory
            ],
            reason: 'Création du rôle de quarantaine pour la protection anti-raid'
        });
    }

    onGuildMemberAdd(member) {
        this.checkJoinRaid(member);
        this.checkAccountAge(member);
        this.updateJoinQueue(member);
    }

    async checkJoinRaid(member) {
        const recentJoins = this.getRecentJoins(member.guild.id);
        
        if (recentJoins.length >= this.settings.joinThreshold) {
            await this.enableRaidProtection(member.guild, 'Détection de raid - Joins massifs');
        }
    }

    // ...autres méthodes de protection
}

module.exports = RaidProtection;
