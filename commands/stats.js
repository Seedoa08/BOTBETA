const { PermissionsBitField } = require('discord.js');
const os = require('os');

function generateStats(client, guild) {
    return {
        bot: {
            uptime: Math.floor(client.uptime / 1000),
            ping: client.ws.ping,
            commands: client.commands.size,
            memory: process.memoryUsage().heapUsed,
            version: process.version
        },
        server: {
            members: guild.memberCount,
            online: guild.members.cache.filter(m => m.presence?.status === 'online').size,
            channels: guild.channels.cache.size,
            roles: guild.roles.cache.size
        },
        system: {
            platform: os.platform(),
            arch: os.arch(),
            cpu: os.cpus()[0].model,
            memory: {
                total: os.totalmem(),
                free: os.freemem()
            }
        }
    };
}

module.exports = {
    name: 'stats',
    description: 'Affiche les statistiques du bot et du serveur',
    permissions: null,
    async execute(message) {
        const stats = generateStats(message.client, message.guild);
        
        const statsEmbed = {
            color: 0x0099ff,
            title: '📊 Statistiques',
            fields: [
                {
                    name: '🤖 Bot',
                    value: [
                        `**Uptime:** ${Math.floor(stats.bot.uptime / 3600)}h ${Math.floor((stats.bot.uptime % 3600) / 60)}m`,
                        `**Ping:** ${stats.bot.ping}ms`,
                        `**Commandes:** ${stats.bot.commands}`,
                        `**Mémoire:** ${Math.round(stats.bot.memory / 1024 / 1024)}MB`,
                        `**Node:** ${stats.bot.version}`
                    ].join('\n'),
                    inline: false
                },
                {
                    name: '🏠 Serveur',
                    value: [
                        `**Membres:** ${stats.server.members}`,
                        `**En ligne:** ${stats.server.online}`,
                        `**Salons:** ${stats.server.channels}`,
                        `**Rôles:** ${stats.server.roles}`
                    ].join('\n'),
                    inline: false
                },
                {
                    name: '💻 Système',
                    value: [
                        `**OS:** ${stats.system.platform} (${stats.system.arch})`,
                        `**CPU:** ${stats.system.cpu}`,
                        `**RAM Totale:** ${Math.round(stats.system.memory.total / 1024 / 1024 / 1024)}GB`,
                        `**RAM Libre:** ${Math.round(stats.system.memory.free / 1024 / 1024 / 1024)}GB`
                    ].join('\n'),
                    inline: false
                }
            ],
            timestamp: new Date()
        };

        await message.reply({ embeds: [statsEmbed] });
    }
};
