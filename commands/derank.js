const { PermissionsBitField } = require('discord.js');
const isOwner = require('../utils/isOwner');

module.exports = {
    name: 'derank',
    description: 'Retire un rôle à un utilisateur',
    permissions: 'ManageRoles',
    async execute(message, args) {
        // Vérifier uniquement les permissions du bot
        if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
            return message.reply('❌ Je n\'ai pas la permission de gérer les rôles.');
        }

        // Bypass des permissions pour les owners
        if (!isOwner(message.author.id) && !message.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
            return message.reply('❌ Vous n\'avez pas la permission de gérer les rôles.');
        }

        const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[1]);

        if (!member || !role) {
            return message.reply('❌ Usage: `+derank @utilisateur @role`');
        }

        // Vérifications de sécurité
        if (role.position >= message.guild.members.me.roles.highest.position) {
            return message.reply('❌ Je ne peux pas retirer ce rôle car il est plus haut que mon rôle le plus élevé.');
        }

        if (!isOwner(message.author.id) && role.position >= message.member.roles.highest.position) {
            return message.reply('❌ Vous ne pouvez pas retirer un rôle égal ou supérieur à votre plus haut rôle.');
        }

        // Vérifier si l'utilisateur a le rôle
        if (!member.roles.cache.has(role.id)) {
            return message.reply('❌ Cet utilisateur n\'a pas ce rôle.');
        }

        try {
            await member.roles.remove(role);
            
            const derankEmbed = {
                color: 0xFF0000,
                title: '🔄 Rôle retiré',
                fields: [
                    { name: 'Utilisateur', value: `${member.user.tag}`, inline: true },
                    { name: 'Rôle retiré', value: `${role.name}`, inline: true },
                    { name: 'Par', value: `${message.author.tag}`, inline: true }
                ],
                footer: { text: `ID de l'utilisateur: ${member.id}` },
                timestamp: new Date()
            };

            await message.reply({ embeds: [derankEmbed] });
        } catch (error) {
            console.error('Erreur lors du retrait du rôle:', error);
            message.reply('❌ Une erreur est survenue lors du retrait du rôle.');
        }
    }
};
