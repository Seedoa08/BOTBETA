const { PermissionsBitField } = require('discord.js');
const { readJson, writeJson } = require('../utils/fileManager');
const { sendError, sendSuccess } = require('../utils/functions');
const { logModerationAction } = require('../utils/logger');
const ms = require('ms');
const path = require('path');
const fs = require('fs');
const isOwner = require('../utils/isOwner');
const userResolver = require('../utils/userResolver');

// Définir les chemins des fichiers
const dataPath = path.join(__dirname, '../data');
const muteHistoryFile = path.join(dataPath, 'muteHistory.json');
const logsFile = path.join(dataPath, 'moderation-logs.json');

// Créer le dossier data s'il n'existe pas
if (!fs.existsSync(dataPath)) {
    fs.mkdirSync(dataPath, { recursive: true });
}

// Initialiser ou charger l'historique des mutes
const muteHistory = fs.existsSync(muteHistoryFile) 
    ? JSON.parse(fs.readFileSync(muteHistoryFile))
    : {};

module.exports = {
    name: 'mute',
    description: 'Mute un utilisateur avec système progressif.',
    usage: '+mute @utilisateur/ID [durée] [raison]',
    permissions: 'ModerateMembers',
    variables: [
        { name: '@utilisateur', description: 'Mention de l\'utilisateur à mute.' },
        { name: '[durée]', description: 'Durée du mute (ex: 10m, 1h, 1d)' },
        { name: '[raison]', description: 'Raison du mute (facultatif).' },
        { name: '--notify', description: 'Envoie un DM à l\'utilisateur' },
        { name: '--silent', description: 'Mute silencieusement' }
    ],
    async execute(message, args) {
        // Vérifier uniquement les permissions du bot
        if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
            return message.reply('❌ Je n\'ai pas la permission de mute des membres.');
        }

        // Bypass des permissions pour les owners
        if (!isOwner(message.author.id) && !message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
            return message.reply('❌ Vous n\'avez pas la permission de mute des membres.');
        }

        const userIdentifier = args[0];
        if (!userIdentifier) {
            return message.reply('❌ Vous devez mentionner un utilisateur ou fournir son ID.');
        }

        const user = await userResolver(message.client, userIdentifier);
        if (!user) {
            return message.reply('❌ Utilisateur introuvable.');
        }
        
        // Vérifier si l'utilisateur ciblé est un owner
        if (isOwner(user.id)) {
            return message.reply('❌ Vous ne pouvez pas mute un owner du bot.');
        }

        if (user.id === message.guild.ownerId) {
            return message.reply('❌ Vous ne pouvez pas mute le propriétaire du serveur.');
        }

        if (user.id === message.client.user.id) {
            return message.reply('❌ Vous ne pouvez pas mute le bot.');
        }

        const notify = args.includes('--notify');
        const silent = args.includes('--silent');
        args = args.filter(arg => !arg.startsWith('--'));

        const duration = args[1];
        const reason = args.slice(2).join(' ') || 'Aucune raison fournie.';

        const member = message.guild.members.cache.get(user.id);
        if (!member) {
            return message.reply('❌ Cet utilisateur n\'est pas dans le serveur.');
        }

        // Vérifier si le bot peut mute cet utilisateur
        if (!member.moderatable || member.roles.highest.position >= message.guild.members.me.roles.highest.position) {
            return message.reply('❌ Je ne peux pas mute cet utilisateur. Vérifiez que mon rôle est au-dessus de celui de l\'utilisateur.');
        }

        if (member.communicationDisabledUntilTimestamp && member.communicationDisabledUntilTimestamp > Date.now()) {
            return message.reply('❌ Cet utilisateur est déjà mute.');
        }

        const durationMs = ms(duration);
        if (isNaN(durationMs)) {
            return message.reply('❌ Durée invalide! Exemple: `10m`, `1h`.');
        }

        try {
            // Initialiser l'historique pour cet utilisateur s'il n'existe pas
            if (!muteHistory[user.id]) {
                muteHistory[user.id] = { count: 0, lastMute: null };
            }

            const userHistory = muteHistory[user.id];
            const baseDuration = ms('1h');
            const multiplier = Math.pow(2, userHistory.count);
            const finalDuration = durationMs || (baseDuration * multiplier);

            userHistory.count++;
            userHistory.lastMute = Date.now();

            // Sauvegarder l'historique mis à jour
            fs.writeFileSync(muteHistoryFile, JSON.stringify(muteHistory, null, 4));

            await member.timeout(finalDuration, reason);

            if (notify) {
                try {
                    const dmEmbed = {
                        color: 0xff9900,
                        title: `Vous avez été mute sur ${message.guild.name}`,
                        fields: [
                            { name: 'Durée', value: ms(finalDuration, { long: true }) },
                            { name: 'Raison', value: reason }
                        ],
                        timestamp: new Date()
                    };
                    await user.send({ embeds: [dmEmbed] });
                } catch (err) {
                    message.channel.send('⚠️ Impossible d\'envoyer un DM à l\'utilisateur');
                }
            }

            if (!silent) {
                const muteEmbed = {
                    color: 0xff9900,
                    title: '🔇 Utilisateur mute',
                    fields: [
                        { name: 'Utilisateur', value: user.tag },
                        { name: 'Durée', value: ms(finalDuration, { long: true }) },
                        { name: 'Raison', value: reason }
                    ],
                    footer: { text: `Modérateur: ${message.author.tag}` },
                    timestamp: new Date()
                };
                message.channel.send({ embeds: [muteEmbed] });
            }

            // Enregistrer dans les logs
            const logs = fs.existsSync(logsFile) ? JSON.parse(fs.readFileSync(logsFile, 'utf8')) : [];
            logs.push({
                action: 'mute',
                user: { id: user.id, tag: user.tag },
                moderator: { id: message.author.id, tag: message.author.tag },
                reason,
                duration: ms(finalDuration, { long: true }),
                date: new Date().toISOString()
            });
            fs.writeFileSync(logsFile, JSON.stringify(logs, null, 4));
        } catch (error) {
            console.error('Erreur lors du mute:', error);
            message.reply('❌ Une erreur est survenue lors du mute.');
        }
    }
};
