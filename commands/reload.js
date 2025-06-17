const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'reload',
    description: 'Recharger les commandes',
    usage: '+reload [commande]',
    category: 'Système',
    async execute(message, args) {
        // Vérifier si l'utilisateur est le propriétaire
        if (message.author.id !== '607957090358657035') {
            return message.reply('❌ Cette commande est réservée au propriétaire du bot.');
        }

        const embed = new EmbedBuilder()
            .setColor('#FF69B4')
            .setTitle('🔄 Rechargement');

        if (args[0]) {
            // Recharger une commande spécifique
            const commandName = args[0].toLowerCase();
            const command = message.client.commands.get(commandName);

            if (!command) {
                return message.reply('❌ Cette commande n\'existe pas.');
            }

            try {
                delete require.cache[require.resolve(`./${command.name}.js`)];
                message.client.commands.delete(command.name);
                const newCommand = require(`./${command.name}.js`);
                message.client.commands.set(newCommand.name, newCommand);

                embed.setDescription(`✅ La commande \`${command.name}\` a été rechargée.`);
            } catch (error) {
                embed.setColor('#FF0000')
                    .setDescription(`❌ Erreur lors du rechargement de la commande \`${command.name}\`:\n\`\`\`js\n${error}\n\`\`\``);
            }
        } else {
            // Recharger toutes les commandes
            try {
                message.client.commands.clear();
                const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

                for (const file of commandFiles) {
                    delete require.cache[require.resolve(`./${file}`)];
                    const command = require(`./${file}`);
                    message.client.commands.set(command.name, command);
                }

                embed.setDescription(`✅ ${commandFiles.length} commandes ont été rechargées.`);
            } catch (error) {
                embed.setColor('#FF0000')
                    .setDescription(`❌ Erreur lors du rechargement des commandes:\n\`\`\`js\n${error}\n\`\`\``);
            }
        }

        message.reply({ embeds: [embed] });
    }
};
