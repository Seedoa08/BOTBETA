const { PermissionsBitField } = require('discord.js');
const isOwner = require('../utils/isOwner');

module.exports = {
    name: 'audit',
    description: 'Affiche les logs d\'audit du serveur',
    usage: '+audit [nombre]',
    permissions: 'ViewAuditLog',
    
    async execute(message, args) {
        // Bypass pour les owners
        if (!isOwner(message.author.id) && !message.member.permissions.has(PermissionsBitField.Flags.ViewAuditLog)) {
            return message.reply('❌ Vous n\'avez pas la permission de voir les logs d\'audit.');
        }
        
        try {
            const auditLogs = await message.guild.fetchAuditLogs({ limit: 10 });
            const entries = auditLogs.entries.map(entry => {
                return `**Action:** ${entry.action}\n**Utilisateur:** ${entry.executor.tag}\n**Cible:** ${entry.target?.tag || 'N/A'}\n**Date:** <t:${Math.floor(entry.createdTimestamp / 1000)}:F>`;
            });

            const embed = {
                color: 0x0099ff,
                title: '📋 Logs récents',
                description: entries.join('\n\n') || 'Aucun log récent.',
                footer: {
                    text: `Demandé par ${message.author.tag}`,
                    icon_url: message.author.displayAvatarURL({ dynamic: true })
                },
                timestamp: new Date()
            };

            message.channel.send({ embeds: [embed] });
        } catch (error) {
            console.error('Erreur lors de la récupération des logs d\'audit:', error);
            message.reply('❌ Une erreur est survenue lors de la récupération des logs d\'audit.');
        }
    }
};
