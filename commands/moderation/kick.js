const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const config = require('../../config/commands');
const Logger = require('../../utils/logger');
const PermissionHandler = require('../../utils/permissionHandler');

module.exports = {
    name: 'kick',
    description: 'Expulser un utilisateur du serveur',
    usage: '+kick <@utilisateur> [raison]',
    category: 'Modération',
    permissions: 'KickMembers',
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

        // Récupérer le membre
        const member = message.guild.members.cache.get(user.id);
        if (!member) {
            return message.reply('❌ Cet utilisateur n\'est pas sur le serveur.');
        }

        // Vérifier si l'utilisateur peut être expulsé
        if (!member.kickable) {
            return message.reply('❌ Je ne peux pas expulser cet utilisateur.');
        }

        if (message.member.roles.highest.position <= member.roles.highest.position) {
            return message.reply('❌ Vous ne pouvez pas expulser quelqu\'un avec un rôle supérieur ou égal au vôtre.');
        }

        // Récupérer la raison
        const reason = args.slice(1).join(' ') || 'Aucune raison spécifiée';

        try {
            // Créer l'embed d'expulsion
            const kickEmbed = new EmbedBuilder()
                .setColor(config.logging.colors.warning)
                .setTitle('👢 Expulsion')
                .addFields(
                    { name: 'Utilisateur', value: `${user.tag} (${user.id})` },
                    { name: 'Modérateur', value: `${message.author.tag} (${message.author.id})` },
                    { name: 'Raison', value: reason }
                )
                .setTimestamp();

            // Envoyer un message à l'utilisateur avant l'expulsion
            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor(config.logging.colors.warning)
                    .setTitle(`👢 Vous avez été expulsé de ${message.guild.name}`)
                    .addFields(
                        { name: 'Raison', value: reason },
                        { name: 'Modérateur', value: message.author.tag }
                    )
                    .setTimestamp();

                await user.send({ embeds: [dmEmbed] });
            } catch (error) {
                console.error('Impossible d\'envoyer un message à l\'utilisateur:', error);
            }

            // Expulser l'utilisateur
            await member.kick(reason);
            
            // Envoyer le message de confirmation
            await message.reply({ embeds: [kickEmbed] });

            // Logger l'action
            await logger.logModeration('Expulsion', message.author, user, reason);

        } catch (error) {
            console.error('Erreur lors de l\'expulsion:', error);
            return message.reply('❌ Une erreur est survenue lors de l\'expulsion.');
        }
    }
}; 