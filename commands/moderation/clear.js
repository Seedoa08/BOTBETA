const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const config = require('../../config/commands');
const Logger = require('../../utils/logger');
const PermissionHandler = require('../../utils/permissionHandler');

module.exports = {
    name: 'clear',
    description: 'Supprimer un nombre spécifié de messages',
    usage: '+clear <nombre> [@utilisateur]',
    category: 'Modération',
    permissions: 'ManageMessages',
    cooldown: 5,
    async execute(message, args) {
        const logger = new Logger(message.client);
        const permissionHandler = new PermissionHandler(message.client);

        // Vérifier les permissions
        if (!await permissionHandler.checkPermissions(message.member, this)) {
            return message.reply(config.errorMessages.noPermission);
        }

        // Vérifier les arguments
        if (!args[0]) {
            return message.reply(`❌ Usage: \`${this.usage}\``);
        }

        // Vérifier si le nombre est valide
        const amount = parseInt(args[0]);
        if (isNaN(amount) || amount < 1 || amount > 100) {
            return message.reply('❌ Veuillez spécifier un nombre entre 1 et 100.');
        }

        // Vérifier les permissions du bot
        if (!await permissionHandler.checkBotPermissions(message.channel, 'ManageMessages')) {
            return message.reply('❌ Je n\'ai pas la permission de supprimer des messages.');
        }

        try {
            // Supprimer le message de commande
            await message.delete().catch(() => {});

            // Récupérer les messages à supprimer
            let messages;
            if (args[1] && message.mentions.users.first()) {
                const user = message.mentions.users.first();
                messages = await message.channel.messages.fetch({ limit: 100 });
                messages = messages.filter(m => m.author.id === user.id).first(amount);
            } else {
                messages = await message.channel.messages.fetch({ limit: amount });
            }

            // Supprimer les messages
            const deleted = await message.channel.bulkDelete(messages, true);

            // Créer l'embed de confirmation
            const clearEmbed = new EmbedBuilder()
                .setColor(config.logging.colors.success)
                .setTitle('🗑️ Messages Supprimés')
                .setDescription(`${deleted.size} message(s) ont été supprimés.`)
                .setTimestamp();

            // Envoyer le message de confirmation
            const confirmMessage = await message.channel.send({ embeds: [clearEmbed] });

            // Logger l'action
            await logger.logModeration(
                'Clear',
                message.author,
                { tag: 'N/A', id: 'N/A' },
                `${deleted.size} message(s) supprimés${args[1] ? ` de ${message.mentions.users.first().tag}` : ''}`
            );

            // Supprimer le message de confirmation après 5 secondes
            setTimeout(() => confirmMessage.delete().catch(() => {}), 5000);

        } catch (error) {
            console.error('Erreur lors de la suppression des messages:', error);
            
            // Gérer les erreurs spécifiques
            if (error.code === 50034) {
                return message.reply('❌ Je ne peux pas supprimer des messages plus vieux que 14 jours.');
            }
            
            return message.reply('❌ Une erreur est survenue lors de la suppression des messages.');
        }
    }
}; 