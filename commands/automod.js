const { PermissionsBitField, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../config');
const automodFile = path.join(configPath, 'automod.json');

// Structure par défaut de la configuration automod
const defaultConfig = {
    enabled: false,
    filters: {
        badwords: false,
        spam: false,
        mentions: false,
        links: false,
        invites: false,
        caps: false
    },
    thresholds: {
        mentions: 5,
        caps: 70,
        spam: 5
    },
    whitelist: {
        channels: [],
        roles: [],
        users: []
    },
    actions: {
        warn: true,
        delete: true,
        mute: false,
        kick: false,
        ban: false
    },
    muteTime: '10m',
    logChannel: null
};

module.exports = {
    name: 'automod',
    description: 'Configure le système d\'automodération',
    usage: '+automod <on|off|filtres|seuils|whitelist|actions|log|etat>',
    category: 'Configuration',
    permissions: 'Administrator',
    async execute(message, args) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply('❌ Vous devez être administrateur pour utiliser cette commande.');
        }

        // Charger ou créer la configuration
        let config = defaultConfig;
        if (fs.existsSync(automodFile)) {
            config = JSON.parse(fs.readFileSync(automodFile));
        }

        const embed = new EmbedBuilder()
            .setColor(0x2F3136)
            .setTitle('⚙️ Configuration de l\'AutoMod')
            .setDescription(
                'Utilisez les **commandes** ci-dessous pour configurer l\'automodération :\n\n' +
                '✅ **Activer/Désactiver** : `+automod on` / `+automod off`\n' +
                '🛡️ **Filtres** : `+automod filtres <badwords|spam|mentions|links|invites|caps> <on|off>`\n' +
                '📊 **Seuils** : `+automod seuils <mentions|caps|spam> <valeur>`\n' +
                '📃 **Whitelist** : `+automod whitelist <channels|roles|users> <add|remove> <id>`\n' +
                '⚠️ **Actions** : `+automod actions <warn|delete|mute|kick|ban> <on|off>`\n' +
                '⏱️ **Durée Mute** : `+automod mute <durée>`\n' +
                '📝 **Salon Logs** : `+automod log <#salon>`\n' +
                '🔎 **État** : `+automod etat`\n\n' +
                'Tapez la commande correspondante dans ce salon.'
            )
            .addFields(
                { name: 'État actuel', value: config.enabled ? '✅ Activé' : '❌ Désactivé' },
                {
                    name: 'Filtres actifs',
                    value: Object.entries(config.filters)
                        .filter(([, enabled]) => enabled)
                        .map(([name]) => `✅ ${name}`)
                        .join('\n') || 'Aucun filtre actif'
                }
            );

        await message.reply({ embeds: [embed] });
    }
};
