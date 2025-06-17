const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const config = require('../../config/commands');
const Logger = require('../../utils/logger');
const PermissionHandler = require('../../utils/permissionHandler');

module.exports = {
    name: 'ban',
    description: 'Bannir un utilisateur du serveur',
    usage: '+ban <@utilisateur> [raison]',
    category: 'Modération',
    permissions: 'BanMembers',
    cooldown: 5,
    async execute(message, args) {
        const logger = new Logger(message.client);
        const permissionHandler = new PermissionHandler(message.client);

        // Vérifier les permissions
        if (!await permissionHandler.checkPermissions(message.member, this)) {
            return message.reply(config.errorMessages.noPermission);
        }

        // Vérifier les arguments
        if (!args[0]) {
            return message.reply(`❌ Usage: \`${this.usage}\``);
        }

        // Récupérer l'utilisateur
        const user = message.mentions.users.first() || await message.client.users.fetch(args[0]).catch(() => null);
        if (!user) {
            return message.reply(config.errorMessages.userNotFound);
        }

        // Vérifier si l'utilisateur peut être banni
        const member = message.guild.members.cache.get(user.id);
        if (member) {
            if (!member.bannable) {
                return message.reply('❌ Je ne peux pas bannir cet utilisateur.');
            }

            if (message.member.roles.highest.position <= member.roles.highest.position) {
                return message.reply('❌ Vous ne pouvez pas bannir quelqu\'un avec un rôle supérieur ou égal au vôtre.');
            }
        }

        // Récupérer la raison
        const reason = args.slice(1).join(' ') || 'Aucune raison spécifiée';

        try {
            // Créer l'embed de bannissement
            const banEmbed = new EmbedBuilder()
                .setColor(config.logging.colors.error)
                .setTitle('🔨 Bannissement')
                .addFields(
                    { name: 'Utilisateur', value: `${user.tag} (${user.id})` },
                    { name: 'Modérateur', value: `${message.author.tag} (${message.author.id})` },
                    { name: 'Raison', value: reason }
                )
                .setTimestamp();

            // Bannir l'utilisateur
            await message.guild.members.ban(user, { reason: reason });
            
            // Envoyer le message de confirmation
            await message.reply({ embeds: [banEmbed] });

            // Logger l'action
            await logger.logModeration('Bannissement', message.author, user, reason);

            // Envoyer un message à l'utilisateur banni
            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor(config.logging.colors.error)
                    .setTitle(`🔨 Vous avez été banni de ${message.guild.name}`)
                    .addFields(
                        { name: 'Raison', value: reason },
                        { name: 'Modérateur', value: message.author.tag }
                    )
                    .setTimestamp();

                await user.send({ embeds: [dmEmbed] });
            } catch (error) {
                console.error('Impossible d\'envoyer un message à l\'utilisateur banni:', error);
            }

        } catch (error) {
            console.error('Erreur lors du bannissement:', error);
            return message.reply('❌ Une erreur est survenue lors du bannissement.');
        }
    }
}; 