const { EmbedBuilder } = require('discord.js');
const { readJson, writeJson } = require('../utils/fileManager');
const { logError } = require('../utils/logger');
const path = require('path');

module.exports = {
    name: 'modlogs',
    description: 'Affiche les logs de modération',
    usage: '+modlogs [user/all] [nombre]',
    permissions: 'ManageMessages',
    async execute(message, args) {
        try {
            const logsPath = path.join(__dirname, '../logs/moderation.json');
            const logs = readJson(logsPath, '[]');
            const user = message.mentions.users.first();
            const amount = parseInt(args[1]) || 10;

            let filteredLogs = logs;
            if (user) {
                filteredLogs = logs.filter(log => log.user.id === user.id);
            }

            // Vérifier s'il y a des logs
            if (filteredLogs.length === 0) {
                const noLogsEmbed = new EmbedBuilder()
                    .setColor(0x0099ff)
                    .setTitle('📋 Logs de modération')
                    .setDescription('Aucun log de modération trouvé.')
                    .addFields({
                        name: '📋 Commande',
                        value: 'Pour voir les logs d\'un utilisateur : `+modlogs @utilisateur [nombre]`\nPour voir tous les logs : `+modlogs all [nombre]`'
                    });
                return message.reply({ embeds: [noLogsEmbed] });
            }

            // Formater les logs
            const formattedLogs = filteredLogs.slice(-amount).map(log => 
                `**${log.action}** - ${log.user.tag}\n📅 ${new Date(log.date).toLocaleString()}\n📝 ${log.reason || 'Pas de raison'}`
            );

            // Diviser les logs en chunks si nécessaire (Discord limite à 4096 caractères)
            const chunks = [];
            let currentChunk = [];
            let currentLength = 0;

            for (const log of formattedLogs) {
                if (currentLength + log.length + 2 > 4000) { // 2 pour les sauts de ligne
                    chunks.push(currentChunk.join('\n\n'));
                    currentChunk = [];
                    currentLength = 0;
                }
                currentChunk.push(log);
                currentLength += log.length + 2;
            }
            if (currentChunk.length > 0) {
                chunks.push(currentChunk.join('\n\n'));
            }

            // Envoyer le premier embed
            const embed = new EmbedBuilder()
                .setColor(0x0099ff)
                .setTitle('📋 Logs de modération')
                .setDescription(chunks[0])
                .addFields({
                    name: '📋 Commande',
                    value: 'Pour voir les logs d\'un utilisateur : `+modlogs @utilisateur [nombre]`\nPour voir tous les logs : `+modlogs all [nombre]`'
                });

            const reply = await message.reply({ embeds: [embed] });

            // Envoyer les chunks supplémentaires si nécessaire
            for (let i = 1; i < chunks.length; i++) {
                const additionalEmbed = new EmbedBuilder()
                    .setColor(0x0099ff)
                    .setTitle(`📋 Logs de modération (Suite ${i + 1}/${chunks.length})`)
                    .setDescription(chunks[i]);
                await message.channel.send({ embeds: [additionalEmbed] });
            }
        } catch (error) {
            logError(error);
            message.reply('❌ Une erreur est survenue lors de la lecture des logs.');
        }
    }
};
