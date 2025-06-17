const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'sanctions',
    description: 'Affiche l\'historique des sanctions d\'un utilisateur',
    usage: '+sanctions @utilisateur',
    permissions: 'ModerateMembers',
    async execute(message, args) {
        const user = message.mentions.users.first();
        if (!user) return message.reply('❌ Veuillez mentionner un utilisateur.');

        const sanctions = await this.getSanctions(user.id);
        const embed = {
            color: 0xf44336,
            author: {
                name: `Sanctions de ${user.tag}`,
                icon_url: user.displayAvatarURL({ dynamic: true })
            },
            fields: [
                { name: 'Total', value: `${sanctions.total} sanctions`, inline: true },
                { name: 'Warns', value: `${sanctions.warns} avertissements`, inline: true },
                { name: 'Mutes', value: `${sanctions.mutes} mutes`, inline: true },
                { name: 'Kicks', value: `${sanctions.kicks} expulsions`, inline: true },
                { name: 'Bans', value: `${sanctions.bans} bannissements`, inline: true }
            ],
            footer: {
                text: `ID: ${user.id}`
            },
            timestamp: new Date()
        };

        // Ajouter les 5 dernières sanctions
        const recentSanctions = sanctions.history.slice(0, 5);
        if (recentSanctions.length > 0) {
            embed.fields.push({
                name: 'Dernières sanctions',
                value: recentSanctions.map(s => 
                    `• ${s.type} | ${new Date(s.date).toLocaleDateString()} | ${s.reason}`
                ).join('\n')
            });
        }

        message.channel.send({ embeds: [embed] });
    }
};
