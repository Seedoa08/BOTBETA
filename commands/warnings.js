const { EmbedBuilder } = require('discord.js');
const { readJson, writeJson } = require('../utils/fileManager');
const { logError } = require('../utils/logger');
const path = require('path');
const { PermissionsBitField } = require('discord.js');
const isOwner = require('../utils/isOwner');

module.exports = {
    name: 'warnings',
    description: 'Affiche les avertissements d\'un utilisateur',
    usage: '+warnings <@utilisateur>',
    permissions: 'ManageMessages',
    variables: [
        { name: '@utilisateur', description: 'Mention de l\'utilisateur pour voir ses avertissements.' }
    ],
    async execute(message, args) {
        // Bypass des permissions pour les owners
        if (!isOwner(message.author.id) && !message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            return message.reply('❌ Vous n\'avez pas la permission de voir les avertissements.');
        }

        try {
            const warningsPath = path.join(__dirname, '../data/warnings.json');
            const warnings = readJson(warningsPath, '{}');
            const user = message.mentions.users.first();
            if (!user) return message.reply('❌ Veuillez mentionner un utilisateur.');
            const userWarnings = warnings[user.id] || [];
            if (userWarnings.length === 0) {
                return message.reply('✅ Cet utilisateur n\'a aucun avertissement.');
            }
            const embed = new EmbedBuilder()
                .setColor(0xffcc00)
                .setTitle(`Avertissements de ${user.tag}`)
                .setDescription(userWarnings.map((warn, i) => `**#${i+1}** - ${warn.reason} (par <@${warn.moderator}>, ${new Date(warn.date).toLocaleString()})`).join('\n'));
            message.reply({ embeds: [embed] });
        } catch (error) {
            logError(error);
            message.reply('❌ Une erreur est survenue lors de la lecture des avertissements.');
        }
    }
};
