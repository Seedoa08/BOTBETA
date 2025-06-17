const { PermissionsBitField } = require('discord.js');
const isOwner = require('../utils/isOwner');

module.exports = {
    name: 'tempmute',
    description: 'Mute temporairement un utilisateur',
    usage: '+tempmute @utilisateur [durée] [raison]',
    permissions: 'ModerateMembers',
    variables: [
        { name: '@utilisateur', description: 'Mention de l\'utilisateur à mute.' },
        { name: '[durée]', description: 'Durée du mute (exemple: `10m`, `1h`).' },
        { name: '[raison]', description: 'Raison du mute (facultatif).' }
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

        const user = message.mentions.users.first();
        const duration = args[1];
        const reason = args.slice(2).join(' ') || 'Aucune raison fournie.';
        if (!user) {
            return message.reply('❌ Vous devez mentionner un utilisateur à mute.');
        }

        const member = message.guild.members.cache.get(user.id);
        if (!member) {
            return message.reply('❌ Cet utilisateur n\'est pas dans le serveur.');
        }

        if (!member.moderatable || member.roles.highest.position >= message.member.roles.highest.position) {
            return message.reply('❌ Vous ne pouvez pas mute cet utilisateur. Vérifiez vos permissions ou le rôle de l\'utilisateur.');
        }

        const durationMs = ms(duration);
        if (!duration || isNaN(durationMs)) {
            return message.reply('❌ Durée invalide ou manquante! Exemple: `10m`, `1h`.');
        }

        try {
            await member.timeout(durationMs, reason);
            message.reply(`✅ ${user.tag} a été temporairement mute pour ${ms(durationMs, { long: true })}. Raison: ${reason}`);
        } catch (error) {
            console.error('Erreur lors du mute temporaire:', error);
            message.reply('❌ Une erreur est survenue lors du mute temporaire.');
        }
    }
};
