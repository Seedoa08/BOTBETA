const { PermissionsBitField, EmbedBuilder } = require('discord.js');
const isOwner = require('../utils/isOwner');

module.exports = {
    name: 'modpanel',
    description: 'Affiche le panneau de modération',
    usage: '+modpanel',
    permissions: 'Administrator',
    async execute(message, args) {
        // Bypass des permissions pour les owners
        if (!isOwner(message.author.id) && !message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply('❌ Vous devez être administrateur pour utiliser cette commande.');
        }

        const embed = new EmbedBuilder()
            .setColor(0x0099ff)
            .setTitle('🛡️ Panneau de Modération')
            .setDescription(
                'Utilisez les **commandes** ci-dessous pour effectuer des actions rapides :\n\n' +
                '🔒 **Mode Raid** : `+raid on` ou `+raid off`\n' +
                '🧹 **Nettoyage** : `+nettoyage <nombre>`\n' +
                '📊 **Stats** : `+stats`\n' +
                '⚡ **Actions Rapides** : `+help modération`\n\n' +
                'Tapez la commande correspondante dans ce salon.'
            );

        await message.channel.send({ embeds: [embed] });
    }
};
