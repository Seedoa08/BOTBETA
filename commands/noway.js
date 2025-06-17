const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'noway',
    description: 'Informations sur le développeur du bot',
    category: 'Utilitaires',
    usage: '+noway',
    async execute(message, args) {
        const embed = new EmbedBuilder()
            .setColor('#FF69B4')
            .setTitle('🌟 À propos de Noway')
            .setDescription(`**Créateur de BetaBOT**`)
            .addFields(
                {
                    name: '👨‍💻 Développeur',
                    value: 'Développeur passionné avec un niveau intermédiaire en JavaScript. Malgré ses études qui limitent son temps de développement, il continue d\'améliorer BetaBOT quand il le peut.'
                },
                {
                    name: '📝 Note',
                    value: 'BetaBOT est en version bêta car le développement est ralenti par les études. Chaque mise à jour est le fruit de son temps libre et de sa passion pour la programmation.'
                }
            )
            .setFooter({ 
                text: 'Créé avec passion par Noway',
                iconURL: message.author.displayAvatarURL({ dynamic: true })
            })
            .setTimestamp();

        await message.reply({ embeds: [embed] });
    }
}; 