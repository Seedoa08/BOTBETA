module.exports = {
    name: 'roleinfo',
    description: 'Affiche des informations détaillées sur un rôle.',
    usage: '+roleinfo @role',
    permissions: 'Aucune',
    async execute(message, args) {
        const role = message.mentions.roles.first();
        if (!role) {
            return message.reply('❌ Vous devez mentionner un rôle.');
        }

        const roleInfoEmbed = {
            color: role.color || 0x0099ff,
            title: `Informations sur le rôle ${role.name}`,
            fields: [
                { name: 'ID', value: role.id, inline: true },
                { name: 'Couleur', value: role.hexColor, inline: true },
                { name: 'Membres', value: `${role.members.size}`, inline: true },
                { name: 'Position', value: `${role.position}`, inline: true },
                { name: 'Mentionnable', value: role.mentionable ? 'Oui' : 'Non', inline: true },
                { name: 'Créé le', value: `<t:${Math.floor(role.createdTimestamp / 1000)}:F>`, inline: false }
            ],
            footer: {
                text: `Demandé par ${message.author.tag}`,
                icon_url: message.author.displayAvatarURL({ dynamic: true })
            },
            timestamp: new Date()
        };

        message.channel.send({ embeds: [roleInfoEmbed] });
    }
};
