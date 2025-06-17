const EventEmitter = require('events');

class RaidDetection extends EventEmitter {
    constructor(options = {}) {
        super();
        this.options = {
            joinThreshold: options.joinThreshold || 10,
            timeWindow: options.timeWindow || 30000,
            messageThreshold: options.messageThreshold || 20,
            similarityThreshold: options.similarityThreshold || 0.8,
            ...options
        };

        this.recentJoins = new Map();
        this.recentMessages = new Map();
        this.suspiciousUsers = new Set();
    }

    trackJoin(member) {
        const now = Date.now();
        this.cleanOldData(now);
        
        const guildJoins = this.recentJoins.get(member.guild.id) || [];
        guildJoins.push({
            userId: member.id,
            timestamp: now,
            accountAge: now - member.user.createdTimestamp
        });

        this.recentJoins.set(member.guild.id, guildJoins);
        this.checkRaidConditions(member.guild);
    }

    trackMessage(message) {
        if (message.author.bot) return;

        const now = Date.now();
        this.cleanOldData(now);

        const guildMessages = this.recentMessages.get(message.guild.id) || [];
        guildMessages.push({
            userId: message.author.id,
            content: message.content,
            timestamp: now
        });

        this.recentMessages.set(message.guild.id, guildMessages);
        this.analyzeMessagePatterns(message.guild);
    }

    cleanOldData(now) {
        const cutoff = now - this.options.timeWindow;
        
        for (const [guildId, joins] of this.recentJoins) {
            this.recentJoins.set(guildId, joins.filter(join => join.timestamp > cutoff));
        }
        
        for (const [guildId, messages] of this.recentMessages) {
            this.recentMessages.set(guildId, messages.filter(msg => msg.timestamp > cutoff));
        }
    }

    checkRaidConditions(guild) {
        const joins = this.recentJoins.get(guild.id) || [];
        const messages = this.recentMessages.get(guild.id) || [];

        const raidScore = this.calculateRaidScore(joins, messages);
        
        if (raidScore > 0.7) {
            this.emit('raidDetected', {
                guild,
                score: raidScore,
                joins,
                messages,
                suspiciousUsers: Array.from(this.suspiciousUsers)
            });
        }
    }

    calculateRaidScore(joins, messages) {
        const factors = {
            joinRate: joins.length / this.options.joinThreshold,
            messageRate: messages.length / this.options.messageThreshold,
            accountAges: this.analyzeAccountAges(joins),
            messagePatterns: this.analyzeMessageSimilarity(messages),
            userOverlap: this.calculateUserOverlap(joins, messages)
        };

        return Object.values(factors).reduce((a, b) => a + b, 0) / Object.keys(factors).length;
    }

    analyzeAccountAges(joins) {
        const suspiciousAge = 7 * 24 * 60 * 60 * 1000; // 7 jours
        const newAccounts = joins.filter(join => join.accountAge < suspiciousAge);
        return newAccounts.length / Math.max(1, joins.length);
    }

    analyzeMessageSimilarity(messages) {
        const contents = messages.map(m => m.content);
        let similarCount = 0;

        for (let i = 0; i < contents.length; i++) {
            for (let j = i + 1; j < contents.length; j++) {
                if (this.calculateStringSimilarity(contents[i], contents[j]) > this.options.similarityThreshold) {
                    similarCount++;
                }
            }
        }

        return similarCount / Math.max(1, (contents.length * (contents.length - 1)) / 2);
    }

    calculateStringSimilarity(str1, str2) {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        
        if (longer.length === 0) return 1.0;
        
        return (longer.length - this.editDistance(longer, shorter)) / longer.length;
    }

    editDistance(str1, str2) {
        const matrix = Array(str2.length + 1).fill().map(() => Array(str1.length + 1).fill(0));
        
        for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
        for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
        
        for (let j = 1; j <= str2.length; j++) {
            for (let i = 1; i <= str1.length; i++) {
                if (str1[i-1] === str2[j-1]) {
                    matrix[j][i] = matrix[j-1][i-1];
                } else {
                    matrix[j][i] = Math.min(
                        matrix[j-1][i-1] + 1,
                        matrix[j][i-1] + 1,
                        matrix[j-1][i] + 1
                    );
                }
            }
        }
        
        return matrix[str2.length][str1.length];
    }

    calculateUserOverlap(joins, messages) {
        const joinUsers = new Set(joins.map(j => j.userId));
        const messageUsers = new Set(messages.map(m => m.userId));
        const overlap = new Set([...joinUsers].filter(x => messageUsers.has(x)));
        
        return overlap.size / Math.max(1, Math.min(joinUsers.size, messageUsers.size));
    }

    analyzeMessagePatterns(guild) {
        const messages = this.recentMessages.get(guild.id) || [];
        const users = new Map();
        
        messages.forEach(msg => {
            if (!users.has(msg.userId)) {
                users.set(msg.userId, []);
            }
            users.get(msg.userId).push(msg);
        });

        users.forEach((userMessages, userId) => {
            if (this.detectSpamPattern(userMessages)) {
                this.suspiciousUsers.add(userId);
            }
        });
    }

    detectSpamPattern(messages) {
        if (messages.length < 5) return false;
        
        const interval = messages[messages.length - 1].timestamp - messages[0].timestamp;
        const messageRate = messages.length / (interval / 1000);
        
        return messageRate > 2;
    }
}

module.exports = RaidDetection;
