const { Events, AuditLogEvent } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../config/config');
const { createModerationEmbed, logAction, logError } = require('../utils/functions');

const raidConfigPath = path.join(__dirname, '../config/raid.json');

// Charger la configuration
const loadConfig = () => {
    if (fs.existsSync(raidConfigPath)) {
        return JSON.parse(fs.readFileSync(raidConfigPath));
    }
    return null;
};

// Vérifier si un utilisateur est dans la whitelist
const isWhitelisted = (member, raidConfig) => {
    if (!raidConfig || !raidConfig.whitelist) return false;
    
    return (
        raidConfig.whitelist.users.includes(member.id) ||
        raidConfig.whitelist.roles.some(roleId => member.roles.cache.has(roleId))
    );
};

// Vérifier si un salon est dans la whitelist
const isChannelWhitelisted = (channel, raidConfig) => {
    if (!raidConfig || !raidConfig.whitelist) return false;
    return raidConfig.whitelist.channels.includes(channel.id);
};

// Gérer les actions suspectes
const handleSuspiciousAction = async (guild, member, action, details) => {
    const raidConfig = loadConfig();
    if (!raidConfig || !raidConfig.enabled) return;

    // Vérifier la whitelist
    if (isWhitelisted(member, raidConfig)) return;

    // Créer l'embed de notification
    const embed = createModerationEmbed('🚨 Action suspecte détectée', [
        {
            name: 'Action',
            value: action
        },
        {
            name: 'Utilisateur',
            value: `${member.user.tag} (${member.id})`
        },
        {
            name: 'Détails',
            value: details
        }
    ]);

    // Envoyer la notification
    if (raidConfig.logChannel) {
        const logChannel = guild.channels.cache.get(raidConfig.logChannel);
        if (logChannel) {
            await logChannel.send({ embeds: [embed] });
        }
    }

    // Appliquer les actions configurées
    if (raidConfig.punishments.notify) {
        try {
            await member.send(`⚠️ Une action suspecte a été détectée sur le serveur ${guild.name}. Si ce n'était pas vous, veuillez contacter un administrateur.`);
        } catch (error) {
            logError('raid', error);
        }
    }

    // Log de l'action
    logAction('raid', {
        guildId: guild.id,
        userId: member.id,
        action,
        details
    });
};

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member) {
        try {
            const raidConfig = loadConfig();
            if (!raidConfig || !raidConfig.enabled) return;

            // Vérifier la whitelist
            if (isWhitelisted(member, raidConfig)) return;

            // Vérifier l'âge du compte
            if (raidConfig.protection.accountAge) {
                const accountAge = Date.now() - member.user.createdTimestamp;
                const minAge = raidConfig.protection.accountAge * 24 * 60 * 60 * 1000;
                if (accountAge < minAge) {
                    await handleSuspiciousAction(
                        member.guild,
                        member,
                        'Compte trop récent',
                        `Âge du compte: ${Math.floor(accountAge / (24 * 60 * 60 * 1000))} jours`
                    );
                    if (raidConfig.punishments.type === 'kick') {
                        await member.kick('Protection anti-raid: Compte trop récent');
                    } else if (raidConfig.punishments.type === 'ban') {
                        await member.ban({ reason: 'Protection anti-raid: Compte trop récent' });
                    }
                    return;
                }
            }

            // Vérifier l'avatar
            if (raidConfig.protection.avatarRequired && !member.user.avatar) {
                await handleSuspiciousAction(
                    member.guild,
                    member,
                    'Pas d\'avatar',
                    'L\'utilisateur n\'a pas d\'avatar'
                );
                if (raidConfig.punishments.type === 'kick') {
                    await member.kick('Protection anti-raid: Pas d\'avatar');
                } else if (raidConfig.punishments.type === 'ban') {
                    await member.ban({ reason: 'Protection anti-raid: Pas d\'avatar' });
                }
                return;
            }

        } catch (error) {
            logError('raid', error);
        }
    }
};

// Surveiller les suppressions de salons
module.exports.channelDelete = {
    name: Events.ChannelDelete,
    async execute(channel) {
        try {
            const raidConfig = loadConfig();
            if (!raidConfig || !raidConfig.enabled || !raidConfig.protection.channelDelete) return;

            // Vérifier la whitelist
            if (isChannelWhitelisted(channel, raidConfig)) return;

            // Récupérer l'audit log
            const auditLogs = await channel.guild.fetchAuditLogs({
                type: AuditLogEvent.ChannelDelete,
                limit: 1
            });

            const deleteLog = auditLogs.entries.first();
            if (!deleteLog) return;

            const { executor } = deleteLog;
            if (!executor) return;

            const member = await channel.guild.members.fetch(executor.id).catch(() => null);
            if (!member) return;

            await handleSuspiciousAction(
                channel.guild,
                member,
                'Suppression de salon',
                `Salon: ${channel.name} (${channel.id})`
            );

            // Appliquer les actions configurées
            if (raidConfig.punishments.type === 'kick') {
                await member.kick('Protection anti-raid: Suppression de salon');
            } else if (raidConfig.punishments.type === 'ban') {
                await member.ban({ reason: 'Protection anti-raid: Suppression de salon' });
            }

        } catch (error) {
            logError('raid', error);
        }
    }
};

// Surveiller les suppressions de rôles
module.exports.roleDelete = {
    name: Events.GuildRoleDelete,
    async execute(role) {
        try {
            const raidConfig = loadConfig();
            if (!raidConfig || !raidConfig.enabled || !raidConfig.protection.roleDelete) return;

            // Récupérer l'audit log
            const auditLogs = await role.guild.fetchAuditLogs({
                type: AuditLogEvent.RoleDelete,
                limit: 1
            });

            const deleteLog = auditLogs.entries.first();
            if (!deleteLog) return;

            const { executor } = deleteLog;
            if (!executor) return;

            const member = await role.guild.members.fetch(executor.id).catch(() => null);
            if (!member) return;

            // Vérifier la whitelist
            if (isWhitelisted(member, raidConfig)) return;

            await handleSuspiciousAction(
                role.guild,
                member,
                'Suppression de rôle',
                `Rôle: ${role.name} (${role.id})`
            );

            // Appliquer les actions configurées
            if (raidConfig.punishments.type === 'kick') {
                await member.kick('Protection anti-raid: Suppression de rôle');
            } else if (raidConfig.punishments.type === 'ban') {
                await member.ban({ reason: 'Protection anti-raid: Suppression de rôle' });
            }

        } catch (error) {
            logError('raid', error);
        }
    }
};

// Surveiller les créations de webhooks
module.exports.webhookCreate = {
    name: Events.WebhooksUpdate,
    async execute(channel) {
        try {
            const raidConfig = loadConfig();
            if (!raidConfig || !raidConfig.enabled || !raidConfig.protection.webhookCreate) return;

            // Vérifier la whitelist
            if (isChannelWhitelisted(channel, raidConfig)) return;

            // Récupérer l'audit log
            const auditLogs = await channel.guild.fetchAuditLogs({
                type: AuditLogEvent.WebhookCreate,
                limit: 1
            });

            const createLog = auditLogs.entries.first();
            if (!createLog) return;

            const { executor } = createLog;
            if (!executor) return;

            const member = await channel.guild.members.fetch(executor.id).catch(() => null);
            if (!member) return;

            // Vérifier la whitelist
            if (isWhitelisted(member, raidConfig)) return;

            await handleSuspiciousAction(
                channel.guild,
                member,
                'Création de webhook',
                `Salon: ${channel.name} (${channel.id})`
            );

            // Supprimer le webhook
            const webhooks = await channel.fetchWebhooks();
            webhooks.forEach(webhook => webhook.delete().catch(() => {}));

            // Appliquer les actions configurées
            if (raidConfig.punishments.type === 'kick') {
                await member.kick('Protection anti-raid: Création de webhook');
            } else if (raidConfig.punishments.type === 'ban') {
                await member.ban({ reason: 'Protection anti-raid: Création de webhook' });
            }

        } catch (error) {
            logError('raid', error);
        }
    }
}; 