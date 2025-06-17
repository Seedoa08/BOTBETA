const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'shutdown',
    description: 'Éteindre le bot',
    usage: '+shutdown',
    category: 'Système',
    async execute(message, args) {
        // Vérifier si l'utilisateur est le propriétaire
        if (message.author.id !== '607957090358657035') {
            return message.reply('❌ Cette commande est réservée au propriétaire du bot.');
        }

        const embed = new EmbedBuilder()
            .setColor('#FF69B4')
            .setTitle('🛑 Arrêt')
            .setDescription('Le bot va s\'éteindre...');

        await message.reply({ embeds: [embed] });

        // Éteindre le processus
        process.exit(1);
    }
};
