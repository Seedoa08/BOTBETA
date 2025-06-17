const { PermissionsBitField } = require('discord.js');
const isOwner = require('../utils/isOwner');
const { readJson, writeJson } = require('../utils/fileManager');
const { sendError, sendSuccess } = require('../utils/functions');
const { logModerationAction } = require('../utils/logger');

module.exports = {
    name: 'ban',
    description: 'Bannit un utilisateur du serveur',
    usage: '+ban @utilisateur/ID [raison] [--silent] [--del [jours]]',
    permissions: 'BanMembers',
    variables: [
        { name: '@utilisateur', description: 'Mention de l\'utilisateur à bannir.' },
        { name: '[raison]', description: 'Raison du bannissement (facultatif).' },
        { name: '--silent', description: 'Bannir silencieusement sans message dans le salon.' },
        { name: '--del [jours]', description: 'Supprimer les messages des X derniers jours (1-7).' }
    ],
    async execute(message, args) {
        // Vérifier uniquement les permissions du bot
        if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.BanMembers)) {
            return message.reply('❌ Je n\'ai pas la permission de bannir des membres.');
        }

        // Bypass des permissions pour les owners
        if (!isOwner(message.author.id) && !message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
            return message.reply('❌ Vous n\'avez pas la permission de bannir des membres.');
        }

        const silentFlag = args.includes('--silent');
        const delDays = args.find(arg => arg.startsWith('--del'));
        const deleteMessageDays = delDays ? Math.min(7, Math.max(0, parseInt(delDays.split(' ')[1]) || 0)) : 0;

        args = args.filter(arg => !arg.startsWith('--'));

        const userIdentifier = args[0];
        if (!userIdentifier) {
            return message.reply('❌ Vous devez mentionner un utilisateur ou fournir son ID.');
        }

        const user = await userResolver(message.client, userIdentifier);
        
        // Vérifier si l'utilisateur ciblé est un owner
        if (isOwner(user.id)) {
            return message.reply('❌ Vous ne pouvez pas bannir un owner du bot.');
        }

        if (user.id === message.author.id) {
            return message.reply('❌ Vous ne pouvez pas vous bannir vous-même.');
        }

        if (user.id === message.guild.ownerId) {
            return message.reply('❌ Vous ne pouvez pas bannir le propriétaire du serveur.');
        }

        if (user.id === message.client.user.id) {
            return message.reply('❌ Vous ne pouvez pas bannir le bot.');
        }

        const reason = args.slice(1).join(' ') || 'Aucune raison fournie.';
        const member = message.guild.members.cache.get(user.id);
        if (!member) {
            return message.reply('❌ Cet utilisateur n\'est pas dans le serveur.');
        }

        if (!member.bannable || member.roles.highest.position >= message.member.roles.highest.position) {
            return message.reply('❌ Vous ne pouvez pas bannir cet utilisateur. Vérifiez vos permissions ou le rôle de l\'utilisateur.');
        }

        const isBanned = await message.guild.bans.fetch(user.id).catch(() => null);
        if (isBanned) {
            return message.reply('❌ Cet utilisateur est déjà banni.');
        }

        try {
            const confirmationMessage = await message.reply(`⚠️ Êtes-vous sûr de vouloir bannir ${user.tag} ? Répondez par \`oui\` ou \`non\`.`);
            const filter = response => response.author.id === message.author.id && ['oui', 'non'].includes(response.content.toLowerCase());
            const collected = await message.channel.awaitMessages({ filter, max: 1, time: 15000 });

            if (!collected.size || collected.first().content.toLowerCase() === 'non') {
                return message.reply('❌ Bannissement annulé.');
            }

            await member.ban({
                reason,
                deleteMessageDays
            });

            if (!silentFlag) {
                const banEmbed = {
                    color: 0xff0000,
                    title: '🔨 Bannissement',
                    fields: [
                        { name: 'Utilisateur', value: user.tag, inline: true },
                        { name: 'ID', value: user.id, inline: true },
                        { name: 'Raison', value: reason },
                        { name: 'Messages supprimés', value: `${deleteMessageDays} jours` }
                    ],
                    footer: { text: `Modérateur: ${message.author.tag}` },
                    timestamp: new Date()
                };
                await message.channel.send({ embeds: [banEmbed] });
            }

            // Enregistrer dans les logs
            const logs = readJson(logsFile) || [];
            logs.push({
                action: 'ban',
                user: { id: user.id, tag: user.tag },
                moderator: { id: message.author.id, tag: message.author.tag },
                reason,
                date: new Date().toISOString()
            });
            writeJson(logsFile, logs);

            await logModerationAction(message.guild, 'ban', user.id, message.author.id, reason);
        } catch (error) {
            console.error('Erreur lors du bannissement:', error);
            message.reply('❌ Une erreur est survenue lors du bannissement.');
        }
    }
};
