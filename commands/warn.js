const { PermissionsBitField } = require('discord.js');
const { readJson, writeJson } = require('../utils/fileManager');
const { sendError, sendSuccess } = require('../utils/functions');
const { logModerationAction } = require('../utils/logger');
const path = require('path');
const fs = require('fs');
const isOwner = require('../utils/isOwner');
const config = require('../config.json');

// Définir les chemins des fichiers
const dataPath = path.join(__dirname, '../data');
const warningsFile = path.join(dataPath, 'warnings.json');

// Créer le dossier data s'il n'existe pas
if (!fs.existsSync(dataPath)) {
    fs.mkdirSync(dataPath, { recursive: true });
}

// Initialiser le fichier warnings s'il n'existe pas
if (!fs.existsSync(warningsFile)) {
    fs.writeFileSync(warningsFile, JSON.stringify({}), 'utf8');
}

module.exports = {
    name: 'warn',
    description: 'Donne un avertissement à un utilisateur',
    usage: '+warn <@utilisateur> [raison]',
    permissions: 'ManageMessages',
    async execute(message, args) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            return sendError(message, 'Vous n\'avez pas la permission d\'utiliser cette commande.');
        }
        const user = message.mentions.users.first();
        if (!user) return sendError(message, 'Veuillez mentionner un utilisateur.');
        const reason = args.slice(1).join(' ') || 'Aucune raison spécifiée';
        const warningsPath = path.join(__dirname, '../data/warnings.json');
        const warnings = readJson(warningsPath, '{}');
        warnings[user.id] = (warnings[user.id] || []).concat({ reason, moderator: message.author.id, date: new Date().toISOString() });
        writeJson(warningsPath, warnings);
        await sendSuccess(message, `${user.tag} a été averti. Raison: ${reason}`);
        await logModerationAction(message.guild, message.author, user, 'warn', reason);

        // Système d'avertissements progressif
        const warnCount = warnings[user.id].length;
        const thresholds = config.warnThresholds || { mute: 3, kick: 5, ban: 7, muteDuration: 3600000 };
        if (warnCount === thresholds.mute) {
            // Mute automatique
            const member = message.guild.members.cache.get(user.id);
            if (member && member.moderatable) {
                try {
                    await member.timeout(thresholds.muteDuration, `A atteint ${thresholds.mute} warns`);
                    await sendSuccess(message, `${user.tag} a été automatiquement mute (${thresholds.muteDuration / 60000} min) pour accumulation d'avertissements.`);
                    await logModerationAction(message.guild, message.author, user, 'auto-mute', `A atteint ${thresholds.mute} warns`);
                } catch (e) {
                    await sendError(message, `Impossible de mute automatiquement ${user.tag}.`);
                }
            }
        } else if (warnCount === thresholds.kick) {
            // Kick automatique
            const member = message.guild.members.cache.get(user.id);
            if (member && member.kickable) {
                try {
                    await member.kick(`A atteint ${thresholds.kick} warns`);
                    await sendSuccess(message, `${user.tag} a été automatiquement kick pour accumulation d'avertissements.`);
                    await logModerationAction(message.guild, message.author, user, 'auto-kick', `A atteint ${thresholds.kick} warns`);
                } catch (e) {
                    await sendError(message, `Impossible de kick automatiquement ${user.tag}.`);
                }
            }
        } else if (warnCount === thresholds.ban) {
            // Ban automatique
            const member = message.guild.members.cache.get(user.id);
            if (member && member.bannable) {
                try {
                    await member.ban({ reason: `A atteint ${thresholds.ban} warns` });
                    await sendSuccess(message, `${user.tag} a été automatiquement banni pour accumulation d'avertissements.`);
                    await logModerationAction(message.guild, message.author, user, 'auto-ban', `A atteint ${thresholds.ban} warns`);
                } catch (e) {
                    await sendError(message, `Impossible de bannir automatiquement ${user.tag}.`);
                }
            }
        }
    }
};
