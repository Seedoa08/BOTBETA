const { Events } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { logAction, logError } = require('../utils/functions');

// Définir les chemins des fichiers
const dataPath = path.join(__dirname, '../data');
const statsFile = path.join(dataPath, 'modstats.json');

// Fonction pour charger les statistiques
function loadStats() {
    try {
        if (!fs.existsSync(statsFile)) {
            return {
                guilds: {},
                settings: {
                    logChannel: null,
                    notifyAdmins: true,
                    adminRoles: [],
                    quickActions: {
                        clear: { amount: 100 },
                        mute: { duration: 3600000 },
                        slowmode: { duration: 30 }
                    }
                }
            };
        }
        return JSON.parse(fs.readFileSync(statsFile, 'utf8'));
    } catch (error) {
        logError('modpanel', error);
        return {
            guilds: {},
            settings: {
                logChannel: null,
                notifyAdmins: true,
                adminRoles: [],
                quickActions: {
                    clear: { amount: 100 },
                    mute: { duration: 3600000 },
                    slowmode: { duration: 30 }
                }
            }
        };
    }
}

// Fonction pour sauvegarder les statistiques
function saveStats(stats) {
    try {
        fs.writeFileSync(statsFile, JSON.stringify(stats, null, 4));
    } catch (error) {
        logError('modpanel', error);
    }
}

// Fonction pour mettre à jour les statistiques
function updateStats(guildId, action, moderatorId) {
    const stats = loadStats();
    if (!stats.guilds[guildId]) {
        stats.guilds[guildId] = {
            bans: 0,
            kicks: 0,
            mutes: 0,
            warns: 0,
            clears: 0,
            raids: 0,
            lastAction: null
        };
    }

    switch (action) {
        case 'ban':
            stats.guilds[guildId].bans++;
            break;
        case 'kick':
            stats.guilds[guildId].kicks++;
            break;
        case 'mute':
            stats.guilds[guildId].mutes++;
            break;
        case 'warn':
            stats.guilds[guildId].warns++;
            break;
        case 'clear':
            stats.guilds[guildId].clears++;
            break;
        case 'raid':
            stats.guilds[guildId].raids++;
            break;
    }

    stats.guilds[guildId].lastAction = {
        type: action,
        moderator: moderatorId,
        date: new Date().toISOString()
    };

    saveStats(stats);
}

module.exports = {
    name: Events.ClientReady,
    once: true,
    execute(client) {
        // Événement de ban
        client.on(Events.GuildBanAdd, (ban) => {
            updateStats(ban.guild.id, 'ban', ban.executor?.id || 'Unknown');
        });

        // Événement de kick
        client.on(Events.GuildMemberRemove, async (member) => {
            const auditLogs = await member.guild.fetchAuditLogs({
                type: 'MEMBER_KICK',
                limit: 1
            });
            const kickLog = auditLogs.entries.first();
            if (kickLog && kickLog.target.id === member.id) {
                updateStats(member.guild.id, 'kick', kickLog.executor.id);
            }
        });

        // Événement de mute
        client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
            if (oldMember.roles.cache.size < newMember.roles.cache.size) {
                const addedRole = newMember.roles.cache.find(role => !oldMember.roles.cache.has(role.id));
                if (addedRole.name.toLowerCase().includes('mute')) {
                    const auditLogs = await newMember.guild.fetchAuditLogs({
                        type: 'MEMBER_ROLE_UPDATE',
                        limit: 1
                    });
                    const muteLog = auditLogs.entries.first();
                    if (muteLog && muteLog.target.id === newMember.id) {
                        updateStats(newMember.guild.id, 'mute', muteLog.executor.id);
                    }
                }
            }
        });

        // Événement de warn
        client.on('warn', (guild, user, moderator) => {
            updateStats(guild.id, 'warn', moderator.id);
        });

        // Événement de clear
        client.on('clear', (guild, moderator, amount) => {
            updateStats(guild.id, 'clear', moderator.id);
        });

        // Événement de raid
        client.on('raid', (guild, moderator) => {
            updateStats(guild.id, 'raid', moderator.id);
        });

        // Log de démarrage
        logAction('modpanel', {
            action: 'startup',
            message: 'Module de statistiques de modération démarré'
        });
    }
}; 