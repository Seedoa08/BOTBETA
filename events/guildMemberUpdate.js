const LogManager = require('../utils/logManager');

module.exports = {
    name: 'guildMemberUpdate',
    async execute(oldMember, newMember) {
        // Changement de rôles
        const addedRoles = newMember.roles.cache.filter(role => !oldMember.roles.cache.has(role.id));
        const removedRoles = oldMember.roles.cache.filter(role => !newMember.roles.cache.has(role.id));

        for (const [_, role] of addedRoles) {
            await LogManager.saveLog(newMember.guild.id, {
                type: 'role_update',
                timestamp: new Date().toISOString(),
                user: newMember.user.tag,
                userId: newMember.user.id,
                role: role.name,
                roleId: role.id,
                action: 'ajout'
            });
        }

        for (const [_, role] of removedRoles) {
            await LogManager.saveLog(newMember.guild.id, {
                type: 'role_update',
                timestamp: new Date().toISOString(),
                user: newMember.user.tag,
                action: 'a perdu',
                role: role.name
            });
        }

        // Changement de pseudo
        if (oldMember.nickname !== newMember.nickname) {
            await LogManager.saveLog(newMember.guild.id, {
                type: 'nickname_update',
                timestamp: new Date().toISOString(),
                user: newMember.user.tag,
                userId: newMember.user.id,
                oldName: oldMember.nickname || oldMember.user.username,
                newName: newMember.nickname || newMember.user.username
            });
        }
    }
};
