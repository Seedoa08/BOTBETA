const { Events } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { logAction, logError } = require('../utils/functions');

// Définir les chemins des fichiers
const dataPath = path.join(__dirname, '../data');
const giveawaysFile = path.join(dataPath, 'giveaways.json');

// Fonction pour charger les giveaways
function loadGiveaways() {
    try {
        if (!fs.existsSync(giveawaysFile)) {
            return {
                active: {},
                ended: {},
                settings: {
                    defaultDuration: 86400000,
                    maxWinners: 10,
                    minWinners: 1,
                    maxDuration: 2592000000,
                    minDuration: 60000,
                    requireRole: null,
                    blacklistedRoles: [],
                    allowedChannels: [],
                    excludedChannels: [],
                    notifyWinners: true,
                    notifyHost: true,
                    logChannel: null
                }
            };
        }
        return JSON.parse(fs.readFileSync(giveawaysFile, 'utf8'));
    } catch (error) {
        logError('giveaway', error);
        return {
            active: {},
            ended: {},
            settings: {
                defaultDuration: 86400000,
                maxWinners: 10,
                minWinners: 1,
                maxDuration: 2592000000,
                minDuration: 60000,
                requireRole: null,
                blacklistedRoles: [],
                allowedChannels: [],
                excludedChannels: [],
                notifyWinners: true,
                notifyHost: true,
                logChannel: null
            }
        };
    }
}

// Fonction pour sauvegarder les giveaways
function saveGiveaways(giveaways) {
    try {
        fs.writeFileSync(giveawaysFile, JSON.stringify(giveaways, null, 4));
    } catch (error) {
        logError('giveaway', error);
    }
}

// Fonction pour vérifier si un utilisateur peut participer
async function canParticipate(member, giveaway) {
    const giveaways = loadGiveaways();
    const settings = giveaways.settings;

    // Vérifier le rôle requis
    if (settings.requireRole && !member.roles.cache.has(settings.requireRole)) {
        return false;
    }

    // Vérifier les rôles blacklistés
    if (member.roles.cache.some(role => settings.blacklistedRoles.includes(role.id))) {
        return false;
    }

    return true;
}

// Fonction pour mettre à jour les participants
async function updateParticipants(giveawayId, userId, action) {
    const giveaways = loadGiveaways();
    const giveaway = giveaways.active[giveawayId];

    if (!giveaway) return;

    if (action === 'add' && !giveaway.participants.includes(userId)) {
        giveaway.participants.push(userId);
    } else if (action === 'remove') {
        giveaway.participants = giveaway.participants.filter(id => id !== userId);
    }

    saveGiveaways(giveaways);
}

module.exports = {
    name: Events.ClientReady,
    once: true,
    execute(client) {
        // Événement de réaction ajoutée
        client.on(Events.MessageReactionAdd, async (reaction, user) => {
            if (user.bot) return;
            if (reaction.emoji.name !== '🎉') return;

            const giveaways = loadGiveaways();
            const giveaway = Object.values(giveaways.active).find(g => g.messageId === reaction.message.id);

            if (!giveaway) return;

            const member = await reaction.message.guild.members.fetch(user.id);
            if (!await canParticipate(member, giveaway)) {
                await reaction.users.remove(user.id);
                try {
                    await user.send(`❌ Vous ne pouvez pas participer à ce giveaway.`);
                } catch (error) {
                    logError('giveaway', error);
                }
                return;
            }

            await updateParticipants(giveaway.id, user.id, 'add');

            // Log de la participation
            logAction('giveaway', {
                guildId: reaction.message.guild.id,
                channelId: reaction.message.channel.id,
                messageId: reaction.message.id,
                giveawayId: giveaway.id,
                userId: user.id,
                action: 'participate'
            });
        });

        // Événement de réaction supprimée
        client.on(Events.MessageReactionRemove, async (reaction, user) => {
            if (user.bot) return;
            if (reaction.emoji.name !== '🎉') return;

            const giveaways = loadGiveaways();
            const giveaway = Object.values(giveaways.active).find(g => g.messageId === reaction.message.id);

            if (!giveaway) return;

            await updateParticipants(giveaway.id, user.id, 'remove');

            // Log de la désinscription
            logAction('giveaway', {
                guildId: reaction.message.guild.id,
                channelId: reaction.message.channel.id,
                messageId: reaction.message.id,
                giveawayId: giveaway.id,
                userId: user.id,
                action: 'unparticipate'
            });
        });

        // Vérification périodique des giveaways expirés
        setInterval(async () => {
            try {
                const giveaways = loadGiveaways();
                const now = Date.now();

                for (const [id, giveaway] of Object.entries(giveaways.active)) {
                    if (giveaway.endTime <= now) {
                        const channel = await client.channels.fetch(giveaway.channelId);
                        if (!channel) continue;

                        const message = await channel.messages.fetch(giveaway.messageId);
                        if (!message) continue;

                        // Récupération des réactions
                        const reaction = message.reactions.cache.get('🎉');
                        const users = await reaction.users.fetch();
                        const validUsers = users.filter(user => !user.bot);

                        if (validUsers.size === 0) {
                            const noWinnerEmbed = {
                                color: 0x0099ff,
                                title: '🎉 Giveaway Terminé',
                                fields: [
                                    { name: 'Prix', value: giveaway.prize },
                                    { name: 'Gagnants', value: 'Aucun gagnant' },
                                    { name: 'Raison', value: 'Personne n\'a participé' }
                                ]
                            };

                            await channel.send({ embeds: [noWinnerEmbed] });
                        } else {
                            // Sélection des gagnants
                            const winnerArray = validUsers.random(Math.min(giveaway.winners, validUsers.size));
                            const winnerMentions = winnerArray.map(user => `<@${user.id}>`).join(', ');

                            const winnerEmbed = {
                                color: 0x0099ff,
                                title: '🎉 Giveaway Terminé',
                                fields: [
                                    { name: 'Prix', value: giveaway.prize },
                                    { name: 'Gagnants', value: winnerMentions },
                                    { name: 'Organisateur', value: `<@${giveaway.hostId}>` }
                                ]
                            };

                            await channel.send({ embeds: [winnerEmbed] });

                            // Notifier les gagnants
                            if (giveaways.settings.notifyWinners) {
                                for (const winner of winnerArray) {
                                    try {
                                        await winner.send(`🎉 Félicitations ! Vous avez gagné **${giveaway.prize}** dans le giveaway de ${channel.guild.name} !`);
                                    } catch (error) {
                                        logError('giveaway', error);
                                    }
                                }
                            }

                            // Notifier l'hôte
                            if (giveaways.settings.notifyHost) {
                                const host = await client.users.fetch(giveaway.hostId);
                                if (host) {
                                    try {
                                        await host.send(`🎉 Votre giveaway pour **${giveaway.prize}** est terminé !\nGagnants: ${winnerMentions}`);
                                    } catch (error) {
                                        logError('giveaway', error);
                                    }
                                }
                            }
                        }

                        // Déplacer le giveaway vers les giveaways terminés
                        giveaways.ended[id] = {
                            ...giveaway,
                            endedAt: now,
                            winners: validUsers.size > 0 ? winnerArray.map(user => user.id) : []
                        };
                        delete giveaways.active[id];

                        saveGiveaways(giveaways);

                        // Log de la fin du giveaway
                        logAction('giveaway', {
                            guildId: channel.guild.id,
                            channelId: channel.id,
                            messageId: message.id,
                            giveawayId: id,
                            winners: validUsers.size > 0 ? winnerArray.map(user => user.id) : [],
                            action: 'end'
                        });
                    }
                }
            } catch (error) {
                logError('giveaway', error);
            }
        }, 60000); // Vérifier toutes les minutes

        // Log de démarrage
        logAction('giveaway', {
            action: 'startup',
            message: 'Module de giveaways démarré'
        });
    }
}; 