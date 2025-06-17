const fs = require('fs');
const path = require('path');
const isOwner = require('../utils/isOwner');

// Chemin du fichier de configuration de maintenance
const maintenanceFile = path.join(__dirname, '../data/maintenance.json');

module.exports = {
    name: 'maintenance',
    description: 'Active/désactive le mode maintenance',
    usage: '+maintenance <on/off> [raison]',
    category: 'Owner',
    ownerOnly: true,
    async execute(message, args) {
        if (!isOwner(message.author.id)) {
            return message.reply('❌ Cette commande est réservée aux owners du bot.');
        }

        const mode = args[0]?.toLowerCase();
        if (!['on', 'off', 'status'].includes(mode)) {
            return message.reply('❌ Usage: `+maintenance <on/off/status> [raison]`');
        }

        const maintenance = {
            enabled: mode === 'on',
            reason: args.slice(1).join(' ') || 'Maintenance en cours...',
            timestamp: Date.now(),
            enabledBy: message.author.tag,
            allowedCommands: ['help', 'ping', 'maintenance'] // Commandes toujours accessibles
        };

        if (mode === 'status') {
            const currentStatus = fs.existsSync(maintenanceFile) 
                ? JSON.parse(fs.readFileSync(maintenanceFile, 'utf8'))
                : { enabled: false };

            const statusEmbed = {
                color: currentStatus.enabled ? 0xff0000 : 0x00ff00,
                title: '🔧 Statut de la Maintenance',
                description: currentStatus.enabled 
                    ? `✅ Maintenance activée\nRaison: ${currentStatus.reason}`
                    : '❌ Maintenance désactivée',
                fields: currentStatus.enabled ? [
                    { name: 'Activée par', value: currentStatus.enabledBy || 'Inconnu' },
                    { name: 'Date', value: `<t:${Math.floor(currentStatus.timestamp/1000)}:R>` }
                ] : [],
                timestamp: new Date()
            };

            return message.reply({ embeds: [statusEmbed] });
        }

        // Sauvegarder l'état de maintenance
        fs.writeFileSync(maintenanceFile, JSON.stringify(maintenance, null, 4));

        // Mettre à jour le statut du bot
        message.client.user.setPresence({
            activities: [{
                name: maintenance.enabled ? '🔧 Maintenance' : '+help | Bot Opérationnel',
                type: maintenance.enabled ? 4 : 0
            }],
            status: maintenance.enabled ? 'dnd' : 'online'
        });

        const embed = {
            color: maintenance.enabled ? 0xff0000 : 0x00ff00,
            title: maintenance.enabled ? '🔧 Maintenance Activée' : '✅ Maintenance Désactivée',
            description: maintenance.enabled ? maintenance.reason : 'Le bot est à nouveau opérationnel.',
            footer: { text: `Action effectuée par ${message.author.tag}` },
            timestamp: new Date()
        };

        message.reply({ embeds: [embed] });
    }
};
