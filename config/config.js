const { PermissionsBitField } = require('discord.js');

module.exports = {
    // Configuration des permissions
    permissions: {
        moderation: {
            ban: PermissionsBitField.Flags.BanMembers,
            kick: PermissionsBitField.Flags.KickMembers,
            mute: PermissionsBitField.Flags.ModerateMembers,
            warn: PermissionsBitField.Flags.ModerateMembers,
            clear: PermissionsBitField.Flags.ManageMessages,
            lock: PermissionsBitField.Flags.ManageChannels,
            slowmode: PermissionsBitField.Flags.ManageChannels,
            role: PermissionsBitField.Flags.ManageRoles,
            ticket: PermissionsBitField.Flags.ManageChannels,
            giveaway: PermissionsBitField.Flags.ManageMessages
        }
    },

    // Configuration des couleurs
    colors: {
        success: '#00ff00',
        error: '#ff0000',
        warning: '#ffff00',
        info: '#0099ff',
        moderation: '#ff9900'
    },

    // Configuration des durées
    durations: {
        mute: {
            min: 1000, // 1 seconde
            max: 2419200000 // 28 jours
        },
        slowmode: {
            min: 0,
            max: 21600000 // 6 heures
        },
        lock: {
            min: 1000,
            max: 2592000000 // 30 jours
        },
        giveaway: {
            min: 10000, // 10 secondes
            max: 2592000000 // 30 jours
        }
    },

    // Configuration des limites
    limits: {
        clear: {
            min: 1,
            max: 100
        },
        giveaway: {
            winners: {
                min: 1,
                max: 10
            }
        }
    },

    // Configuration des messages
    messages: {
        noPermission: '❌ Vous n\'avez pas la permission d\'utiliser cette commande.',
        botNoPermission: '❌ Je n\'ai pas la permission d\'effectuer cette action.',
        invalidArgs: '❌ Arguments invalides. Utilisez la commande correctement.',
        error: '❌ Une erreur est survenue.',
        success: '✅ Action effectuée avec succès.'
    },

    // Configuration des embeds
    embeds: {
        footer: {
            text: 'BetaBOT • Modération'
        }
    },

    // Configuration des logs
    logs: {
        enabled: true,
        channel: 'logs',
        colors: {
            ban: '#ff0000',
            kick: '#ff9900',
            mute: '#ffff00',
            warn: '#ff9900',
            clear: '#0099ff',
            lock: '#ff9900',
            slowmode: '#0099ff',
            role: '#00ff00',
            ticket: '#0099ff',
            giveaway: '#ff9900'
        }
    }
}; 