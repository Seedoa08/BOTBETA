const { PermissionsBitField } = require('discord.js');
const isOwner = require('../utils/isOwner');
const userResolver = require('../utils/userResolver');
const { readJson, writeJson } = require('../utils/fileManager');
const { sendError, sendSuccess } = require('../utils/functions');
const { logModerationAction } = require('../utils/logger');

module.exports = {
    name: 'kick',
    description: 'Expulse un utilisateur du serveur.',
    usage: '+kick @utilisateur/ID [raison]',
    permissions: 'KickMembers',
    variables: [
        { name: '@utilisateur', description: 'Mention de l\'utilisateur à expulser.' },
        { name: '[raison]', description: 'Raison de l\'expulsion (facultatif).' }
    ],
    async execute(message, args) {
        // Vérifier uniquement les permissions du bot
        if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.KickMembers)) {
            return message.reply('❌ Je n\'ai pas la permission de kick des membres.');
        }

        // Bypass des permissions pour les owners
        if (!isOwner(message.author.id) && !message.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
            return message.reply('❌ Vous n\'avez pas la permission de kick des membres.');
        }

        const userIdentifier = args[0];
        if (!userIdentifier) {
            return message.reply('❌ Vous devez mentionner un utilisateur ou fournir son ID.');
        }

        const user = await userResolver(message.client, userIdentifier);
        const reason = args.slice(1).join(' ') || 'Aucune raison fournie.';
        if (!user) {
            return message.reply('❌ Utilisateur introuvable. Vérifiez l\'ID ou la mention.');
        }

        const member = message.guild.members.cache.get(user.id);
        if (!member) {
            return message.reply('❌ Cet utilisateur n\'est pas dans le serveur.');
        }

        if (!member.kickable || member.roles.highest.position >= message.member.roles.highest.position) {
            return message.reply('❌ Vous ne pouvez pas expulser cet utilisateur. Vérifiez vos permissions ou le rôle de l\'utilisateur.');
        }

        try {
            const confirmationMessage = await message.reply(`⚠️ Êtes-vous sûr de vouloir expulser ${user.tag} ? Répondez par \`oui\` ou \`non\`.`);
            const filter = response => response.author.id === message.author.id && ['oui', 'non'].includes(response.content.toLowerCase());
            const collected = await message.channel.awaitMessages({ filter, max: 1, time: 15000 });

            if (!collected.size || collected.first().content.toLowerCase() === 'non') {
                return message.reply('❌ Expulsion annulée.');
            }

            await member.kick(reason);
            await logModerationAction(message.guild, message.author, user, reason, 'kick');
            message.reply(`✅ ${user.tag} a été expulsé. Raison: ${reason}`);
        } catch (error) {
            console.error('Erreur lors de l\'expulsion:', error);
            await sendError(message, 'Une erreur est survenue lors de l\'expulsion.');
        }
    }
};
