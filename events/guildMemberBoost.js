const LogManager = require('../utils/logManager');

module.exports = {
    name: 'guildMemberBoost',
    async execute(member) {
        await LogManager.saveLog(member.guild.id, {
            type: 'boost',
            timestamp: new Date().toISOString(),
            user: member.user.tag,
            userId: member.user.id,
            boostCount: member.guild.premiumSubscriptionCount
        });
    }
};
