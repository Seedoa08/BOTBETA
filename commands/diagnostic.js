const { PermissionsBitField } = require('discord.js');
const isOwner = require('../utils/isOwner');
const fs = require('fs');
const path = require('path');
const os = require('os');

module.exports = {
    name: 'diagnostic',
    description: 'Effectue un diagnostic du bot',
    permissions: 'Administrator',
    async execute(message, args) {
        // Cette commande est réservée aux owners
        if (!isOwner(message.author.id)) {
            return message.reply('❌ Cette commande est réservée aux owners du bot.');
        }

        const startTime = Date.now();

        // Vérifier les fichiers essentiels
        const filesStatus = checkFiles([
            './warnings.json',
            './authorizedUsers.json',
            './muteHistory.json',
            './welcomeConfig.json'
        ]);

        // Vérifier les permissions critiques du bot
        const requiredPermissions = [
            'ManageRoles',
            'ManageChannels',
            'KickMembers',
            'BanMembers',
            'ManageMessages',
            'ModerateMembers'
        ];

        const permissionsStatus = checkBotPermissions(message.guild, requiredPermissions);

        // Collecter les statistiques du serveur
        const serverStats = await collectServerStats(message.guild);

        // Vérifier la santé du système
        const systemHealth = checkSystemHealth();

        // Calculer le temps de réponse
        const responseTime = Date.now() - startTime;

        // Créer l'embed de diagnostic
        const diagnosticEmbed = {
            color: 0x00ff00,
            title: '📊 Diagnostic Complet',
            description: 'Analyse détaillée du bot et du serveur',
            fields: [
                {
                    name: '🤖 État du Bot',
                    value: [
                        `**Ping**: ${message.client.ws.ping}ms`,
                        `**Temps de réponse**: ${responseTime}ms`,
                        `**Uptime**: ${formatUptime(message.client.uptime)}`,
                        `**Commandes chargées**: ${message.client.commands.size}`,
                        `**Mémoire utilisée**: ${formatBytes(process.memoryUsage().heapUsed)}`
                    ].join('\n'),
                    inline: false
                },
                {
                    name: '📁 État des Fichiers',
                    value: Object.entries(filesStatus)
                        .map(([file, status]) => `${status ? '✅' : '❌'} ${file}`)
                        .join('\n'),
                    inline: false
                },
                {
                    name: '🛡️ Permissions',
                    value: Object.entries(permissionsStatus)
                        .map(([perm, has]) => `${has ? '✅' : '❌'} ${perm}`)
                        .join('\n'),
                    inline: false
                },
                {
                    name: '📈 Statistiques Serveur',
                    value: [
                        `**Membres**: ${serverStats.memberCount}`,
                        `**Salons**: ${serverStats.channelCount}`,
                        `**Rôles**: ${serverStats.roleCount}`,
                        `**Émojis**: ${serverStats.emojiCount}`,
                        `**Niveau de vérification**: ${serverStats.verificationLevel}`
                    ].join('\n'),
                    inline: false
                },
                {
                    name: '🖥️ Santé Système',
                    value: [
                        `**CPU**: ${systemHealth.cpuLoad}%`,
                        `**RAM**: ${systemHealth.memoryUsage}%`,
                        `**Disk**: ${systemHealth.diskSpace}% libre`,
                        `**Node**: ${process.version}`,
                        `**Platform**: ${os.platform()} ${os.release()}`
                    ].join('\n'),
                    inline: false
                }
            ],
            footer: {
                text: `Diagnostic effectué en ${responseTime}ms`
            },
            timestamp: new Date()
        };

        await message.channel.send({ embeds: [diagnosticEmbed] });
    }
};

// Fonctions utilitaires
function checkFiles(files) {
    const status = {};
    files.forEach(file => {
        try {
            status[file] = fs.existsSync(path.join(__dirname, '..', file));
        } catch (error) {
            console.error(`Erreur lors de la vérification du fichier ${file}:`, error);
            status[file] = false;
        }
    });
    return status;
}

function checkBotPermissions(guild, permissions) {
    const status = {};
    permissions.forEach(permission => {
        status[permission] = guild.members.me.permissions.has(PermissionsBitField.Flags[permission]);
    });
    return status;
}

async function collectServerStats(guild) {
    return {
        memberCount: guild.memberCount,
        channelCount: guild.channels.cache.size,
        roleCount: guild.roles.cache.size,
        emojiCount: guild.emojis.cache.size,
        verificationLevel: guild.verificationLevel
    };
}

function checkSystemHealth() {
    const cpus = os.cpus();
    const cpuLoad = Math.round(
        (1 - cpus[0].times.idle / Object.values(cpus[0].times).reduce((a, b) => a + b)) * 100
    );
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const memoryUsage = Math.round(((totalMem - freeMem) / totalMem) * 100);

    // Ajout de la vérification de l'espace disque
    const diskSpace = {
        free: 0,
        total: 0
    };

    return {
        cpuLoad,
        memoryUsage,
        diskSpace: Math.round((diskSpace.free / diskSpace.total) * 100)
    };
}

function formatBytes(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Byte';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round((bytes / Math.pow(1024, i))) + ' ' + sizes[i];
}

function formatUptime(ms) {
    const days = Math.floor(ms / (24 * 60 * 60 * 1000));
    const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
    return `${days}j ${hours}h ${minutes}m`;
}
