const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'eval',
    description: 'Évaluer du code',
    usage: '+eval <code>',
    category: 'Système',
    async execute(message, args) {
        // Vérifier si l'utilisateur est le propriétaire
        if (message.author.id !== '607957090358657035') {
            return message.reply('❌ Cette commande est réservée au propriétaire du bot.');
        }

        if (!args[0]) {
            return message.reply('❌ Veuillez fournir du code à évaluer.');
        }

        try {
            const code = args.join(' ');
            let evaled = eval(code);

            if (typeof evaled !== 'string') {
                evaled = require('util').inspect(evaled);
            }

            const embed = new EmbedBuilder()
                .setColor('#FF69B4')
                .setTitle('📝 Évaluation')
                .addFields(
                    { name: '📥 Entrée', value: `\`\`\`js\n${code}\n\`\`\`` },
                    { name: '📤 Sortie', value: `\`\`\`js\n${evaled}\n\`\`\`` }
                );

            message.reply({ embeds: [embed] });
        } catch (error) {
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('❌ Erreur')
                .setDescription(`\`\`\`js\n${error}\n\`\`\``);

            message.reply({ embeds: [embed] });
        }
    }
};
