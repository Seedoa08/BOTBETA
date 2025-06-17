const { Events, ChannelType, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Logger = require('../utils/logger');
const config = require('../config/commands');
const { createModerationEmbed, logAction, logError } = require('../utils/functions');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (!interaction.isButton()) return;

        try {
            switch (interaction.customId) {
                case 'create_ticket':
                    await handleTicketCreation(interaction);
                    break;
                case 'close_ticket':
                    await handleTicketClosure(interaction);
                    break;
            }
        } catch (error) {
            logError('ticket', error);
            await interaction.reply({ content: config.messages.error, ephemeral: true }).catch(() => {});
        }
    }
};

async function handleTicketCreation(interaction) {
    // Vérification si l'utilisateur a déjà un ticket ouvert
    const existingTicket = interaction.guild.channels.cache.find(
        channel => channel.name === `ticket-${interaction.user.id}`
    );

    if (existingTicket) {
        return interaction.reply({
            content: '❌ Vous avez déjà un ticket ouvert.',
            ephemeral: true
        });
    }

    // Création du salon de ticket
    const ticketChannel = await interaction.guild.channels.create({
        name: `ticket-${interaction.user.id}`,
        type: ChannelType.GuildText,
        parent: interaction.channel.parent,
        permissionOverwrites: [
            {
                id: interaction.guild.id,
                deny: [PermissionFlagsBits.ViewChannel]
            },
            {
                id: interaction.user.id,
                allow: [
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.SendMessages,
                    PermissionFlagsBits.ReadMessageHistory
                ]
            },
            {
                id: interaction.guild.members.me.id,
                allow: [
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.ManageChannels,
                    PermissionFlagsBits.SendMessages,
                    PermissionFlagsBits.ReadMessageHistory
                ]
            }
        ]
    });

    // Création du bouton de fermeture
    const button = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('close_ticket')
                .setLabel('Fermer le ticket')
                .setEmoji('🔒')
                .setStyle(ButtonStyle.Danger)
        );

    // Création de l'embed
    const embed = createModerationEmbed('🎫 Ticket Créé', [
        { name: 'Utilisateur', value: interaction.user.toString() },
        { name: 'Instructions', value: 'Un modérateur vous répondra dès que possible. Vous pouvez fermer ce ticket à tout moment en cliquant sur le bouton ci-dessous.' }
    ]);

    // Envoi du message
    await ticketChannel.send({ embeds: [embed], components: [button] });

    // Réponse à l'interaction
    await interaction.reply({
        content: `✅ Votre ticket a été créé: ${ticketChannel}`,
        ephemeral: true
    });

    // Log de l'action
    logAction('ticket', {
        guildId: interaction.guild.id,
        channelId: ticketChannel.id,
        userId: interaction.user.id,
        action: 'create'
    });
}

async function handleTicketClosure(interaction) {
    // Vérification si le salon est un ticket
    if (!interaction.channel.name.startsWith('ticket-')) {
        return interaction.reply({
            content: '❌ Cette commande ne peut être utilisée que dans un ticket.',
            ephemeral: true
        });
    }

    // Création de l'embed
    const embed = createModerationEmbed('🔒 Ticket Fermé', [
        { name: 'Ticket', value: interaction.channel.toString() },
        { name: 'Utilisateur', value: interaction.user.toString() }
    ]);

    // Envoi du message
    await interaction.channel.send({ embeds: [embed] });

    // Suppression des permissions
    await interaction.channel.permissionOverwrites.set([
        {
            id: interaction.guild.id,
            deny: [PermissionFlagsBits.ViewChannel]
        },
        {
            id: interaction.guild.members.me.id,
            allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.ManageChannels,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ReadMessageHistory
            ]
        }
    ]);

    // Log de l'action
    logAction('ticket', {
        guildId: interaction.guild.id,
        channelId: interaction.channel.id,
        userId: interaction.user.id,
        action: 'close'
    });

    // Suppression du salon après 5 secondes
    setTimeout(async () => {
        try {
            await interaction.channel.delete();
        } catch (error) {
            logError('ticket', error);
        }
    }, 5000);
} 