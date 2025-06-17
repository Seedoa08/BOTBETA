const { PermissionsBitField } = require('discord.js');
const isOwner = require('../utils/isOwner');

module.exports = {
    name: 'purge',
    description: 'Supprime massivement des messages',
    usage: '+purge <type> <nombre> [utilisateur]',
    permissions: 'ManageMessages',
    async execute(message, args) {
        // Bypass des permissions pour les owners
        if (!isOwner(message.author.id) && !message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            return message.reply('❌ Vous n\'avez pas la permission de purger les messages.');
        }

        const type = args[0]?.toLowerCase();
        const amount = parseInt(args[1]);
        
        if (!type || !amount || isNaN(amount) || amount < 1 || amount > 100) {
            return message.reply('❌ Usage: `+purge <bots/liens/images/embeds/tout> <nombre>`');
        }

        try {
            const messages = await message.channel.messages.fetch({ limit: 100 });
            let filtered;

            switch(type) {
                case 'bots':
                    filtered = messages.filter(m => m.author.bot);
                    break;
                case 'liens':
                    filtered = messages.filter(m => m.content.match(/https?:\/\/[^\s]+/));
                    break;
                case 'images':
                    filtered = messages.filter(m => m.attachments.size > 0);
                    break;
                case 'embeds':
                    filtered = messages.filter(m => m.embeds.length > 0);
                    break;
                case 'tout':
                    filtered = messages;
                    break;
                default:
                    return message.reply('❌ Type invalide. Utilisez: bots, liens, images, embeds, tout');
            }

            const toDelete = filtered.first(amount);
            await message.channel.bulkDelete(toDelete, true);
            message.reply(`✅ ${toDelete.length} messages supprimés.`).then(msg => {
                setTimeout(() => msg.delete(), 5000);
            });
        } catch (error) {
            console.error('Erreur purge:', error);
            message.reply('❌ Une erreur est survenue.');
        }
    }
};
