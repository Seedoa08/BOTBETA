const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'pic',
    description: 'Affiche l\'avatar et la bannière d\'un utilisateur',
    usage: '+pic [@utilisateur]',
    category: 'Utilitaire',
    permissions: null,
    async execute(message, args) {
        try {
            const user = message.mentions.users.first() || message.author;
            
            // Forcer la récupération des données utilisateur
            const fetchedUser = await message.client.users.fetch(user.id, { force: true });
            const member = await message.guild.members.fetch(user.id);

            const avatar = fetchedUser.displayAvatarURL({ size: 4096, dynamic: true });
            const banner = fetchedUser.bannerURL({ size: 4096, dynamic: true });

            const embed = new EmbedBuilder()
                .setColor(member.displayHexColor || 0x0099FF)
                .setTitle(`🖼️ Images de ${user.tag}`)
                .setTimestamp();

            // Ajouter les champs pour les différentes images
            embed.addFields(
                { 
                    name: '📸 Avatar',
                    value: `[Lien direct](${avatar})`
                }
            );

            if (banner) {
                embed.addFields({
                    name: '🎨 Bannière',
                    value: `[Lien direct](${banner})`
                });
            }

            // Utiliser l'avatar comme thumbnail et la bannière comme image principale si elle existe
            embed.setThumbnail(avatar);
            if (banner) embed.setImage(banner);

            await message.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Erreur pic:', error);
            message.reply('❌ Une erreur est survenue lors de la récupération des images.');
        }
    }
};
