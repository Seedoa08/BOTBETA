const { PermissionsBitField, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const raidConfigPath = path.join(__dirname, '../config/raidmode.json');

// Configuration par défaut
const defaultConfig = {
    enabled: false,
    strict: false,
    lockdown: false,
    protections: {
        joinDelay: 5000,
        accountAge: 7,
        avatarRequired: true,
        memberScreening: true,
        autoMute: true
    },
    whitelist: {
        roles: [],
        users: []
    },
    logChannel: null
};

module.exports = {
    name: 'raid-mode',
    description: 'Active/désactive le mode raid',
    usage: '+raid-mode <on/off/status> [--strict] [--lockdown]',
    category: 'Modération',
    permissions: 'Administrator',
    
    async execute(message, args) {
        // Charger ou créer la configuration
        let config = defaultConfig;
        if (fs.existsSync(raidConfigPath)) {
            config = JSON.parse(fs.readFileSync(raidConfigPath));
        }

        const mode = args[0]?.toLowerCase();
        const strict = args.includes('--strict');
        const lockdown = args.includes('--lockdown');

        if (!['on', 'off', 'status'].includes(mode)) {
            return message.reply('❌ Usage: `+raid-mode <on/off/status> [--strict] [--lockdown]`');
        }

        if (mode === 'status') {
            const embed = new EmbedBuilder()
                .setColor(config.enabled ? 0xff0000 : 0x00ff00)
                .setTitle('🛡️ Statut Anti-Raid')
                .setDescription(config.enabled ? '⚠️ Mode Anti-Raid actif' : '✅ Mode Anti-Raid inactif')
                .addFields([
                    {
                        name: 'État des protections',
                        value: [
                            `Mode strict: ${config.strict ? '✅' : '❌'}`,
                            `Verrouillage: ${config.lockdown ? '✅' : '❌'}`,
                            `Délai entre joins: ${config.protections.joinDelay}ms`,
                            `Âge minimum: ${config.protections.accountAge} jours`,
                            `Avatar requis: ${config.protections.avatarRequired ? '✅' : '❌'}`,
                            `Vérification: ${config.protections.memberScreening ? '✅' : '❌'}`
                        ].join('\n')
                    }
                ])
                .setFooter({ text: `Salon logs: ${config.logChannel ? `<#${config.logChannel}>` : 'Non défini'}` })
                .setTimestamp();

            return message.reply({ embeds: [embed] });
        }

        // Activer/Désactiver le mode raid
        config.enabled = mode === 'on';
        config.strict = strict;
        config.lockdown = lockdown;

        if (config.enabled) {
            // Appliquer les mesures anti-raid
            if (lockdown) {
                // Verrouiller tous les salons publics
                message.guild.channels.cache.forEach(async channel => {
                    if (channel.type === 0) { // Type text
                        await channel.permissionOverwrites.edit(message.guild.roles.everyone, {
                            SendMessages: false
                        });
                    }
                });
            }

            if (strict) {
                // Activer les mesures strictes
                config.protections.joinDelay = 10000; // 10 secondes
                config.protections.accountAge = 30; // 30 jours
                config.protections.avatarRequired = true;
                config.protections.autoMute = true;
            }
        }

        // Sauvegarder la configuration
        fs.writeFileSync(raidConfigPath, JSON.stringify(config, null, 4));

        const embed = new EmbedBuilder()
            .setColor(config.enabled ? 0xff0000 : 0x00ff00)
            .setTitle('🛡️ Mode Anti-Raid')
            .setDescription(config.enabled ? 
                `⚠️ Mode Anti-Raid activé\n${strict ? '🔒 Mode strict activé\n' : ''}${lockdown ? '🔐 Verrouillage activé' : ''}` :
                '✅ Mode Anti-Raid désactivé')
            .addFields([
                {
                    name: 'Protections actives',
                    value: [
                        `• Délai entre joins: ${config.protections.joinDelay}ms`,
                        `• Âge minimum: ${config.protections.accountAge} jours`,
                        `• Avatar requis: ${config.protections.avatarRequired ? '✅' : '❌'}`,
                        `• Vérification: ${config.protections.memberScreening ? '✅' : '❌'}`
                    ].join('\n')
                }
            ])
            .setTimestamp();

        message.reply({ embeds: [embed] });
    }
};
