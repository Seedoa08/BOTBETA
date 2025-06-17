const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

class ModerationMenu {
    constructor(client) {
        this.client = client;
        this.menus = new Map();
    }

    async createMenu(channel) {
        const menu = new StringSelectMenuBuilder()
            .setCustomId('mod_actions')
            .setPlaceholder('Sélectionnez une action')
            .addOptions([
                { label: 'Mute Rapide', value: 'quick_mute', emoji: '🔇' },
                { label: 'Bannir', value: 'quick_ban', emoji: '🔨' },
                { label: 'Avertissement', value: 'quick_warn', emoji: '⚠️' },
                { label: 'Logs', value: 'view_logs', emoji: '📋' }
            ]);

        const row = new ActionRowBuilder().addComponents(menu);
        
        const menuMessage = await channel.send({
            content: '**Menu de Modération Rapide**',
            components: [row]
        });

        this.setupCollector(menuMessage);
        return menuMessage;
    }

    setupCollector(menuMessage) {
        const collector = menuMessage.createMessageComponentCollector({
            time: 3600000 // 1 heure
        });

        collector.on('collect', async interaction => {
            // Traitement des actions de modération
            await this.handleMenuAction(interaction);
        });
    }

    async handleMenuAction(interaction) {
        // Logique pour chaque action
        // ...existing code...
    }
}

module.exports = ModerationMenu;