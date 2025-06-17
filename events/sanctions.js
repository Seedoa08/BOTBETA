const { Events } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { logAction, logError, createModerationEmbed } = require('../utils/functions');

// Chemin du fichier sanctions
const sanctionsFile = path.join(__dirname, '../data/sanctions.json');

// Fonction pour charger la configuration
function loadSanctions() {
    try {
        return JSON.parse(fs.readFileSync(sanctionsFile, 'utf8'));
    } catch (error) {
        logError('sanctions', error);
        return { users: {}, settings: {} };
    }
}

// Fonction pour sauvegarder la configuration
function saveSanctions(sanctions) {
    try {
        fs.writeFileSync(sanctionsFile, JSON.stringify(sanctions, null, 4));
    } catch (error) {
        logError('sanctions', error);
    }
}

// Fonction pour ajouter une sanction
async function addSanction(guild, userId, type, reason, moderatorId) {
    const sanctions = loadSanctions();
    if (!sanctions.users[userId]) {
        sanctions.users[userId] = {
            total: 0,
            warns: 0,
            mutes: 0,
            kicks: 0,
            bans: 0,
            history: []
        };
    }

    const userSanctions = sanctions.users[userId];
    userSanctions.total++;
    userSanctions[`${type}s`]++;
    userSanctions.history.push({
        type,
        reason,
        date: new Date().toISOString(),
        moderator: moderatorId
    });

    saveSanctions(sanctions);

    // Vérifier les actions automatiques
    const autoActions = sanctions.settings.autoActions;
    if (autoActions && autoActions[type]) {
        const threshold = autoActions[type].threshold;
        const action = autoActions[type].action;
        const count = userSanctions[`${type}s`];

        if (count >= threshold) {
            const member = await guild.members.fetch(userId).catch(() => null);
            if (member) {
                try {
                    switch (action) {
                        case 'mute':
                            await member.timeout(3600000, `Action automatique après ${count} ${type}s`);
                            break;
                        case 'kick':
                            await member.kick(`Action automatique après ${count} ${type}s`);
                            break;
                        case 'ban':
                            await member.ban({ reason: `Action automatique après ${count} ${type}s` });
                            break;
                    }

                    // Notifier l'utilisateur si configuré
                    if (sanctions.settings.notifyUser) {
                        try {
                            await member.user.send(
                                `⚠️ Une action automatique a été appliquée après ${count} ${type}s.\n` +
                                `Action: ${action}\nRaison: ${reason}`
                            );
                        } catch (error) {
                            logError('sanctions', error);
                        }
                    }

                    // Envoyer dans le canal de logs si configuré
                    if (sanctions.settings.logChannel) {
                        const logChannel = guild.channels.cache.get(sanctions.settings.logChannel);
                        if (logChannel) {
                            const embed = createModerationEmbed('⚡ Action Automatique', [
                                {
                                    name: 'Utilisateur',
                                    value: `${member.user.tag} (${member.id})`
                                },
                                {
                                    name: 'Action',
                                    value: `${type} → ${action}`
                                },
                                {
                                    name: 'Raison',
                                    value: reason
                                },
                                {
                                    name: 'Détails',
                                    value: `${count}/${threshold} ${type}s`
                                }
                            ]);
                            await logChannel.send({ embeds: [embed] });
                        }
                    }

                    // Log de l'action
                    logAction('sanctions', {
                        guildId: guild.id,
                        userId: member.id,
                        action: `auto_${action}`,
                        reason: `Action automatique après ${count} ${type}s`
                    });
                } catch (error) {
                    logError('sanctions', error);
                }
            }
        }
    }

    return userSanctions;
}

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        // Événement pour gérer les sanctions
        client.on('sanction', async (guild, userId, type, reason, moderatorId) => {
            try {
                await addSanction(guild, userId, type, reason, moderatorId);
            } catch (error) {
                logError('sanctions', error);
            }
        });

        // Événement pour gérer les mutes expirés
        setInterval(async () => {
            try {
                const sanctions = loadSanctions();
                for (const guild of client.guilds.cache.values()) {
                    for (const [userId, userSanctions] of Object.entries(sanctions.users)) {
                        const member = await guild.members.fetch(userId).catch(() => null);
                        if (member && member.isCommunicationDisabled()) {
                            const timeout = member.communicationDisabledUntil;
                            if (timeout && timeout < new Date()) {
                                // Le mute est expiré, on peut le retirer
                                await member.timeout(null);
                            }
                        }
                    }
                }
            } catch (error) {
                logError('sanctions', error);
            }
        }, 60000); // Vérifier toutes les minutes
    }
}; 