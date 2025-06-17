module.exports = {
    // Configuration des événements
    events: {
        // Événements de modération
        moderation: {
            messageDelete: true,
            messageUpdate: true,
            memberJoin: true,
            memberLeave: true,
            memberBan: true,
            memberUnban: true,
            memberKick: true,
            memberTimeout: true
        },

        // Événements de serveur
        server: {
            channelCreate: true,
            channelDelete: true,
            channelUpdate: true,
            roleCreate: true,
            roleDelete: true,
            roleUpdate: true,
            emojiCreate: true,
            emojiDelete: true,
            emojiUpdate: true
        },

        // Événements de présence
        presence: {
            userUpdate: true,
            presenceUpdate: true,
            voiceStateUpdate: true
        }
    },

    // Configuration des messages de bienvenue
    welcome: {
        enabled: true,
        channel: 'bienvenue',
        message: 'Bienvenue {user} sur {server}! Tu es le {count}ème membre.',
        dmMessage: 'Bienvenue sur {server}! N\'oublie pas de lire les règles.',
        role: null // ID du rôle à donner automatiquement
    },

    // Configuration des messages d'adieu
    goodbye: {
        enabled: true,
        channel: 'bienvenue',
        message: 'Au revoir {user}! Nous espérons te revoir bientôt.'
    },

    // Configuration des logs automatiques
    autoLog: {
        enabled: true,
        channels: {
            moderation: 'logs-moderation',
            server: 'logs-server',
            voice: 'logs-voice'
        },
        colors: {
            success: 0x00FF00,
            error: 0xFF0000,
            warning: 0xFFFF00,
            info: 0x5865F2
        }
    },

    // Configuration des anti-spam
    antiSpam: {
        enabled: true,
        maxMessages: 5, // Nombre maximum de messages en 5 secondes
        maxMentions: 3, // Nombre maximum de mentions en 5 secondes
        maxEmojis: 10, // Nombre maximum d'emojis en 5 secondes
        punishment: 'timeout', // timeout, kick, ban
        duration: 300000 // 5 minutes en millisecondes
    },

    // Configuration des anti-raid
    antiRaid: {
        enabled: true,
        maxJoins: 5, // Nombre maximum de joins en 10 secondes
        punishment: 'ban',
        whitelist: [] // IDs des utilisateurs whitelistés
    },

    // Configuration des niveaux
    levels: {
        enabled: true,
        xpPerMessage: 15,
        xpCooldown: 60, // Secondes
        levelUpMessage: '🎉 Félicitations {user}! Tu es maintenant niveau {level}!',
        rewards: {
            5: null, // ID du rôle pour le niveau 5
            10: null, // ID du rôle pour le niveau 10
            20: null, // ID du rôle pour le niveau 20
            30: null, // ID du rôle pour le niveau 30
            50: null  // ID du rôle pour le niveau 50
        }
    },

    // Configuration des commandes personnalisées
    customCommands: {
        enabled: true,
        prefix: '!',
        cooldown: 3 // Secondes
    },

    // Configuration des réactions automatiques
    autoReactions: {
        enabled: true,
        channels: {
            // ID du canal: [emojis]
            'channel_id': ['👍', '❤️']
        }
    },

    // Configuration des messages automatiques
    autoMessages: {
        enabled: true,
        channels: {
            // ID du canal: {message: 'message', interval: 3600000}
            'channel_id': {
                message: 'N\'oubliez pas de lire les règles!',
                interval: 3600000 // 1 heure en millisecondes
            }
        }
    }
}; 