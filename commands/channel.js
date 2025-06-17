const { PermissionsBitField } = require('discord.js');
const isOwner = require('../utils/isOwner');

module.exports = {
    name: 'channel',
    description: 'Gère les paramètres des salons',
    usage: '+channel <create/delete/info/lock/unlock> [nom] [type]',
    permissions: 'ManageChannels',
    async execute(message, args) {
        // Bypass des permissions pour les owners
        if (!isOwner(message.author.id) && !message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
            return message.reply('❌ Vous n\'avez pas la permission de gérer les salons.');
        }

        const action = args[0]?.toLowerCase();
        const name = args[1];

        if (!['create', 'delete', 'info', 'lock', 'unlock'].includes(action)) {
            return message.reply('❌ Action invalide. Utilisez `create`, `delete`, `info`, `lock` ou `unlock`.');
        }

        switch (action) {
            case 'create':
                const type = args[2]?.toLowerCase();
                const channelType = type === 'voice' ? ChannelType.GuildVoice : ChannelType.GuildText;
                const newChannel = await message.guild.channels.create({
                    name: name || 'nouveau-salon',
                    type: channelType
                });
                return message.reply(`✅ Salon ${newChannel} créé.`);

            case 'delete':
                const channel = message.mentions.channels.first() || message.channel;
                await channel.delete();
                return message.reply(`✅ Salon ${channel.name} supprimé.`);

            case 'info':
                const targetChannel = message.mentions.channels.first() || message.channel;
                const embed = {
                    color: 0x0099ff,
                    title: `Information sur #${targetChannel.name}`,
                    fields: [
                        { name: 'ID', value: targetChannel.id, inline: true },
                        { name: 'Type', value: targetChannel.type, inline: true },
                        { name: 'Créé le', value: `<t:${Math.floor(targetChannel.createdTimestamp / 1000)}:F>`, inline: false },
                        { name: 'Position', value: `${targetChannel.position}`, inline: true }
                    ]
                };
                return message.reply({ embeds: [embed] });

            case 'lock':
            case 'unlock':
                const targetChan = message.mentions.channels.first() || message.channel;
                await targetChan.permissionOverwrites.edit(message.guild.roles.everyone.id, {
                    SendMessages: action === 'unlock'
                });
                return message.reply(`✅ Salon ${targetChan} ${action === 'lock' ? 'verrouillé' : 'déverrouillé'}.`);
        }
    }
};
