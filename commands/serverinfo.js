const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'serverinfo',
    description: 'Affiche les informations détaillées sur le serveur.',
    usage: '+serverinfo',
    category: 'Utilitaire',
    permissions: null,
    async execute(message) {
        const { guild } = message;

        // Calculer les statistiques des membres
        const totalMembers = guild.memberCount;
        const humans = guild.members.cache.filter(member => !member.user.bot).size;
        const bots = guild.members.cache.filter(member => member.user.bot).size;
        const online = guild.members.cache.filter(member => member.presence?.status === 'online').size;
        const offline = guild.members.cache.filter(member => !member.presence || member.presence.status === 'offline').size;

        // Calculer les statistiques des salons
        const categories = guild.channels.cache.filter(c => c.type === 4).size;
        const textChannels = guild.channels.cache.filter(c => c.type === 0).size;
        const voiceChannels = guild.channels.cache.filter(c => c.type === 2).size;
        const announcements = guild.channels.cache.filter(c => c.type === 5).size;
        const stages = guild.channels.cache.filter(c => c.type === 13).size;
        const forums = guild.channels.cache.filter(c => c.type === 15).size;

        // Calculer les statistiques des emojis et stickers
        const animatedEmojis = guild.emojis.cache.filter(emoji => emoji.animated).size;
        const staticEmojis = guild.emojis.cache.filter(emoji => !emoji.animated).size;
        const stickers = guild.stickers.cache.size;

        const serverInfoEmbed = new EmbedBuilder()
            .setColor(0x0099ff)
            .setTitle(`📊 Informations sur ${guild.name}`)
            .setDescription(guild.description || '*Aucune description*')
            .setThumbnail(guild.iconURL({ dynamic: true, size: 512 }))
            .addFields(
                {
                    name: '👑 Informations générales',
                    value: [
                        `**Owner:** <@${guild.ownerId}>`,
                        `**Région:** ${guild.preferredLocale}`,
                        `**Créé le:** <t:${Math.floor(guild.createdTimestamp / 1000)}:F>`,
                        `**Niveau de boost:** ${guild.premiumTier} (${guild.premiumSubscriptionCount} boosts)`,
                        `**Niveau de vérification:** ${guild.verificationLevel}`,
                        `**Features:** ${guild.features.join(', ') || 'Aucune'}`
                    ].join('\n'),
                    inline: false
                },
                {
                    name: '👥 Membres',
                    value: [
                        `**Total:** ${totalMembers}`,
                        `**Humains:** ${humans}`,
                        `**Bots:** ${bots}`,
                        `**En ligne:** ${online}`,
                        `**Hors ligne:** ${offline}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '📜 Salons',
                    value: [
                        `**Catégories:** ${categories}`,
                        `**Textuels:** ${textChannels}`,
                        `**Vocaux:** ${voiceChannels}`,
                        `**Annonces:** ${announcements}`,
                        `**Stages:** ${stages}`,
                        `**Forums:** ${forums}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '🎨 Personnalisation',
                    value: [
                        `**Rôles:** ${guild.roles.cache.size}`,
                        `**Emojis:** ${staticEmojis} statiques, ${animatedEmojis} animés`,
                        `**Stickers:** ${stickers}`,
                        `**Bannière:** ${guild.banner ? '✅' : '❌'}`,
                        `**Splash:** ${guild.splash ? '✅' : '❌'}`
                    ].join('\n'),
                    inline: true
                }
            )
            .setImage(guild.bannerURL({ size: 1024 }) || null)
            .setFooter({ 
                text: `ID: ${guild.id} • Demandé par ${message.author.tag}`,
                iconURL: message.author.displayAvatarURL({ dynamic: true })
            })
            .setTimestamp();

        await message.reply({ embeds: [serverInfoEmbed] });
    }
};
