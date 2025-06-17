const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'sun',
    description: 'Affiche un message spécial sur Sun',
    usage: '+sun',
    category: 'Fun',
    async execute(message, args) {
        const embed = new EmbedBuilder()
            .setColor('#FFD700') // Couleur dorée
            .setTitle('🌞 Sun')
            .setDescription('C\'est une personne normale, elle est trop mondiale et manque de bon sens pour être un ami à Noway')
            .setFooter({ text: 'Commande fun' })
            .setTimestamp();

        await message.reply({ embeds: [embed] });
    }
}; 