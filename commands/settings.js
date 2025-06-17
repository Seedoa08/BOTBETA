const { PermissionsBitField } = require('discord.js');
const { readJson, writeJson } = require('../utils/fileManager');
const { sendError, sendSuccess } = require('../utils/functions');
const { logModerationAction } = require('../utils/logger');
const fs = require('fs');
const path = require('path');
const isOwner = require('../utils/isOwner');

// Définir les chemins des fichiers
const dataPath = path.join(__dirname, '../data');
const settingsFile = path.join(dataPath, 'settings.json');

// Créer le dossier data s'il n'existe pas
if (!fs.existsSync(dataPath)) {
    fs.mkdirSync(dataPath, { recursive: true });
}

// Structure par défaut des paramètres
const defaultSettings = {
    moderation: {
        enabled: true,
        logChannel: null,
        automod: false,
        muteRole: null
    },
    welcome: {
        enabled: false,
        channel: null,
        message: 'Bienvenue {user} sur {server}!'
    },
    levels: {
        enabled: false,
        announceChannel: null,
        xpRate: 1
    }
};

// Initialiser le fichier settings s'il n'existe pas
if (!fs.existsSync(settingsFile)) {
    fs.writeFileSync(settingsFile, JSON.stringify(defaultSettings, null, 2));
}

module.exports = {
    name: 'settings',
    description: 'Configure les paramètres du bot',
    usage: '+settings <view/edit/reset>',
    permissions: 'Administrator',
    async execute(message, args) {
        // Bypass des permissions pour les owners
        if (!isOwner(message.author.id) && !message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply('❌ Vous devez être administrateur pour modifier les paramètres.');
        }

        const subCommand = args[0]?.toLowerCase();

        if (!subCommand || subCommand === 'help') {
            return sendHelpEmbed(message);
        }

        switch (subCommand) {
            case 'view':
                return viewSettings(message);
            case 'edit':
                return editSetting(message, args.slice(1));
            case 'reset':
                return resetSettings(message);
            default:
                return message.reply('❌ Option invalide. Utilisez `+settings help` pour voir les options disponibles.');
        }
    }
};

function sendHelpEmbed(message) {
    const helpEmbed = {
        color: 0x0099ff,
        title: '⚙️ Paramètres du Bot',
        description: 'Configuration des paramètres du serveur',
        fields: [
            {
                name: 'Commandes disponibles',
                value: [
                    '`+settings view` - Voir les paramètres actuels',
                    '`+settings edit <paramètre> <valeur>` - Modifier un paramètre',
                    '`+settings reset` - Réinitialiser les paramètres',
                    '`+settings help` - Afficher cette aide'
                ].join('\n')
            },
            {
                name: 'Paramètres configurables',
                value: [
                    '• `prefix` - Préfixe des commandes',
                    '• `logChannel` - Salon des logs',
                    '• `modRole` - Rôle modérateur',
                    '• `adminRole` - Rôle administrateur',
                    '• `welcomeMessage` - Message de bienvenue',
                    '• `autoRole` - Rôle automatique'
                ].join('\n')
            }
        ],
        footer: { text: 'Utilisez +settings edit <paramètre> <valeur> pour modifier un paramètre' }
    };

    return message.channel.send({ embeds: [helpEmbed] });
}

async function viewSettings(message) {
    const settings = loadSettings(message.guild.id);

    const settingsEmbed = {
        color: 0x00ff00,
        title: '⚙️ Paramètres actuels',
        fields: [
            { name: 'Préfixe', value: settings.prefix || '+', inline: true },
            { name: 'Salon des logs', value: settings.logChannel ? `<#${settings.logChannel}>` : 'Non défini', inline: true },
            { name: 'Rôle modérateur', value: settings.modRole ? `<@&${settings.modRole}>` : 'Non défini', inline: true },
            { name: 'Rôle administrateur', value: settings.adminRole ? `<@&${settings.adminRole}>` : 'Non défini', inline: true },
            { name: 'Message de bienvenue', value: settings.welcomeMessage || 'Par défaut', inline: false },
            { name: 'Rôle automatique', value: settings.autoRole ? `<@&${settings.autoRole}>` : 'Désactivé', inline: true }
        ],
        footer: { text: `ID du serveur: ${message.guild.id}` },
        timestamp: new Date()
    };

    return message.channel.send({ embeds: [settingsEmbed] });
}

async function editSetting(message, args) {
    if (args.length < 2) {
        return message.reply('❌ Usage: `+settings edit <paramètre> <valeur>`');
    }

    const [setting, ...value] = args;
    const settings = loadSettings(message.guild.id);

    switch (setting.toLowerCase()) {
        case 'prefix':
            if (value[0].length > 3) return message.reply('❌ Le préfixe ne peut pas dépasser 3 caractères.');
            settings.prefix = value[0];
            break;

        case 'logchannel':
            const channel = message.mentions.channels.first() || message.guild.channels.cache.get(value[0]);
            if (!channel) return message.reply('❌ Canal invalide.');
            settings.logChannel = channel.id;
            break;

        case 'modrole':
        case 'adminrole':
        case 'autorole':
            const role = message.mentions.roles.first() || message.guild.roles.cache.get(value[0]);
            if (!role) return message.reply('❌ Rôle invalide.');
            settings[setting.toLowerCase()] = role.id;
            break;

        case 'welcomemessage':
            settings.welcomeMessage = value.join(' ');
            break;

        default:
            return message.reply('❌ Paramètre invalide.');
    }

    saveSettings(message.guild.id, settings);
    return message.reply(`✅ Paramètre \`${setting}\` mis à jour avec succès.`);
}

async function resetSettings(message) {
    const confirm = await message.reply('⚠️ Êtes-vous sûr de vouloir réinitialiser tous les paramètres ? (oui/non)');
    
    try {
        const response = await message.channel.awaitMessages({
            filter: m => m.author.id === message.author.id,
            max: 1,
            time: 30000,
            errors: ['time']
        });

        if (response.first().content.toLowerCase() === 'oui') {
            saveSettings(message.guild.id, {});
            return message.reply('✅ Tous les paramètres ont été réinitialisés.');
        } else {
            return message.reply('❌ Réinitialisation annulée.');
        }
    } catch (error) {
        return message.reply('❌ Temps écoulé, réinitialisation annulée.');
    }
}

function loadSettings(guildId) {
    if (!fs.existsSync(settingsFile)) {
        fs.writeFileSync(settingsFile, '{}');
        return {};
    }

    const settings = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
    return settings[guildId] || {};
}

function saveSettings(guildId, settings) {
    const allSettings = fs.existsSync(settingsFile) ? 
        JSON.parse(fs.readFileSync(settingsFile, 'utf8')) : {};
    
    allSettings[guildId] = settings;
    fs.writeFileSync(settingsFile, JSON.stringify(allSettings, null, 4));
}
