const { Events } = require('discord.js');
const { createTicket } = require('../commands/ticket');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (!interaction.isButton()) return;
        if (!interaction.customId.startsWith('ticket_')) return;
        try {
            if (interaction.replied || interaction.deferred) return;
            if (interaction.customId === 'ticket_close') {
                await interaction.reply({ embeds: [{ color: 0xFF69B4, description: 'Le ticket sera fermé dans 5 secondes...' }], ephemeral: true });
                setTimeout(() => {
                    if (interaction.channel && interaction.channel.deletable) {
                        interaction.channel.delete().catch(() => {});
                    }
                }, 5000);
            } else {
                await createTicket(interaction, interaction.customId);
            }
        } catch (e) {
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: '❌ Erreur interne ou interaction expirée.', ephemeral: true });
            }
            console.error('Erreur ticket:', e);
        }
    }
}; 