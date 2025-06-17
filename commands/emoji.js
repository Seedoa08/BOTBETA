const { PermissionsBitField } = require('discord.js');
const isOwner = require('../utils/isOwner');

module.exports = {
    name: 'emoji',
    description: 'Gère les émojis du serveur',
    usage: '+emoji <add/remove/list> [nom] [url]',
    permissions: 'ManageEmojisAndStickers',
    variables: [
        { name: 'add', description: 'Ajoute un emoji' },
        { name: 'remove', description: 'Supprime un emoji' },
        { name: 'list', description: 'Liste tous les emojis' }
    ],
    async execute(message, args) {
        // Bypass des permissions pour les owners
        if (!isOwner(message.author.id) && !message.member.permissions.has(PermissionsBitField.Flags.ManageEmojisAndStickers)) {
            return message.reply('❌ Vous n\'avez pas la permission de gérer les émojis.');
        }

        const subCommand = args[0]?.toLowerCase();
        
        switch(subCommand) {
            case 'add':
                // ...emoji add logic...
                break;
            case 'remove':
                // ...emoji remove logic...
                break;
            case 'list':
                const emojis = message.guild.emojis.cache;
                const embed = {
                    color: 0x0099ff,
                    title: '😀 Liste des Emojis',
                    fields: [
                        {
                            name: 'Emojis animés',
                            value: emojis.filter(e => e.animated).map(e => `${e} \`:${e.name}:\``).join('\n') || 'Aucun'
                        },
                        {
                            name: 'Emojis statiques',
                            value: emojis.filter(e => !e.animated).map(e => `${e} \`:${e.name}:\``).join('\n') || 'Aucun'
                        }
                    ],
                    footer: { text: `Total: ${emojis.size} emojis` }
                };
                await message.reply({ embeds: [embed] });
                break;
        }
    }
};
