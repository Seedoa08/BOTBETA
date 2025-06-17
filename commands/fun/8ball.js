const { EmbedBuilder } = require('discord.js');
const config = require('../../config/commands');

module.exports = {
    name: '8ball',
    description: 'Posez une question au bot',
    usage: '+8ball <question>',
    category: 'Fun',
    cooldown: 3,
    async execute(message, args) {
        // Vérifier les arguments
        if (!args[0]) {
            return message.reply(`❌ Usage: \`${this.usage}\``);
        }

        // Liste de réponses
        const responses = [
            'Oui, absolument!',
            'C\'est certain!',
            'Sans aucun doute!',
            'Oui, définitivement!',
            'Vous pouvez compter dessus!',
            'Comme je le vois, oui!',
            'Très probablement!',
            'Les perspectives sont bonnes!',
            'Oui!',
            'Les signes pointent vers oui!',
            'Réponse floue, réessayez!',
            'Redemandez plus tard!',
            'Mieux vaut ne pas vous le dire maintenant!',
            'Impossible de prédire maintenant!',
            'Concentrez-vous et redemandez!',
            'Ne comptez pas dessus!',
            'Ma réponse est non!',
            'Mes sources disent non!',
            'Les perspectives ne sont pas très bonnes!',
            'Très douteux!'
        ];

        // Sélectionner une réponse aléatoire
        const response = responses[Math.floor(Math.random() * responses.length)];

        // Créer l'embed
        const embed = new EmbedBuilder()
            .setColor(config.categories.fun.color)
            .setTitle('🎱 8ball')
            .addFields(
                { name: 'Question', value: args.join(' ') },
                { name: 'Réponse', value: response }
            )
            .setFooter({ text: `Demandé par ${message.author.tag}` })
            .setTimestamp();

        // Envoyer la réponse
        await message.reply({ embeds: [embed] });
    }
}; 