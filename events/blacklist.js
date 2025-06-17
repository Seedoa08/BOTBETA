const { Events } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { logAction, logError } = require('../utils/functions');

// Chemin du fichier blacklist
const blacklistFile = path.join(__dirname, '../data/blacklist.json');

// Fonction pour charger la configuration
function loadBlacklist() {
    try {
        return JSON.parse(fs.readFileSync(blacklistFile, 'utf8'));
    } catch (error) {
        logError('blacklist', error);
        return { users: [], settings: {} };
    }
}

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        // Vérifier les utilisateurs blacklistés toutes les 5 minutes
        setInterval(async () => {
            try {
                const blacklist = loadBlacklist();
                if (!blacklist.settings.autoBan) return;

                for (const guild of client.guilds.cache.values()) {
                    const logChannel = blacklist.settings.logChannel ? 
                        guild.channels.cache.get(blacklist.settings.logChannel) : null;

                    for (const userId of blacklist.users) {
                        const member = guild.members.cache.get(userId);
                        if (member) {
                            try {
                                // Vérifier si l'utilisateur est whitelisté
                                const isWhitelisted = member.roles.cache.some(role => 
                                    blacklist.settings.adminRoles.includes(role.id)
                                );

                                if (!isWhitelisted) {
                                    // Bannir l'utilisateur
                                    await member.ban({ 
                                        reason: 'Utilisateur blacklisté automatiquement' 
                                    });

                                    // Notifier l'utilisateur si configuré
                                    if (blacklist.settings.notifyUser) {
                                        try {
                                            await member.user.send(
                                                '⚠️ Vous avez été banni automatiquement car vous êtes dans la blacklist du bot.'
                                            );
                                        } catch (error) {
                                            logError('blacklist', error);
                                        }
                                    }

                                    // Envoyer dans le canal de logs si configuré
                                    if (logChannel) {
                                        const embed = {
                                            color: 0xff0000,
                                            title: '🚫 Utilisateur Blacklisté Banni',
                                            fields: [
                                                {
                                                    name: 'Utilisateur',
                                                    value: `${member.user.tag} (${member.id})`
                                                },
                                                {
                                                    name: 'Raison',
                                                    value: 'Utilisateur blacklisté automatiquement'
                                                }
                                            ],
                                            timestamp: new Date()
                                        };
                                        await logChannel.send({ embeds: [embed] });
                                    }

                                    // Log de l'action
                                    logAction('blacklist', {
                                        guildId: guild.id,
                                        userId: member.id,
                                        action: 'auto_ban',
                                        reason: 'Utilisateur blacklisté'
                                    });
                                }
                            } catch (error) {
                                logError('blacklist', error);
                            }
                        }
                    }
                }
            } catch (error) {
                logError('blacklist', error);
            }
        }, 300000); // 5 minutes

        // Événement pour vérifier les nouveaux membres
        client.on(Events.GuildMemberAdd, async member => {
            try {
                const blacklist = loadBlacklist();
                if (!blacklist.settings.autoBan) return;

                if (blacklist.users.includes(member.id)) {
                    // Vérifier si l'utilisateur est whitelisté
                    const isWhitelisted = member.roles.cache.some(role => 
                        blacklist.settings.adminRoles.includes(role.id)
                    );

                    if (!isWhitelisted) {
                        // Bannir l'utilisateur
                        await member.ban({ 
                            reason: 'Utilisateur blacklisté automatiquement' 
                        });

                        // Notifier l'utilisateur si configuré
                        if (blacklist.settings.notifyUser) {
                            try {
                                await member.user.send(
                                    '⚠️ Vous avez été banni automatiquement car vous êtes dans la blacklist du bot.'
                                );
                            } catch (error) {
                                logError('blacklist', error);
                            }
                        }

                        // Envoyer dans le canal de logs si configuré
                        const logChannel = blacklist.settings.logChannel ? 
                            member.guild.channels.cache.get(blacklist.settings.logChannel) : null;

                        if (logChannel) {
                            const embed = {
                                color: 0xff0000,
                                title: '🚫 Utilisateur Blacklisté Banni',
                                fields: [
                                    {
                                        name: 'Utilisateur',
                                        value: `${member.user.tag} (${member.id})`
                                    },
                                    {
                                        name: 'Raison',
                                        value: 'Utilisateur blacklisté automatiquement'
                                    }
                                ],
                                timestamp: new Date()
                            };
                            await logChannel.send({ embeds: [embed] });
                        }

                        // Log de l'action
                        logAction('blacklist', {
                            guildId: member.guild.id,
                            userId: member.id,
                            action: 'auto_ban',
                            reason: 'Utilisateur blacklisté'
                        });
                    }
                }
            } catch (error) {
                logError('blacklist', error);
            }
        });
    }
}; 