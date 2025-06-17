const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'banner',
    description: 'Affiche la bannière du serveur ou d\'un utilisateur',
    usage: '+banner [user/server]',
    category: 'Utilitaire',
    permissions: null,
    async execute(message, args) {
        try {
            if (args[0]?.toLowerCase() === 'server') {
                const guild = message.guild;
                const banner = guild.bannerURL({ size: 4096, dynamic: true });
                const splash = guild.splashURL({ size: 4096, dynamic: true });

                if (!banner && !splash) {
                    return message.reply('❌ Ce serveur n\'a pas de bannière ni d\'image d\'invitation.');
                }

                const embed = new EmbedBuilder()
                    .setColor(0x0099FF)
                    .setTitle(`🖼️ Images de ${guild.name}`)
                    .setTimestamp();

                if (banner) embed.setImage(banner);
                if (splash) {
                    if (!banner) embed.setImage(splash);
                    else embed.addFields({ name: 'Image d\'invitation', value: `[Cliquez ici](${splash})` });
                }

                await message.reply({ embeds: [embed] });
                return;
            }

            const user = message.mentions.users.first() || message.author;
            
            // Récupérer l'utilisateur avec ses données complètes
            const fetchedUser = await message.client.users.fetch(user.id, { force: true });
            const member = await message.guild.members.fetch(user.id);

            const banner = fetchedUser.bannerURL({ size: 4096, dynamic: true });
            const avatar = fetchedUser.displayAvatarURL({ size: 4096, dynamic: true });

            if (!banner) {
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(member.displayHexColor || 0x0099FF)
                            .setTitle(`🖼️ ${user.tag} n'a pas de bannière`)
                            .setDescription('Mais voici son avatar :')
                            .setImage(avatar)
                            .setTimestamp()
                    ]
                });
            }

            const embed = new EmbedBuilder()
                .setColor(member.displayHexColor || 0x0099FF)
                .setTitle(`🖼️ Bannière de ${user.tag}`)
                .setDescription(`[Lien direct](${banner})`)
                .setImage(banner)
                .setTimestamp();

            await message.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Erreur banner:', error);
            message.reply('❌ Une erreur est survenue lors de la récupération de la bannière.');
        }
    }
};
