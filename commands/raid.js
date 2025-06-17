const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const raidConfigPath = path.join(__dirname, '../config/raid.json');

// Configuration par défaut
const defaultConfig = {
    enabled: false,
    mode: 'normal',
    protection: {
        joinDelay: 5000,
        accountAge: 7,
        avatarRequired: true,
        memberScreening: true,
        autoMute: true,
        massBan: true,
        massKick: true,
        channelCreate: true,
        roleDelete: true,
        webhookCreate: true
    },
    thresholds: {
        joinRate: 5,
        joinTime: 10,
        banRate: 3,
        kickRate: 3,
        channelRate: 2,
        roleRate: 2
    },
    punishments: {
        type: 'kick', // 'kick', 'ban', 'timeout'
        duration: '1h' // Pour timeout
    },
    whitelist: {
        users: [],
        roles: []
    },
    logChannel: null
};

module.exports = {
    name: 'raid',
    description: 'Système de protection anti-raid complet',
    usage: '+raid <on/off/config/status/strict/lockdown>',
    category: 'Administration',
    permissions: 'Administrator',
    
    async execute(message, args) {
        // Charger ou créer la configuration
        let config = defaultConfig;
        if (fs.existsSync(raidConfigPath)) {
            config = JSON.parse(fs.readFileSync(raidConfigPath));
        }

        const subCommand = args[0]?.toLowerCase();

        if (!['on', 'off', 'config', 'status', 'strict', 'lockdown'].includes(subCommand)) {
            return message.reply('❌ Usage: `+raid <on/off/config/status/strict/lockdown>`');
        }

        switch (subCommand) {
            case 'on':
                config.enabled = true;
                config.mode = 'normal';
                break;

            case 'off':
                config.enabled = false;
                // Désactiver le lockdown si actif
                if (config.mode === 'lockdown') {
                    message.guild.channels.cache.forEach(channel => {
                        channel.permissionOverwrites.edit(message.guild.roles.everyone, {
                            SendMessages: null
                        }).catch(() => {});
                    });
                }
                break;

            case 'strict':
                config.enabled = true;
                config.mode = 'strict';
                config.protection.accountAge = 30;
                config.protection.avatarRequired = true;
                config.thresholds.joinRate = 3;
                config.thresholds.joinTime = 30;
                config.punishments.type = 'ban';
                break;

            case 'lockdown':
                config.enabled = true;
                config.mode = 'lockdown';
                // Verrouiller tous les salons
                message.guild.channels.cache.forEach(channel => {
                    channel.permissionOverwrites.edit(message.guild.roles.everyone, {
                        SendMessages: false
                    }).catch(() => {});
                });
                break;

            case 'config':
                const configMenu = new StringSelectMenuBuilder()
                    .setCustomId('raid_config')
                    .setPlaceholder('Sélectionner une option à configurer')
                    .addOptions([
                        { label: 'Seuils', value: 'thresholds', description: 'Configurer les seuils de détection', emoji: '⚙️' },
                        { label: 'Punitions', value: 'punishments', description: 'Configurer les punitions', emoji: '🔨' },
                        { label: 'Protections', value: 'protection', description: 'Configurer les protections', emoji: '🛡️' },
                        { label: 'Whitelist', value: 'whitelist', description: 'Gérer la whitelist', emoji: '✅' }
                    ]);

                let configMsg;
                try {
                    configMsg = await message.reply({
                        embeds: [this.getStatusEmbed(config, message.guild)],
                        components: [new ActionRowBuilder().addComponents(configMenu)]
                    });
                } catch (err) {
                    return message.reply({ content: '❌ Impossible d\'envoyer le menu de configuration.', ephemeral: true });
                }

                // Collector pour le menu de configuration
                const collector = configMsg.createMessageComponentCollector({ time: 900000 }); // 15 min
                collector.on('collect', async i => {
                    if (i.user.id !== message.author.id) {
                        try {
                            await i.reply({ content: '❌ Seul l\'auteur de la commande peut configurer.', ephemeral: true });
                        } catch {}
                        return;
                    }
                    try {
                        // ... logique de configuration interactive ...
                        await i.reply({ content: 'Fonctionnalité à venir.', ephemeral: true });
                    } catch (err) {
                        try {
                            if (!i.replied && !i.deferred) {
                                await i.reply({ content: '❌ Erreur lors de l\'interaction.', ephemeral: true });
                            }
                        } catch {}
                    }
                });
                collector.on('end', async () => {
                    try {
                        await configMsg.edit({ components: [] });
                    } catch {}
                });
                return;

            case 'status':
                return message.reply({
                    embeds: [this.getStatusEmbed(config, message.guild)]
                });
        }

        // Sauvegarder la configuration
        fs.writeFileSync(raidConfigPath, JSON.stringify(config, null, 4));

        const embed = new EmbedBuilder()
            .setColor(config.enabled ? 0xff0000 : 0x00ff00)
            .setTitle('🛡️ Protection Anti-Raid')
            .setDescription(this.getModeDescription(config))
            .addFields([
                {
                    name: 'État actuel',
                    value: `Mode: ${config.mode}\nProtection: ${config.enabled ? '✅' : '❌'}`
                }
            ])
            .setTimestamp();

        message.reply({ embeds: [embed] });
    },

    getStatusEmbed(config, guild) {
        return new EmbedBuilder()
            .setColor(config.enabled ? 0xff0000 : 0x00ff00)
            .setTitle('🛡️ Statut Anti-Raid')
            .setDescription(this.getModeDescription(config))
            .addFields([
                {
                    name: '⚙️ Configuration',
                    value: [
                        `Mode: ${config.mode}`,
                        `Protection: ${config.enabled ? '✅' : '❌'}`,
                        `Âge minimum: ${config.protection.accountAge} jours`,
                        `Délai entre joins: ${config.thresholds.joinRate}/${config.thresholds.joinTime}s`
                    ].join('\n')
                },
                {
                    name: '🛡️ Protections actives',
                    value: Object.entries(config.protection)
                        .filter(([, enabled]) => enabled)
                        .map(([name]) => `✅ ${name}`)
                        .join('\n') || 'Aucune protection active'
                }
            ])
            .setFooter({ text: guild.name, iconURL: guild.iconURL({ dynamic: true }) })
            .setTimestamp();
    },

    getModeDescription(config) {
        switch (config.mode) {
            case 'normal':
                return '🟢 Mode normal - Protection de base contre les raids';
            case 'strict':
                return '🟡 Mode strict - Protection renforcée avec restrictions accrues';
            case 'lockdown':
                return '🔴 Mode lockdown - Serveur verrouillé, accès restreint';
            default:
                return '⚪ Protection désactivée';
        }
    }
};
