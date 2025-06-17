const { PermissionsBitField } = require('discord.js');
const isOwner = require('../utils/isOwner');
const { readJson, writeJson } = require('../utils/fileManager');
const { sendError, sendSuccess } = require('../utils/functions');
const { logModerationAction } = require('../utils/logger');

module.exports = {
    name: 'clear',
    description: 'Supprime des messages en masse',
    usage: '+clear <nombre> [--bots | --users | --mentions | --from @utilisateur]',
    permissions: 'ManageMessages',
    async execute(message, args) {
        // Bypass des permissions pour les owners
        if (!isOwner(message.author.id) && !message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            return message.reply('❌ Vous n\'avez pas la permission de supprimer les messages.');
        }

        const amount = parseInt(args[0]);
        if (isNaN(amount) || amount < 1 || amount > 100) {
            return message.reply('❌ Veuillez fournir un nombre valide de messages à supprimer (1-100).');
        }

        try {
            // Récupérer les messages
            let messages = await message.channel.messages.fetch({ limit: amount + 1 });

            // Appliquer les filtres
            if (args.includes('--bots')) {
                messages = messages.filter(msg => msg.author.bot);
            } else if (args.includes('--users')) {
                messages = messages.filter(msg => !msg.author.bot);
            } else if (args.includes('--mentions')) {
                messages = messages.filter(msg => msg.mentions.users.size > 0);
            } else if (message.mentions.users.size > 0) {
                const user = message.mentions.users.first();
                messages = messages.filter(msg => msg.author.id === user.id);
            }

            // Convertir la collection en array pour pouvoir utiliser slice
            const messagesToDelete = Array.from(messages.values()).slice(0, amount + 1);

            // Supprimer les messages
            await message.channel.bulkDelete(messagesToDelete, true);

            // Envoyer un message de confirmation qui s'auto-détruit
            const reply = await message.channel.send(`✅ ${messagesToDelete.length - 1} message(s) ont été supprimés.`);
            setTimeout(() => reply.delete().catch(() => {}), 3000);

            // Log the action
            logModerationAction(message.guild, message.author, 'clear', messagesToDelete.length - 1);

        } catch (error) {
            console.error('Erreur dans la commande clear:', error);
            await message.channel.send('❌ Une erreur est survenue lors de la suppression des messages.')
                .catch(() => {});
        }
    }
};

