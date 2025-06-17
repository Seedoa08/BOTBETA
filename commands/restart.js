const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'restart',
    description: 'Redémarrer le bot',
    usage: '+restart',
    category: 'Système',
    async execute(message, args) {
        // Vérifier si l'utilisateur est le propriétaire
        if (message.author.id !== '607957090358657035') {
            return message.reply('❌ Cette commande est réservée au propriétaire du bot.');
        }

        const embed = new EmbedBuilder()
            .setColor('#FF69B4')
            .setTitle('🔄 Redémarrage')
            .setDescription('Le bot va redémarrer...');

        await message.reply({ embeds: [embed] });

        // Redémarrer le processus
        process.exit(0);
    }
};
