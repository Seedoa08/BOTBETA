const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'leave',
    description: 'Quitter un serveur',
    usage: '+leave <ID du serveur>',
    category: 'Système',
    async execute(message, args) {
        // Vérifier si l'utilisateur est le propriétaire
        if (message.author.id !== '607957090358657035') {
            return message.reply('❌ Cette commande est réservée au propriétaire du bot.');
        }

        const guildId = args[0];
        if (!guildId) {
            return message.reply('❌ Veuillez spécifier l\'ID du serveur.');
        }

        const guild = message.client.guilds.cache.get(guildId);
        if (!guild) {
            return message.reply('❌ Serveur non trouvé.');
        }

        try {
            await guild.leave();
            const embed = new EmbedBuilder()
                .setColor('#FF69B4')
                .setTitle('👋 Au revoir!')
                .setDescription(`J'ai quitté le serveur **${guild.name}**`);

            message.reply({ embeds: [embed] });
        } catch (error) {
            message.reply(`❌ Erreur lors du départ du serveur: ${error.message}`);
        }
    }
};
