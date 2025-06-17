class ModerationStats {
    constructor() {
        this.stats = new Map();
    }

    logAction(guildId, action, data) {
        if (!this.stats.has(guildId)) {
            this.stats.set(guildId, {
                actions: [],
                moderators: new Map(),
                warnings: 0,
                mutes: 0,
                bans: 0
            });
        }

        const guildStats = this.stats.get(guildId);
        guildStats.actions.push({
            type: action,
            timestamp: Date.now(),
            ...data
        });

        // Mettre à jour les compteurs
        guildStats[action + 's']++;

        // Mettre à jour les stats du modérateur
        const modStats = guildStats.moderators.get(data.moderator) || { total: 0 };
        modStats.total++;
        modStats[action] = (modStats[action] || 0) + 1;
        guildStats.moderators.set(data.moderator, modStats);
    }

    getModeratorStats(guildId, moderatorId) {
        return this.stats.get(guildId)?.moderators.get(moderatorId) || null;
    }

    getGuildStats(guildId) {
        return this.stats.get(guildId) || null;
    }
}

module.exports = new ModerationStats();
