const { PermissionsBitField, ChannelType } = require('discord.js');
const isOwner = require('../utils/isOwner');

module.exports = {
    name: 'lock',
    description: 'Verrouille un canal',
    usage: '+lock [#canal] [raison]',
    category: 'Modération',
    async execute(message, args) {
        // Bypass des permissions pour les owners
        if (!isOwner(message.author.id) && !message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
            return message.reply('❌ Vous n\'avez pas la permission de verrouiller les salons.');
        }

        const channel = message.channel;

        // Vérifier si le bot a les permissions nécessaires
        if (!channel.permissionsFor(message.guild.members.me).has(PermissionsBitField.Flags.ManageChannels)) {
            return message.reply('❌ Je n\'ai pas la permission de gérer les permissions de ce canal.');
        }

        try {
            // Désactiver SendMessages pour @everyone
            await channel.permissionOverwrites.edit(message.guild.roles.everyone.id, {
                SendMessages: false,
                SendMessagesInThreads: false,
                CreatePublicThreads: false,
                CreatePrivateThreads: false
            });

            // Si c'est un salon vocal/stage, désactiver aussi Connect et Speak
            if (channel.type === ChannelType.GuildVoice || channel.type === ChannelType.GuildStageVoice) {
                await channel.permissionOverwrites.edit(message.guild.roles.everyone.id, {
                    Connect: false,
                    Speak: false
                });
            }

            // Message de confirmation
            const lockMessage = args.join(' ') || '🔒 Ce salon a été verrouillé.';
            const lockEmbed = {
                color: 0xff0000,
                title: '🔒 Salon verrouillé',
                description: lockMessage,
                fields: [
                    { name: 'Salon', value: `<#${channel.id}>`, inline: true },
                    { name: 'Modérateur', value: `<@${message.author.id}>`, inline: true }
                ],
                footer: {
                    text: message.guild.name,
                    icon_url: message.guild.iconURL({ dynamic: true })
                },
                timestamp: new Date()
            };

            await message.channel.send({ embeds: [lockEmbed] });
        } catch (error) {
            console.error('Erreur lors du verrouillage du canal:', error);
            message.reply('❌ Une erreur est survenue lors du verrouillage du salon.');
        }
    }
};
