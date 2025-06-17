const { PermissionsBitField } = require('discord.js');
const isOwner = require('../utils/isOwner');

module.exports = {
    name: 'slowmode',
    description: 'Configure le mode lent d\'un salon',
    usage: '+slowmode <durée en secondes/off>',
    permissions: 'ManageChannels',
    async execute(message, args) {
        // Bypass des permissions pour les owners
        if (!isOwner(message.author.id) && !message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
            return message.reply('❌ Vous n\'avez pas la permission de gérer le mode lent.');
        }

        const duration = args[0]?.toLowerCase() === 'off' ? 0 : parseInt(args[0]);
        if ((isNaN(duration) && args[0] !== 'off') || duration < 0 || duration > 21600) {
            return message.reply('❌ Durée invalide. Utilisez un nombre entre 0 et 21600 secondes, ou "off".');
        }

        try {
            await message.channel.setRateLimitPerUser(duration);
            if (duration === 0) {
                return message.reply('✅ Mode lent désactivé.');
            }
            return message.reply(`✅ Mode lent configuré sur ${duration} secondes.`);
        } catch (error) {
            console.error('Erreur slowmode:', error);
            return message.reply('❌ Une erreur est survenue.');
        }
    }
};
