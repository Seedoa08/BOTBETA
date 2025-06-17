class ModStats {
    constructor() {
        this.stats = new Map();
    }

    addAction(modId, action) {
        if (!this.stats.has(modId)) {
            this.stats.set(modId, {
                warns: 0,
                mutes: 0,
                kicks: 0,
                bans: 0
            });
        }

        const modStats = this.stats.get(modId);
        modStats[action]++;
        this.stats.set(modId, modStats);
    }

    getModStats(modId) {
        return this.stats.get(modId) || {
            warns: 0,
            mutes: 0,
            kicks: 0,
            bans: 0
        };
    }

    getTopModerators() {
        return Array.from(this.stats.entries())
            .sort((a, b) => {
                const totalA = Object.values(a[1]).reduce((sum, val) => sum + val, 0);
                const totalB = Object.values(b[1]).reduce((sum, val) => sum + val, 0);
                return totalB - totalA;
            })
            .slice(0, 5);
    }
}

module.exports = new ModStats();
