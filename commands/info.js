const isOwner = require('../utils/isOwner');

module.exports = {
    name: 'info',
    description: 'Affiche des informations sur une commande spécifique.',
    usage: '+info <commande>',
    category: 'Utilitaire',
    permissions: null, // Permission nulle pour accès public
    variables: [
        { name: 'commande', description: 'Nom de la commande pour voir ses informations.' }
    ],
    async execute(message, args) {
        const commandName = args[0]?.toLowerCase();
        const command = message.client.commands.get(commandName) || message.client.commands.find(cmd => cmd.aliases?.includes(commandName));

        if (!commandName) {
            const generalInfoEmbed = {
                color: 0x00ff00,
                title: 'ℹ️ Informations sur le bot',
                description: 'Utilisez `+info <commande>` pour obtenir des détails sur une commande spécifique.',
                fields: [
                    { name: 'Exemple', value: '`+info ban` pour voir les détails de la commande `ban`.' },
                    { name: 'Commandes disponibles', value: '`+help` pour voir la liste complète des commandes.' }
                ],
                footer: {
                    text: `Demandé par ${message.author.tag}`,
                    icon_url: message.author.displayAvatarURL({ dynamic: true })
                },
                timestamp: new Date()
            };

            return message.channel.send({ embeds: [generalInfoEmbed] });
        }

        if (!command) {
            return message.reply(`❌ La commande \`${commandName}\` n'existe pas.`);
        }

        const infoEmbed = {
            color: 0x0099ff,
            title: `ℹ️ Informations sur la commande ${command.name}`,
            description: command.description || 'Aucune description disponible.',
            fields: [
                { 
                    name: 'Usage',
                    value: `\`${command.usage || 'Non spécifié'}\``
                },
                {
                    name: 'Permissions nécessaires',
                    value: command.permissions || 'Aucune'
                }
            ],
            footer: {
                text: `Demandé par ${message.author.tag}`,
                icon_url: message.author.displayAvatarURL({ dynamic: true })
            },
            timestamp: new Date()
        };

        // Ajouter les options si elles existent
        if (command.variables && command.variables.length > 0) {
            infoEmbed.fields.push({
                name: 'Options',
                value: command.variables.map(v => 
                    `\`${v.name}\`: ${v.description}`
                ).join('\n')
            });
        }

        // Ajouter les alias si ils existent
        if (command.aliases?.length > 0) {
            infoEmbed.fields.push({
                name: 'Alias',
                value: command.aliases.map(a => `\`${a}\``).join(', ')
            });
        }

        try {
            await message.channel.send({ embeds: [infoEmbed] });
        } catch (error) {
            console.error('Erreur dans la commande info:', error);
            message.reply('❌ Une erreur est survenue lors de l\'envoi des informations.');
        }
    }
};
