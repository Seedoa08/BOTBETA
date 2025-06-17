module.exports = {
    // Configuration générale des commandes
    defaultCooldown: 3, // Cooldown par défaut en secondes
    maxWarnings: 3, // Nombre maximum d'avertissements
    deleteCommandMessages: true, // Supprimer les messages de commande après exécution
    defaultEmbedColor: 0x5865F2, // Couleur par défaut des embeds

    // Catégories de commandes
    categories: {
        moderation: {
            name: 'Modération',
            description: 'Commandes de modération du serveur',
            emoji: '🛡️',
            color: 0xFF0000
        },
        fun: {
            name: 'Divertissement',
            description: 'Commandes de divertissement',
            emoji: '🎮',
            color: 0x00FF00
        },
        utility: {
            name: 'Utilitaires',
            description: 'Commandes utilitaires',
            emoji: '🔧',
            color: 0x5865F2
        },
        admin: {
            name: 'Administration',
            description: 'Commandes d\'administration',
            emoji: '👑',
            color: 0xFFD700
        }
    },

    // Permissions par défaut pour les commandes
    defaultPermissions: {
        moderation: ['ModerateMembers'],
        admin: ['Administrator'],
        utility: [],
        fun: []
    },

    // Messages d'erreur personnalisés
    errorMessages: {
        noPermission: '❌ Vous n\'avez pas la permission d\'utiliser cette commande.',
        cooldown: '⏰ Veuillez patienter {time} secondes avant de réutiliser cette commande.',
        invalidArgs: '❌ Arguments invalides. Utilisez `{prefix}help {command}` pour plus d\'informations.',
        commandError: '❌ Une erreur est survenue lors de l\'exécution de la commande.',
        userNotFound: '❌ Utilisateur non trouvé.',
        channelNotFound: '❌ Canal non trouvé.',
        roleNotFound: '❌ Rôle non trouvé.'
    },

    // Configuration des logs
    logging: {
        enabled: true,
        channels: {
            moderation: 'logs-moderation',
            errors: 'logs-errors',
            server: 'logs-server'
        },
        colors: {
            success: 0x00FF00,
            error: 0xFF0000,
            warning: 0xFFFF00,
            info: 0x5865F2
        }
    }
}; 