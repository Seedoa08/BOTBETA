const { PermissionsBitField, EmbedBuilder } = require('discord.js');
const isOwner = require('../utils/isOwner');

// Fonction utilitaire fictive pour récupérer les stats d'un modérateur
async function getModStats(userId) {
    // À adapter selon ta logique réelle (ici, valeurs fictives)
    return {
        deleted: 0,
        warns: 0,
        mutes: 0,
        kicks: 0,
        bans: 0,
        total: 0
    };
}

module.exports = {
    name: 'modstats',
    description: 'Affiche les statistiques de modération',
    usage: '+modstats [@modérateur]',
    permissions: 'ManageMessages',
    async execute(message, args) {
        // Bypass des permissions pour les owners
        if (!isOwner(message.author.id) && !message.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
            return message.reply('❌ Vous n\'avez pas la permission de voir les statistiques de modération.');
        }

        const mod = message.mentions.users.first() || message.author;
        const stats = await getModStats(mod.id);

        const embed = new EmbedBuilder()
            .setColor(0x4caf50)
            .setAuthor({
                name: `Statistiques de modération de ${mod.tag}`,
                iconURL: mod.displayAvatarURL({ dynamic: true })
            })
            .addFields(
                { name: 'Messages supprimés', value: stats.deleted.toString(), inline: true },
                { name: 'Avertissements', value: stats.warns.toString(), inline: true },
                { name: 'Mutes', value: stats.mutes.toString(), inline: true },
                { name: 'Kicks', value: stats.kicks.toString(), inline: true },
                { name: 'Bans', value: stats.bans.toString(), inline: true },
                { name: 'Total', value: stats.total.toString(), inline: true }
            )
            .setFooter({ text: 'Statistiques depuis le début' })
            .setTimestamp();

        // Ajout d'un champ explicatif
        embed.addFields({
            name: '📋 Commande',
            value: 'Pour voir les stats d\'un modérateur : `+modstats @modérateur`\nPour voir vos stats : `+modstats`'
        });

        message.channel.send({ embeds: [embed] });
    }
};
