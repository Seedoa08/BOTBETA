module.exports = {
    name: 'uptime',
    description: 'Affiche le temps d\'activité du bot.',
    usage: '+uptime',
    permissions: 'Aucune',
    async execute(message) {
        const uptime = process.uptime();
        const days = Math.floor(uptime / 86400);
        const hours = Math.floor((uptime % 86400) / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);

        const embed = {
            color: 0x00ff00,
            title: '⏱️ Temps d\'activité',
            description: `Le bot est en ligne depuis :\n**${days} jours, ${hours} heures, ${minutes} minutes et ${seconds} secondes**.`,
            footer: {
                text: `Demandé par ${message.author.tag}`,
                icon_url: message.author.displayAvatarURL({ dynamic: true })
            },
            timestamp: new Date()
        };

        message.channel.send({ embeds: [embed] });
    }
};
