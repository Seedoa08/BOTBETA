const { PermissionsBitField } = require('discord.js');
const isOwner = require('../utils/isOwner');

module.exports = {
    name: 'unlock',
    description: 'Déverrouille un canal',
    usage: '+unlock [#canal]',
    category: 'Modération',
    permissions: 'ManageChannels',
    variables: [],
    async execute(message) {
        // Bypass des permissions pour les owners
        if (!isOwner(message.author.id) && !message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
            return message.reply('❌ Vous n\'avez pas la permission de déverrouiller les canaux.');
        }

        const channel = message.channel;

        if (!channel.permissionsFor(message.guild.members.me).has(PermissionsBitField.Flags.ManageChannels)) {
            return message.reply('❌ Je n\'ai pas la permission de gérer les permissions de ce canal.');
        }

        const currentPermissions = channel.permissionsFor(channel.guild.roles.everyone);
        if (currentPermissions.has(PermissionsBitField.Flags.SendMessages)) {
            return message.reply('❌ Ce canal est déjà déverrouillé.');
        }

        try {
            // Vérifiez si le canal est déjà déverrouillé pour tous les rôles
            const isFullyUnlocked = channel.permissionOverwrites.cache.every(overwrite =>
                !overwrite.deny.has(PermissionsBitField.Flags.SendMessages)
            );

            if (isFullyUnlocked) {
                return message.reply('❌ Ce canal est déjà complètement déverrouillé.');
            }

            // Appliquez les permissions pour déverrouiller le canal
            await channel.permissionOverwrites.edit(channel.guild.roles.everyone, { SendMessages: true });

            const unlockEmbed = {
                color: 0x00ff00,
                description: '🔓 Le canal a été déverrouillé avec succès.'
            };
            message.channel.send({ embeds: [unlockEmbed] });
        } catch (error) {
            console.error('Erreur lors du déverrouillage du canal:', error);
            message.reply('❌ Une erreur est survenue lors du déverrouillage du canal.');
        }
    }
};
