const isOwner = require('../utils/isOwner');

module.exports = {
    name: 'debug',
    description: 'Affiche les informations de débogage',
    permissions: 'Administrator',
    async execute(message, args) {
        // Cette commande est réservée aux owners
        if (!isOwner(message.author.id)) {
            return message.reply('❌ Cette commande est réservée aux owners du bot.');
        }

        const type = args[0]?.toLowerCase();
        const stats = {
            system: {
                node: process.version,
                platform: process.platform,
                memory: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`,
                uptime: `${(process.uptime() / 3600).toFixed(2)} hours`,
                cpu: process.cpuUsage()
            },
            cache: {
                guilds: message.client.guilds.cache.size,
                users: message.client.users.cache.size,
                channels: message.client.channels.cache.size,
                emojis: message.client.emojis.cache.size
            }
        };

        const embed = {
            color: 0x0099ff,
            title: '🔧 Debug Information',
            fields: []
        };

        switch(type) {
            case 'system':
                Object.entries(stats.system).forEach(([key, value]) => {
                    embed.fields.push({ name: key, value: String(value), inline: true });
                });
                break;
            case 'cache':
                Object.entries(stats.cache).forEach(([key, value]) => {
                    embed.fields.push({ name: key, value: String(value), inline: true });
                });
                break;
            default:
                embed.fields = [
                    ...Object.entries(stats.system).map(([key, value]) => ({ 
                        name: `System - ${key}`, value: String(value), inline: true 
                    })),
                    ...Object.entries(stats.cache).map(([key, value]) => ({ 
                        name: `Cache - ${key}`, value: String(value), inline: true 
                    }))
                ];
        }

        message.reply({ embeds: [embed] });
    }
};
