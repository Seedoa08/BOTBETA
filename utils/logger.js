const { EmbedBuilder } = require('discord.js');
const config = require('../config/commands');
const fs = require('fs');
const path = require('path');
const logFile = path.join(__dirname, '../logs/bot.log');

class Logger {
    constructor(client) {
        this.client = client;
        this.logChannels = {
            moderation: null,
            errors: null,
            server: null
        };
    }

    async initialize() {
        // Trouver les canaux de logs dans tous les serveurs
        const guilds = this.client.guilds.cache;
        for (const guild of guilds.values()) {
            for (const [type, channelName] of Object.entries(config.logging.channels)) {
                const channel = guild.channels.cache.find(ch => ch.name === channelName);
                if (channel) {
                    this.logChannels[type] = channel;
                }
            }
        }
    }

    // Logger un événement de modération
    async logModeration(action, moderator, target, reason, duration = null) {
        if (!this.logChannels.moderation) return;

        const embed = new EmbedBuilder()
            .setColor(config.logging.colors.warning)
            .setTitle(`🛡️ Action de Modération: ${action}`)
            .addFields(
                { name: 'Modérateur', value: `${moderator.tag} (${moderator.id})` },
                { name: 'Utilisateur', value: `${target.tag} (${target.id})` },
                { name: 'Raison', value: reason || 'Non spécifiée' }
            )
            .setTimestamp();

        if (duration) {
            embed.addFields({ name: 'Durée', value: duration });
        }

        try {
            await this.logChannels.moderation.send({ embeds: [embed] });
        } catch (error) {
            console.error('Erreur lors de l\'envoi du log de modération:', error);
        }
    }

    // Logger un événement serveur
    async logServer(event, data) {
        if (!this.logChannels.server) return;

        const embed = new EmbedBuilder()
            .setColor(config.logging.colors.info)
            .setTitle(`📊 Événement Serveur: ${event}`)
            .setDescription(JSON.stringify(data, null, 2))
            .setTimestamp();

        try {
            await this.logChannels.server.send({ embeds: [embed] });
        } catch (error) {
            console.error('Erreur lors de l\'envoi du log serveur:', error);
        }
    }

    // Logger un message supprimé
    async logDeletedMessage(message) {
        if (!this.logChannels.moderation) return;

        const embed = new EmbedBuilder()
            .setColor(config.logging.colors.warning)
            .setTitle('🗑️ Message Supprimé')
            .addFields(
                { name: 'Auteur', value: `${message.author.tag} (${message.author.id})` },
                { name: 'Canal', value: `${message.channel.name} (${message.channel.id})` },
                { name: 'Contenu', value: message.content || 'Aucun contenu' }
            )
            .setTimestamp();

        if (message.attachments.size > 0) {
            embed.addFields({ 
                name: 'Pièces jointes', 
                value: message.attachments.map(a => a.url).join('\n') 
            });
        }

        try {
            await this.logChannels.moderation.send({ embeds: [embed] });
        } catch (error) {
            console.error('Erreur lors de l\'envoi du log de message supprimé:', error);
        }
    }

    // Logger un message modifié
    async logEditedMessage(oldMessage, newMessage) {
        if (!this.logChannels.moderation) return;

        const embed = new EmbedBuilder()
            .setColor(config.logging.colors.info)
            .setTitle('✏️ Message Modifié')
            .addFields(
                { name: 'Auteur', value: `${oldMessage.author.tag} (${oldMessage.author.id})` },
                { name: 'Canal', value: `${oldMessage.channel.name} (${oldMessage.channel.id})` },
                { name: 'Avant', value: oldMessage.content || 'Aucun contenu' },
                { name: 'Après', value: newMessage.content || 'Aucun contenu' }
            )
            .setTimestamp();

        try {
            await this.logChannels.moderation.send({ embeds: [embed] });
        } catch (error) {
            console.error('Erreur lors de l\'envoi du log de message modifié:', error);
        }
    }

    // Logger un membre qui rejoint
    async logMemberJoin(member) {
        if (!this.logChannels.server) return;

        const embed = new EmbedBuilder()
            .setColor(config.logging.colors.success)
            .setTitle('👋 Nouveau Membre')
            .addFields(
                { name: 'Utilisateur', value: `${member.user.tag} (${member.user.id})` },
                { name: 'Compte créé le', value: member.user.createdAt.toLocaleString() }
            )
            .setThumbnail(member.user.displayAvatarURL())
            .setTimestamp();

        try {
            await this.logChannels.server.send({ embeds: [embed] });
        } catch (error) {
            console.error('Erreur lors de l\'envoi du log de nouveau membre:', error);
        }
    }

    // Logger un membre qui quitte
    async logMemberLeave(member) {
        if (!this.logChannels.server) return;

        const embed = new EmbedBuilder()
            .setColor(config.logging.colors.error)
            .setTitle('👋 Membre Parti')
            .addFields(
                { name: 'Utilisateur', value: `${member.user.tag} (${member.user.id})` },
                { name: 'A rejoint le', value: member.joinedAt.toLocaleString() }
            )
            .setThumbnail(member.user.displayAvatarURL())
            .setTimestamp();

        try {
            await this.logChannels.server.send({ embeds: [embed] });
        } catch (error) {
            console.error('Erreur lors de l\'envoi du log de membre parti:', error);
        }
    }
}

function log(message) {
    const line = `[${new Date().toISOString()}] ${message}\n`;
    fs.appendFileSync(logFile, line, 'utf8');
    console.log(line);
}

function logError(error) {
    log(`ERROR: ${error.stack || error}`);
}

async function logModerationAction(guild, moderator, target, action, reason) {
    try {
        const logChannelId = config.moderationLogChannelId;
        if (!logChannelId) return;
        const channel = guild.channels.cache.get(logChannelId);
        if (!channel) return;
        const embed = new EmbedBuilder()
            .setColor(0xffcc00)
            .setTitle('Action de modération')
            .addFields(
                { name: 'Action', value: action, inline: true },
                { name: 'Modérateur', value: moderator ? `<@${moderator.id}>` : 'Inconnu', inline: true },
                { name: 'Cible', value: target ? `<@${target.id || target}>` : 'Inconnu', inline: true },
                { name: 'Raison', value: reason || 'Non spécifiée', inline: false }
            )
            .setTimestamp();
        await channel.send({ embeds: [embed] });
    } catch (e) {
        logError(e);
    }
}

module.exports = { Logger, log, logError, logModerationAction }; 