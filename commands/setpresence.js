const { ownerId } = require('../config/owner');
const { ActivityType } = require('discord.js');

module.exports = {
    name: 'setpresence',
    description: 'Modifie le statut et l\'activité du bot',
    usage: '+setpresence <type> <status> <text>',
    permissions: 'OwnerOnly',
    async execute(message, args) {
        if (message.author.id !== ownerId) {
            return message.reply('❌ Cette commande est réservée au propriétaire du bot.');
        }

        const types = {
            'playing': ActivityType.Playing,
            'watching': ActivityType.Watching,
            'listening': ActivityType.Listening,
            'streaming': ActivityType.Streaming,
            'competing': ActivityType.Competing
        };

        const type = args[0]?.toLowerCase();
        const status = args[1]?.toLowerCase();
        const text = args.slice(2).join(' ');

        if (!type || !status || !text) {
            return message.reply('❌ Format: `+setpresence <playing/watching/listening/streaming/competing> <online/idle/dnd/invisible> <text>`');
        }

        if (!types[type]) {
            return message.reply('❌ Type invalide. Utilisez: playing, watching, listening, streaming, ou competing');
        }

        if (!['online', 'idle', 'dnd', 'invisible'].includes(status)) {
            return message.reply('❌ Statut invalide. Utilisez: online, idle, dnd, ou invisible');
        }

        try {
            await message.client.user.setPresence({
                activities: [{ name: text, type: types[type] }],
                status: status
            });

            message.reply(`✅ Présence mise à jour: ${type} ${text} (${status})`);
        } catch (error) {
            console.error('Erreur lors du changement de présence:', error);
            message.reply('❌ Une erreur est survenue lors du changement de présence.');
        }
    }
};
