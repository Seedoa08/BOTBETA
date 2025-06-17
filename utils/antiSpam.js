class AntiSpam {
    constructor() {
        this.messageCache = new Map();
        this.warnThreshold = 8; // Nombre de messages similaires avant un avertissement
        this.muteThreshold = 12; // Nombre de messages similaires avant un mute
        this.timeWindow = 15000; // Fenêtre de temps en millisecondes (15 secondes)
    }

    check(message) {
        const now = Date.now();
        const userId = message.author.id;

        if (!this.messageCache.has(userId)) {
            this.messageCache.set(userId, []);
        }

        const userMessages = this.messageCache.get(userId);
        userMessages.push({
            content: message.content,
            timestamp: now
        });

        // Nettoyer les messages plus vieux que la fenêtre de temps
        const recentMessages = userMessages.filter(msg => now - msg.timestamp < this.timeWindow);
        this.messageCache.set(userId, recentMessages);

        // Vérifier les messages similaires
        const similarMessages = recentMessages.filter(msg => msg.content === message.content);

        return {
            shouldWarn: similarMessages.length >= this.warnThreshold,
            shouldMute: similarMessages.length >= this.muteThreshold
        };
    }
}

module.exports = new AntiSpam();
