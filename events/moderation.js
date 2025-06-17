const { Events, EmbedBuilder } = require('discord.js');
const config = require('../config/events');
const Logger = require('../utils/logger');

module.exports = {
    name: 'moderation',
    async execute(client) {
        const logger = new Logger(client);

        // Événement de suppression de message
        client.on(Events.MessageDelete, async message => {
            if (!config.events.moderation.messageDelete) return;
            if (message.author?.bot) return;

            await logger.logDeletedMessage(message);
        });

        // Événement de modification de message
        client.on(Events.MessageUpdate, async (oldMessage, newMessage) => {
            if (!config.events.moderation.messageUpdate) return;
            if (oldMessage.author?.bot) return;
            if (oldMessage.content === newMessage.content) return;

            await logger.logEditedMessage(oldMessage, newMessage);
        });

        // Événement de join d'un membre
        client.on(Events.GuildMemberAdd, async member => {
            if (!config.events.moderation.memberJoin) return;

            // Logger l'événement
            await logger.logMemberJoin(member);

            // Envoyer le message de bienvenue
            if (config.welcome.enabled) {
                const welcomeChannel = member.guild.channels.cache.find(
                    ch => ch.name === config.welcome.channel
                );

                if (welcomeChannel) {
                    const welcomeMessage = config.welcome.message
                        .replace('{user}', member.toString())
                        .replace('{server}', member.guild.name)
                        .replace('{count}', member.guild.memberCount);

                    await welcomeChannel.send(welcomeMessage);
                }

                // Envoyer un message en DM
                if (config.welcome.dmMessage) {
                    try {
                        const dmMessage = config.welcome.dmMessage
                            .replace('{server}', member.guild.name);

                        await member.send(dmMessage);
                    } catch (error) {
                        console.error('Impossible d\'envoyer le message de bienvenue en DM:', error);
                    }
                }

                // Donner le rôle automatique
                if (config.welcome.role) {
                    try {
                        const role = member.guild.roles.cache.get(config.welcome.role);
                        if (role) {
                            await member.roles.add(role);
                        }
                    } catch (error) {
                        console.error('Erreur lors de l\'attribution du rôle automatique:', error);
                    }
                }
            }
        });

        // Événement de leave d'un membre
        client.on(Events.GuildMemberRemove, async member => {
            if (!config.events.moderation.memberLeave) return;

            // Logger l'événement
            await logger.logMemberLeave(member);

            // Envoyer le message d'adieu
            if (config.goodbye.enabled) {
                const goodbyeChannel = member.guild.channels.cache.find(
                    ch => ch.name === config.goodbye.channel
                );

                if (goodbyeChannel) {
                    const goodbyeMessage = config.goodbye.message
                        .replace('{user}', member.user.tag);

                    await goodbyeChannel.send(goodbyeMessage);
                }
            }
        });

        // Anti-spam
        const userMessages = new Map();
        const userMentions = new Map();
        const userEmojis = new Map();

        client.on(Events.MessageCreate, async message => {
            if (!config.antiSpam.enabled) return;
            if (message.author.bot) return;
            if (!message.guild) return;

            const userId = message.author.id;
            const now = Date.now();

            // Gérer les messages
            if (!userMessages.has(userId)) {
                userMessages.set(userId, []);
            }
            userMessages.get(userId).push(now);
            userMessages.set(userId, userMessages.get(userId).filter(time => now - time < 5000));

            // Gérer les mentions
            const mentions = message.mentions.users.size + message.mentions.roles.size;
            if (!userMentions.has(userId)) {
                userMentions.set(userId, []);
            }
            userMentions.get(userId).push({ time: now, count: mentions });
            userMentions.set(userId, userMentions.get(userId).filter(item => now - item.time < 5000));

            // Gérer les emojis
            const emojiCount = (message.content.match(/<a?:\w+:\d+>/g) || []).length;
            if (!userEmojis.has(userId)) {
                userEmojis.set(userId, []);
            }
            userEmojis.get(userId).push({ time: now, count: emojiCount });
            userEmojis.set(userId, userEmojis.get(userId).filter(item => now - item.time < 5000));

            // Vérifier les limites
            const messageCount = userMessages.get(userId).length;
            const mentionCount = userMentions.get(userId).reduce((sum, item) => sum + item.count, 0);
            const emojiCount = userEmojis.get(userId).reduce((sum, item) => sum + item.count, 0);

            if (messageCount > config.antiSpam.maxMessages ||
                mentionCount > config.antiSpam.maxMentions ||
                emojiCount > config.antiSpam.maxEmojis) {

                try {
                    switch (config.antiSpam.punishment) {
                        case 'timeout':
                            await message.member.timeout(config.antiSpam.duration, 'Anti-spam');
                            break;
                        case 'kick':
                            await message.member.kick('Anti-spam');
                            break;
                        case 'ban':
                            await message.member.ban({ reason: 'Anti-spam' });
                            break;
                    }

                    // Logger l'action
                    await logger.logModeration(
                        'Anti-spam',
                        client.user,
                        message.author,
                        `Spam détecté (${messageCount} messages, ${mentionCount} mentions, ${emojiCount} emojis)`
                    );

                } catch (error) {
                    console.error('Erreur lors de la punition anti-spam:', error);
                }
            }
        });

        // Anti-raid
        const recentJoins = new Map();

        client.on(Events.GuildMemberAdd, async member => {
            if (!config.antiRaid.enabled) return;

            const guildId = member.guild.id;
            const now = Date.now();

            if (!recentJoins.has(guildId)) {
                recentJoins.set(guildId, []);
            }

            recentJoins.get(guildId).push({ time: now, userId: member.id });
            recentJoins.set(guildId, recentJoins.get(guildId).filter(join => now - join.time < 10000));

            const joinCount = recentJoins.get(guildId).length;

            if (joinCount > config.antiRaid.maxJoins) {
                try {
                    // Bannir les membres récemment joints
                    for (const join of recentJoins.get(guildId)) {
                        if (!config.antiRaid.whitelist.includes(join.userId)) {
                            await member.guild.members.ban(join.userId, { reason: 'Anti-raid' });
                        }
                    }

                    // Logger l'action
                    await logger.logModeration(
                        'Anti-raid',
                        client.user,
                        { tag: 'N/A', id: 'N/A' },
                        `${joinCount} membres bannis pour raid`
                    );

                } catch (error) {
                    console.error('Erreur lors de la protection anti-raid:', error);
                }
            }
        });
    }
}; 