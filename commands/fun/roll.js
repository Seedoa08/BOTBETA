const { EmbedBuilder } = require('discord.js');
const config = require('../../config/commands');

module.exports = {
    name: 'roll',
    description: 'Lancer un ou plusieurs dés',
    usage: '+roll [nombre de dés]d[faces]',
    category: 'Fun',
    cooldown: 3,
    async execute(message, args) {
        // Valeurs par défaut
        let numDice = 1;
        let numFaces = 6;

        // Analyser les arguments
        if (args[0]) {
            const match = args[0].match(/^(\d+)?d(\d+)$/i);
            if (match) {
                numDice = match[1] ? parseInt(match[1]) : 1;
                numFaces = parseInt(match[2]);
            } else {
                return message.reply(`❌ Format invalide. Usage: \`${this.usage}\``);
            }
        }

        // Vérifier les limites
        if (numDice < 1 || numDice > 10) {
            return message.reply('❌ Vous pouvez lancer entre 1 et 10 dés.');
        }

        if (numFaces < 2 || numFaces > 100) {
            return message.reply('❌ Les dés doivent avoir entre 2 et 100 faces.');
        }

        // Lancer les dés
        const rolls = [];
        let total = 0;

        for (let i = 0; i < numDice; i++) {
            const roll = Math.floor(Math.random() * numFaces) + 1;
            rolls.push(roll);
            total += roll;
        }

        // Créer l'embed
        const embed = new EmbedBuilder()
            .setColor(config.categories.fun.color)
            .setTitle('🎲 Lancer de Dés')
            .addFields(
                { name: 'Dés', value: `${numDice}d${numFaces}` },
                { name: 'Résultats', value: rolls.join(', ') },
                { name: 'Total', value: total.toString() }
            )
            .setFooter({ text: `Lancé par ${message.author.tag}` })
            .setTimestamp();

        // Ajouter des informations supplémentaires pour les lancers spéciaux
        if (numDice === 2 && numFaces === 6) {
            const isDouble = rolls[0] === rolls[1];
            const isSnakeEyes = rolls[0] === 1 && rolls[1] === 1;
            const isBoxcars = rolls[0] === 6 && rolls[1] === 6;

            if (isDouble) {
                embed.addFields({ name: 'Double!', value: '🎉 Vous avez fait un double!' });
            }
            if (isSnakeEyes) {
                embed.addFields({ name: 'Snake Eyes!', value: '🐍 Double 1!' });
            }
            if (isBoxcars) {
                embed.addFields({ name: 'Boxcars!', value: '🚂 Double 6!' });
            }
        }

        // Envoyer le résultat
        await message.reply({ embeds: [embed] });
    }
}; 