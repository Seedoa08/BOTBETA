const { PermissionsBitField, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const isOwner = require('../utils/isOwner');

const logsPath = path.join(__dirname, '../data/moderation-logs.json');

module.exports = {
    name: 'history',
    description: 'Affiche l\'historique des actions de modération',
    usage: '+history [utilisateur] [nombre]',
    category: 'Modération',
    permissions: 'ViewAuditLog',
    async execute(message, args) {
        // Vérification des permissions
        if (!isOwner(message.author.id) && !message.member.permissions.has(PermissionsBitField.Flags.ViewAuditLog)) {
            return message.reply('❌ Vous n\'avez pas la permission de voir l\'historique.');
        }

        try {
            // Créer le dossier data s'il n'existe pas
            const dataDir = path.join(__dirname, '../data');
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }

            // Créer le fichier de logs s'il n'existe pas
            if (!fs.existsSync(logsPath)) {
                fs.writeFileSync(logsPath, JSON.stringify([], null, 4));
            }

            const logs = JSON.parse(fs.readFileSync(logsPath, 'utf8'));
            let filteredLogs = [...logs];
            let targetUser = null;

            // Filtrer par utilisateur si spécifié
            if (message.mentions.users.size > 0) {
                targetUser = message.mentions.users.first();
                filteredLogs = logs.filter(log => log.user?.id === targetUser.id);
            }

            // Limiter le nombre d'entrées si spécifié
            const limit = parseInt(args[args.length - 1]) || 10;
            filteredLogs = filteredLogs.slice(-Math.min(limit, 25));

            const embed = new EmbedBuilder()
                .setColor(0x0099ff)
                .setTitle('📋 Historique de modération')
                .setDescription(targetUser ? `Historique pour ${targetUser.tag}` : 'Historique global')
                .addFields(
                    filteredLogs.map(log => ({
                        name: `${log.action.toUpperCase()} - ${new Date(log.date).toLocaleString()}`,
                        value: [
                            `**Utilisateur:** ${log.user?.tag || 'Inconnu'}`,
                            `**Modérateur:** ${log.moderator?.tag || 'Système'}`,
                            `**Raison:** ${log.reason || 'Non spécifiée'}`,
                            log.duration ? `**Durée:** ${log.duration}` : ''
                        ].filter(Boolean).join('\n')
                    }))
                )
                .setFooter({
                    text: `${filteredLogs.length} action(s) • Demandé par ${message.author.tag}`,
                    iconURL: message.author.displayAvatarURL({ dynamic: true })
                })
                .setTimestamp();

            if (filteredLogs.length === 0) {
                embed.setDescription('Aucune action de modération trouvée.');
            }

            await message.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Erreur lors de la lecture de l\'historique:', error);
            message.reply('❌ Une erreur est survenue lors de la lecture de l\'historique.');
        }
    }
};
