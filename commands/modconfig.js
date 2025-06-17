const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../config/moderation.json');

// Configuration par défaut
const defaultConfig = {
    automod: true,
    spamProtection: true,
    raidProtection: true,
    logChannel: null,
    warningThreshold: 3,
    muteDuration: '1h',
    autoActions: {
        warn: true,
        mute: true,
        kick: false,
        ban: false
    }
};

// Créer le fichier de configuration s'il n'existe pas
if (!fs.existsSync(configPath)) {
    fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 4));
}

module.exports = {
    name: 'modconfig',
    description: 'Configure les paramètres de modération',
    usage: '+modconfig <automod|spam|raid|warns|mute|logs|actions|etat>',
    category: 'Configuration',
    permissions: 'Administrator',
    async execute(message) {
        let config = JSON.parse(fs.readFileSync(configPath));

        const embed = new EmbedBuilder()
            .setColor(0x2F3136)
            .setTitle('⚙️ Configuration de la Modération')
            .setDescription(
                'Utilisez les **commandes** ci-dessous pour configurer la modération :\n\n' +
                '✅ **Activer/Désactiver AutoMod** : `+modconfig automod <on|off>`\n' +
                '🛡️ **Activer/Désactiver Anti-Spam** : `+modconfig spam <on|off>`\n' +
                '🛡️ **Activer/Désactiver Anti-Raid** : `+modconfig raid <on|off>`\n' +
                '⚠️ **Seuil d\'avertissements** : `+modconfig warns <nombre>`\n' +
                '⏱️ **Durée du mute** : `+modconfig mute <durée>`\n' +
                '📝 **Salon des logs** : `+modconfig logs <#salon>`\n' +
                '🔧 **Actions automatiques** : `+modconfig actions <warn|mute|kick|ban> <on|off>`\n' +
                '🔎 **État** : `+modconfig etat`\n\n' +
                'Tapez la commande correspondante dans ce salon.'
            )
            .addFields([
                {
                    name: 'État des systèmes',
                    value: [
                        `AutoMod: ${config.automod ? '✅' : '❌'}`,
                        `Anti-Spam: ${config.spamProtection ? '✅' : '❌'}`,
                        `Anti-Raid: ${config.raidProtection ? '✅' : '❌'}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: 'Paramètres',
                    value: [
                        `Seuil d'avertissements: ${config.warningThreshold}`,
                        `Durée du mute: ${config.muteDuration}`,
                        `Salon des logs: ${config.logChannel ? `<#${config.logChannel}>` : 'Non défini'}`
                    ].join('\n'),
                    inline: true
                }
            ]);

        await message.reply({ embeds: [embed] });
    }
};
