const { PermissionsBitField } = require('discord.js');
const isOwner = require('../utils/isOwner');

module.exports = {
    name: 'unmute',
    description: 'Retire le mute d\'un utilisateur.',
    usage: '+unmute @utilisateur',
    permissions: 'ModerateMembers',
    async execute(message, args) {
        // Vérifier uniquement les permissions du bot
        if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
            return message.reply('❌ Je n\'ai pas la permission de unmute des membres.');
        }

        // Bypass des permissions pour les owners
        if (!isOwner(message.author.id) && !message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
            return message.reply('❌ Vous n\'avez pas la permission de unmute des membres.');
        }

        const user = message.mentions.users.first();
        if (!user) {
            return message.reply('❌ Vous devez mentionner un utilisateur à unmute.');
        }

        const member = message.guild.members.cache.get(user.id);
        if (!member) {
            return message.reply('❌ Cet utilisateur n\'est pas dans le serveur.');
        }

        try {
            await member.timeout(null);
            message.reply(`✅ ${user.tag} a été unmute.`);
        } catch (error) {
            console.error('Erreur lors du unmute:', error);
            message.reply('❌ Une erreur est survenue lors du unmute.');
        }
    }
};
