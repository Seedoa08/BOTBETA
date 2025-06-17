const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, ChannelType } = require('discord.js');
const { readJson, writeJson } = require('../utils/fileManager');
const { sendError, sendSuccess } = require('../utils/functions');
const { logModerationAction } = require('../utils/logger');
const fs = require('fs');
const path = require('path');
const config = require('../config.json');

module.exports = {
    name: 'ticket',
    description: 'Gérer le système de tickets',
    usage: '+ticket <support|signalement|partenariat|panel|close|add|remove>',
    category: 'Tickets',
    permissions: 'ManageChannels',
    async execute(message, args) {
        if (!args[0]) {
            return message.reply('❌ Usage: `+ticket <support|signalement|partenariat|panel|close|add|remove>`');
        }

        const subCommand = args[0].toLowerCase();

        // Ajout des sous-commandes textuelles
        if (["support", "signalement", "partenariat"].includes(subCommand)) {
            await createTicketFromCommand(message, subCommand);
            return;
        }

        switch (subCommand) {
            case 'panel':
                await createTicketPanel(message);
                break;
            case 'close':
                await closeTicket(message);
                break;
            case 'add':
                await addUserToTicket(message, args[1]);
                break;
            case 'remove':
                await removeUserFromTicket(message, args[1]);
                break;
            default:
                message.reply('❌ Sous-commande invalide. Utilisez `support`, `signalement`, `partenariat`, `panel`, `close`, `add` ou `remove`.');
        }
    }
};

async function createTicketPanel(message) {
    const embed = new EmbedBuilder()
        .setColor('#FF69B4')
        .setTitle('🎫 Système de Tickets')
        .setDescription('Cliquez sur le bouton correspondant à votre besoin :')
        .addFields(
            { name: '❓ Support', value: 'Pour toute demande d\'aide' },
            { name: '🚨 Signalement', value: 'Pour signaler un comportement inapproprié' },
            { name: '🤝 Partenariat', value: 'Pour proposer un partenariat' }
        )
        .setFooter({ text: `Serveur de ${message.guild.name}` });

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('ticket_support')
                .setLabel('Support')
                .setEmoji('❓')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('ticket_report')
                .setLabel('Signalement')
                .setEmoji('🚨')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('ticket_partnership')
                .setLabel('Partenariat')
                .setEmoji('🤝')
                .setStyle(ButtonStyle.Success)
        );

    const sentMsg = await message.channel.send({ embeds: [embed], components: [row] });
    setTimeout(() => {
        sentMsg.edit({ components: [] }).catch(() => {});
    }, 15 * 60 * 1000); // 15 minutes
}

async function createTicket(interaction, type) {
    const ticketTypes = {
        'ticket_support': { name: 'Support', emoji: '❓' },
        'ticket_report': { name: 'Signalement', emoji: '🚨' },
        'ticket_partnership': { name: 'Partenariat', emoji: '🤝' }
    };

    const ticketType = ticketTypes[type];
    const channelName = `ticket-${interaction.user.username.toLowerCase()}`;

    // Vérifier si l'utilisateur a déjà un ticket ouvert
    const existingTicket = interaction.guild.channels.cache.find(
        channel => channel.name === channelName
    );

    if (existingTicket) {
        return interaction.reply({
            content: '❌ Vous avez déjà un ticket ouvert!',
            ephemeral: true
        });
    }

    // Créer le ticket
    const channel = await interaction.guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        permissionOverwrites: [
            {
                id: interaction.guild.id,
                deny: [PermissionFlagsBits.ViewChannel]
            },
            {
                id: interaction.user.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
            },
            {
                id: interaction.client.user.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
            }
        ]
    });

    const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('🎫 Ticket Support')
        .setDescription(`Bienvenue dans votre ticket de support, ${interaction.user} !`)
        .addFields(
            { 
                name: '📝 Instructions',
                value: 'Pour nous aider à résoudre votre problème plus rapidement, merci de fournir les informations suivantes :\n\n' +
                      '• Une description détaillée de votre problème\n' +
                      '• Les étapes pour reproduire le problème (si applicable)\n' +
                      '• Les messages d\'erreur (si applicable)\n' +
                      '• Toute autre information pertinente\n\n' +
                      'Un modérateur vous répondra dès que possible.'
            },
            {
                name: '⏰ Temps de réponse',
                value: 'Nous nous efforçons de répondre à tous les tickets dans les 24 heures.'
            },
            {
                name: '🔒 Confidentialité',
                value: 'Votre ticket est privé et ne sera visible que par vous et l\'équipe de modération.'
            }
        )
        .setFooter({ 
            text: `ID: ${channel.id} • Créé par ${interaction.user.tag}`,
            iconURL: interaction.user.displayAvatarURL({ dynamic: true })
        })
        .setTimestamp();

    // Ajouter un bouton pour fermer le ticket
    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('close_ticket')
                .setLabel('Fermer le ticket')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('🔒')
        );

    await channel.send({
        content: `${interaction.user} ${interaction.guild.roles.cache.find(r => r.name === 'Modérateur')}`,
        embeds: [embed],
        components: [row]
    });

    await interaction.reply({
        content: `✅ Votre ticket a été créé: ${channel}`,
        ephemeral: true
    });
}

async function generateTranscript(channel) {
    const messages = await channel.messages.fetch({ limit: 100 });
    const sorted = Array.from(messages.values()).sort((a, b) => a.createdTimestamp - b.createdTimestamp);
    let transcript = `Transcript du ticket #${channel.name}\n\n`;
    for (const msg of sorted) {
        transcript += `[${new Date(msg.createdTimestamp).toLocaleString()}] ${msg.author.tag}: ${msg.content}\n`;
    }
    return transcript;
}

async function closeTicket(message) {
    if (!message.channel.name.startsWith('ticket-')) {
        return message.reply('❌ Cette commande ne peut être utilisée que dans un ticket!');
    }

    // Générer le transcript
    const transcript = await generateTranscript(message.channel);
    // Envoyer le transcript dans le salon staff
    const staffLogId = config.ticketTranscriptChannelId;
    if (staffLogId) {
        const staffChannel = message.guild.channels.cache.get(staffLogId);
        if (staffChannel) {
            await staffChannel.send({
                content: `Transcript du ticket ${message.channel.name} fermé par ${message.author} :`,
                files: [{ attachment: Buffer.from(transcript, 'utf-8'), name: `${message.channel.name}_transcript.txt` }]
            });
        }
    }
    // Log de la fermeture
    await logModerationAction(message.guild, message.author, null, 'ticket-close', `Ticket ${message.channel.name} fermé`);

    const embed = new EmbedBuilder()
        .setColor('#FF69B4')
        .setDescription('Le ticket sera fermé dans 5 secondes...');
    await message.channel.send({ embeds: [embed] });
    setTimeout(() => {
        message.channel.delete();
    }, 5000);
}

async function addUserToTicket(message, userId) {
    if (!message.channel.name.startsWith('ticket-')) {
        return message.reply('❌ Cette commande ne peut être utilisée que dans un ticket!');
    }

    if (!userId) {
        return message.reply('❌ Veuillez mentionner un utilisateur!');
    }

    const user = message.mentions.users.first() || await message.client.users.fetch(userId).catch(() => null);
    if (!user) {
        return message.reply('❌ Utilisateur non trouvé!');
    }

    await message.channel.permissionOverwrites.create(user, {
        ViewChannel: true,
        SendMessages: true
    });

    message.reply(`✅ ${user} a été ajouté au ticket!`);
}

async function removeUserFromTicket(message, userId) {
    if (!message.channel.name.startsWith('ticket-')) {
        return message.reply('❌ Cette commande ne peut être utilisée que dans un ticket!');
    }

    if (!userId) {
        return message.reply('❌ Veuillez mentionner un utilisateur!');
    }

    const user = message.mentions.users.first() || await message.client.users.fetch(userId).catch(() => null);
    if (!user) {
        return message.reply('❌ Utilisateur non trouvé!');
    }

    await message.channel.permissionOverwrites.delete(user);

    message.reply(`✅ ${user} a été retiré du ticket!`);
}

async function createTicketFromCommand(message, type) {
    const ticketTypes = {
        support: {
            emoji: '🎫',
            color: '#00FF00',
            title: 'Ticket Support',
            description: 'Pour nous aider à résoudre votre problème plus rapidement, merci de fournir les informations suivantes :\n\n' +
                       '• Une description détaillée de votre problème\n' +
                       '• Les étapes pour reproduire le problème (si applicable)\n' +
                       '• Les messages d\'erreur (si applicable)\n' +
                       '• Toute autre information pertinente'
        },
        signalement: {
            emoji: '⚠️',
            color: '#FF0000',
            title: 'Ticket Signalement',
            description: 'Pour traiter votre signalement efficacement, merci de fournir les informations suivantes :\n\n' +
                       '• L\'identité du membre concerné\n' +
                       '• La raison du signalement\n' +
                       '• Les preuves (captures d\'écran, liens, etc.)\n' +
                       '• La date et l\'heure de l\'incident'
        },
        partenariat: {
            emoji: '🤝',
            color: '#0000FF',
            title: 'Ticket Partenariat',
            description: 'Pour étudier votre demande de partenariat, merci de fournir les informations suivantes :\n\n' +
                       '• Le nom de votre serveur\n' +
                       '• Le nombre de membres\n' +
                       '• La description de votre serveur\n' +
                       '• Vos attentes concernant ce partenariat'
        }
    };

    const ticketType = ticketTypes[type] || ticketTypes.support;
    const channelName = `ticket-${type}-${message.author.username.toLowerCase()}`;

    // Vérifier si l'utilisateur a déjà un ticket ouvert de ce type
    const existingTicket = message.guild.channels.cache.find(
        channel => channel.name === channelName
    );

    if (existingTicket) {
        return message.reply('❌ Vous avez déjà un ticket ouvert pour ce type!');
    }

    // Créer le ticket
    const channel = await message.guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        permissionOverwrites: [
            {
                id: message.guild.id,
                deny: [PermissionFlagsBits.ViewChannel]
            },
            {
                id: message.author.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
            },
            {
                id: message.client.user.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
            }
        ]
    });

    const embed = new EmbedBuilder()
        .setColor(ticketType.color)
        .setTitle(`${ticketType.emoji} ${ticketType.title}`)
        .setDescription(`Bienvenue dans votre ticket ${ticketType.title.toLowerCase()}, ${message.author} !`)
        .addFields(
            { 
                name: '📝 Instructions',
                value: ticketType.description + '\n\nUn modérateur vous répondra dès que possible.'
            },
            {
                name: '⏰ Temps de réponse',
                value: 'Nous nous efforçons de répondre à tous les tickets dans les 24 heures.'
            },
            {
                name: '🔒 Confidentialité',
                value: 'Votre ticket est privé et ne sera visible que par vous et l\'équipe de modération.'
            }
        )
        .setFooter({ 
            text: `ID: ${channel.id} • Créé par ${message.author.tag}`,
            iconURL: message.author.displayAvatarURL({ dynamic: true })
        })
        .setTimestamp();

    // Ajouter un bouton pour fermer le ticket
    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('close_ticket')
                .setLabel('Fermer le ticket')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('🔒')
        );

    await channel.send({
        content: `${message.author} ${message.guild.roles.cache.find(r => r.name === 'Modérateur')}`,
        embeds: [embed],
        components: [row]
    });

    message.reply(`✅ Votre ticket **${ticketType.title}** a été créé : <#${channel.id}>`);
}
