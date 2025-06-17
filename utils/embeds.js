const theme = require('../config/theme');

module.exports = {
    createEmbed: (type, title, description) => {
        return {
            color: theme.colors[type] || theme.colors.primary,
            title: `${theme.emojis[type] || ''} ${title}`,
            description: description,
            timestamp: new Date(),
            footer: {
                text: 'Bot de modération avancé'
            }
        };
    },

    createModEmbed: (action, target, reason, moderator) => {
        return {
            color: theme.colors.warning,
            title: `${theme.emojis.moderation} Action de modération : ${action}`,
            thumbnail: { url: target.displayAvatarURL({ dynamic: true }) },
            fields: [
                { name: 'Membre', value: `${theme.emojis.member} ${target.tag}`, inline: true },
                { name: 'Modérateur', value: `${theme.emojis.member} ${moderator.tag}`, inline: true },
                { name: 'Raison', value: reason || 'Aucune raison fournie' }
            ],
            timestamp: new Date()
        };
    }
};
