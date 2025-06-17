const { PermissionsBitField } = require('discord.js');
const isOwner = require('../utils/isOwner');

module.exports = {
    name: 'nuke',
    description: 'Supprime et recrée un salon',
    usage: '+nuke',
    permissions: 'ManageChannels',
    async execute(message, args) {
        // Bypass des permissions pour les owners
        if (!isOwner(message.author.id) && !message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
            return message.reply('❌ Vous n\'avez pas la permission de supprimer des salons.');
        }

        // Demande de confirmation
        const confirm = await message.reply('⚠️ Êtes-vous sûr de vouloir nuker ce salon ? Cette action est irréversible. (oui/non)');
        
        try {
            const filter = m => m.author.id === message.author.id && ['oui', 'non'].includes(m.content.toLowerCase());
            const collected = await message.channel.awaitMessages({ filter, max: 1, time: 30000 });

            if (!collected.size || collected.first().content.toLowerCase() === 'non') {
                return message.reply('❌ Opération annulée.');
            }

            const position = message.channel.position;
            const newChannel = await message.channel.clone();
            await message.channel.delete();
            await newChannel.setPosition(position);
            
            newChannel.send({
                embeds: [{
                    color: 0xFF0000,
                    title: '💥 Canal recréé',
                    description: 'Ce salon a été complètement nettoyé.',
                    footer: { text: `Action effectuée par ${message.author.tag}` },
                    timestamp: new Date()
                }]
            });
        } catch (error) {
            console.error('Erreur nuke:', error);
            message.reply('❌ Une erreur est survenue.');
        }
    }
};
