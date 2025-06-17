const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const { readJson, writeJson } = require('../utils/fileManager');
const { sendError, sendSuccess } = require('../utils/functions');
const { logModerationAction } = require('../utils/logger');
const config = require('../config/commands');

module.exports = {
    name: 'unban',
    description: 'Débannir un utilisateur du serveur',
    usage: '+unban <ID> [raison]',
    category: 'Modération',
    permissions: ['BanMembers'],
    cooldown: 5,
    async execute(message, args) {
        try {
            // Vérification des permissions
            if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
                return message.reply('❌ Vous n\'avez pas la permission de débannir des membres.');
            }

            // Vérification des arguments
            if (!args[0]) {
                return message.reply(`❌ Usage: \`${this.usage}\`\nExemple: \`+unban 123456789 Spam\``);
            }

            // Récupération de l'ID
            const userId = args[0];
            if (!/^\d{17,19}$/.test(userId)) {
                return message.reply('❌ ID d\'utilisateur invalide.');
            }

            // Récupération de la raison
            const reason = args.slice(1).join(' ') || 'Aucune raison spécifiée';

            // Vérification si l'utilisateur est banni
            const bans = await message.guild.bans.fetch();
            const bannedUser = bans.find(ban => ban.user.id === userId);

            if (!bannedUser) {
                return message.reply('❌ Cet utilisateur n\'est pas banni.');
            }

            // Débannissement
            await message.guild.members.unban(userId, `${message.author.tag}: ${reason}`);

            // Création de l'embed
            const embed = new EmbedBuilder()
                .setColor(config.categories.moderation.color)
                .setTitle('🔓 Débannissement')
                .addFields(
                    { name: 'Utilisateur', value: `${bannedUser.user.tag} (${userId})` },
                    { name: 'Modérateur', value: message.author.tag },
                    { name: 'Raison', value: reason }
                )
                .setTimestamp();

            // Envoi du message de confirmation
            await message.reply({ embeds: [embed] });

            // Message privé à l'utilisateur
            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor(config.categories.moderation.color)
                    .setTitle(`🔓 Vous avez été débanni de ${message.guild.name}`)
                    .addFields(
                        { name: 'Raison', value: reason },
                        { name: 'Modérateur', value: message.author.tag }
                    )
                    .setTimestamp();

                await bannedUser.user.send({ embeds: [dmEmbed] });
            } catch (error) {
                Logger.warn('unban', `Impossible d'envoyer un message privé à ${bannedUser.user.tag}`);
            }

            // Log de l'action
            logModerationAction(message.guild.id, userId, message.author.id, reason);

        } catch (error) {
            Logger.error('unban', error);
            return message.reply('❌ Une erreur est survenue lors du débannissement.');
        }
    }
}; 