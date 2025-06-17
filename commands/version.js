const { EmbedBuilder } = require('discord.js');
const config = require('../config.json');

module.exports = {
    name: 'version',
    description: 'Affiche la version actuelle du bot',
    async execute(message) {
        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('🔄 Version du bot')
            .addFields(
                { name: 'Version actuelle', value: config.version },
                { name: 'Dernière mise à jour', value: config.lastUpdate },
                { name: 'Package version', value: config.version }
            )
            .setTimestamp();

        message.channel.send({ embeds: [embed] });
    }
};
