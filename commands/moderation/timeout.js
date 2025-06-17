const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const ms = require('ms');
const config = require('../../config/commands');
const Logger = require('../../utils/logger');
const PermissionHandler = require('../../utils/permissionHandler');

module.exports = {
    name: 'timeout',
    description: 'Mettre en timeout un utilisateur',
    usage: '+timeout <@utilisateur> <durée> [raison]',
    category: 'Modération',
    permissions: 'ModerateMembers',
    cooldown: 5,
    async execute(message, args) {
        const logger = new Logger(message.client);
        const permissionHandler = new PermissionHandler(message.client);

        // Vérifier les permissions
        if (!await permissionHandler.checkPermissions(message.member, this)) {
            return message.reply(config.errorMessages.noPermission);
        }

        // Vérifier les arguments
        if (!args[0] || !args[1]) {
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

        // Vérifier si l'utilisateur peut être mis en timeout
        if (!member.moderatable) {
            return message.reply('❌ Je ne peux pas mettre en timeout cet utilisateur.');
        }

        if (message.member.roles.highest.position <= member.roles.highest.position) {
            return message.reply('❌ Vous ne pouvez pas mettre en timeout quelqu\'un avec un rôle supérieur ou égal au vôtre.');
        }

        // Convertir la durée en millisecondes
        const duration = ms(args[1]);
        if (!duration || duration < 1000 || duration > 2419200000) { // Max 28 jours
            return message.reply('❌ Durée invalide. Utilisez un format valide (ex: 1h, 30m, 1d) et une durée entre 1 seconde et 28 jours.');
        }

        // Récupérer la raison
        const reason = args.slice(2).join(' ') || 'Aucune raison spécifiée';

        try {
            // Créer l'embed de timeout
            const timeoutEmbed = new EmbedBuilder()
                .setColor(config.logging.colors.warning)
                .setTitle('⏰ Timeout')
                .addFields(
                    { name: 'Utilisateur', value: `${user.tag} (${user.id})` },
                    { name: 'Modérateur', value: `${message.author.tag} (${message.author.id})` },
                    { name: 'Durée', value: args[1] },
                    { name: 'Raison', value: reason }
                )
                .setTimestamp();

            // Mettre en timeout l'utilisateur
            await member.timeout(duration, reason);
            
            // Envoyer le message de confirmation
            await message.reply({ embeds: [timeoutEmbed] });

            // Logger l'action
            await logger.logModeration('Timeout', message.author, user, reason, args[1]);

            // Envoyer un message à l'utilisateur
            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor(config.logging.colors.warning)
                    .setTitle(`⏰ Vous avez été mis en timeout sur ${message.guild.name}`)
                    .addFields(
                        { name: 'Durée', value: args[1] },
                        { name: 'Raison', value: reason },
                        { name: 'Modérateur', value: message.author.tag }
                    )
                    .setTimestamp();

                await user.send({ embeds: [dmEmbed] });
            } catch (error) {
                console.error('Impossible d\'envoyer un message à l\'utilisateur:', error);
            }

        } catch (error) {
            console.error('Erreur lors du timeout:', error);
            return message.reply('❌ Une erreur est survenue lors du timeout.');
        }
    }
}; 