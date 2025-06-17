const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'snipe',
    description: 'Affiche le dernier message supprimé',
    usage: '+snipe',
    category: 'Utilitaire',
    permissions: 'ManageMessages',
    async execute(message) {
        const snipedMessage = message.client.snipes.get(message.channel.id);
        
        if (!snipedMessage) {
            return message.reply('❌ Aucun message supprimé récemment dans ce salon.');
        }

        const embed = new EmbedBuilder()
            .setAuthor({
                name: snipedMessage.author.tag,
                iconURL: snipedMessage.author.displayAvatarURL({ dynamic: true })
            })
            .setDescription(snipedMessage.content || 'Aucun contenu')
            .setColor(0x2f3136)
            .setFooter({ text: `Message supprimé` })
            .setTimestamp(snipedMessage.timestamp);

        // Ajouter les pièces jointes s'il y en a
        if (snipedMessage.attachments.size > 0) {
            const attachment = snipedMessage.attachments.first();
            if (attachment.contentType?.startsWith('image/')) {
                embed.setImage(attachment.proxyURL);
            }
            embed.addFields({
                name: 'Pièces jointes',
                value: snipedMessage.attachments.map(a => `[${a.name}](${a.url})`).join('\n')
            });
        }

        await message.reply({ embeds: [embed] });
    }
};
