const { Events, PermissionsBitField } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../config/config');
const { checkPermissions, createModerationEmbed, logAction, logError } = require('../utils/functions');

const configPath = path.join(__dirname, '../config');
const automodFile = path.join(configPath, 'automod.json');

// Charger la configuration AutoMod
const loadConfig = () => {
    if (fs.existsSync(automodFile)) {
        return JSON.parse(fs.readFileSync(automodFile));
    }
    return null;
};

// Vérifier si un utilisateur est dans la whitelist
const isWhitelisted = (member, automodConfig) => {
    if (!automodConfig || !automodConfig.whitelist) return false;
    
    return (
        automodConfig.whitelist.users.includes(member.id) ||
        automodConfig.whitelist.roles.some(roleId => member.roles.cache.has(roleId)) ||
        automodConfig.whitelist.channels.includes(member.voice.channelId)
    );
};

// Vérifier les filtres de contenu
const checkContent = (message, automodConfig) => {
    const content = message.content.toLowerCase();
    const violations = [];

    // Vérifier les mentions
    if (automodConfig.filters.mentions) {
        const mentionCount = (content.match(/@/g) || []).length;
        if (mentionCount > automodConfig.thresholds.mentions) {
            violations.push('mentions');
        }
    }

    // Vérifier les majuscules
    if (automodConfig.filters.caps) {
        const capsCount = (content.match(/[A-Z]/g) || []).length;
        const totalChars = content.length;
        if (totalChars > 0 && (capsCount / totalChars) * 100 > automodConfig.thresholds.caps) {
            violations.push('caps');
        }
    }

    // Vérifier les liens
    if (automodConfig.filters.links) {
        const linkCount = (content.match(/https?:\/\/[^\s]+/g) || []).length;
        if (linkCount > automodConfig.thresholds.links) {
            violations.push('links');
        }
    }

    // Vérifier les invitations Discord
    if (automodConfig.filters.invites) {
        const inviteCount = (content.match(/discord\.gg\/[^\s]+/g) || []).length;
        if (inviteCount > automodConfig.thresholds.invites) {
            violations.push('invites');
        }
    }

    return violations;
};

// Appliquer les actions
const applyActions = async (message, violations, automodConfig) => {
    const member = message.member;
    const guild = message.guild;

    // Supprimer le message si configuré
    if (automodConfig.actions.delete) {
        await message.delete().catch(() => {});
    }

    // Créer l'embed de notification
    const embed = createModerationEmbed('🚫 AutoMod', [
        {
            name: 'Violations détectées',
            value: violations.map(v => `- ${v}`).join('\n')
        },
        {
            name: 'Message',
            value: message.content.length > 1024 ? 
                message.content.substring(0, 1021) + '...' : 
                message.content
        }
    ]);

    // Envoyer la notification
    if (automodConfig.logChannel) {
        const logChannel = guild.channels.cache.get(automodConfig.logChannel);
        if (logChannel) {
            await logChannel.send({ embeds: [embed] });
        }
    }

    // Appliquer les actions en fonction des violations
    if (automodConfig.actions.warn) {
        // TODO: Implémenter le système d'avertissements
    }

    if (automodConfig.actions.mute && violations.length >= automodConfig.punishments.mute) {
        try {
            await member.timeout(ms(automodConfig.muteTime), 'AutoMod: Violations multiples');
        } catch (error) {
            logError('automod', error);
        }
    }

    if (automodConfig.actions.kick && violations.length >= automodConfig.punishments.kick) {
        try {
            await member.kick('AutoMod: Violations multiples');
        } catch (error) {
            logError('automod', error);
        }
    }

    if (automodConfig.actions.ban && violations.length >= automodConfig.punishments.ban) {
        try {
            await member.ban({ reason: 'AutoMod: Violations multiples' });
        } catch (error) {
            logError('automod', error);
        }
    }

    // Log de l'action
    logAction('automod', {
        guildId: guild.id,
        userId: member.id,
        violations,
        actions: automodConfig.actions
    });
};

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        try {
            // Ignorer les messages des bots et les DMs
            if (message.author.bot || !message.guild) return;

            // Charger la configuration
            const automodConfig = loadConfig();
            if (!automodConfig || !automodConfig.enabled) return;

            // Vérifier la whitelist
            if (isWhitelisted(message.member, automodConfig)) return;

            // Vérifier les filtres
            const violations = checkContent(message, automodConfig);
            if (violations.length > 0) {
                await applyActions(message, violations, automodConfig);
            }

        } catch (error) {
            logError('automod', error);
        }
    }
}; 