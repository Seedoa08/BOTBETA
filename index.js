require('./server.js');
const { Client, Collection, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionsBitField, ActivityType, EmbedBuilder } = require('discord.js');
const config = require('./config.json');
const startServer = require('./keep_alive');
const fs = require('fs');
const path = require('path');
const isOwner = require('./utils/isOwner');
const { incrementVersion } = require('./utils/versionManager'); // Ajouter en haut du fichier avec les autres requires
const { createTicketChannel } = require('./utils/ticketUtils');
const { activeGiveaways } = require('./commands/giveaway.js');
const logger = require('./utils/logger');
const wordlist = require('./config/wordlist.json');
const { sendError, sendSuccess } = require('./utils/functions');
const { logModerationAction } = require('./utils/logger');
const { readJson, writeJson } = require('./utils/fileManager');

// Configuration globale intégrée
const globalConfig = {
    prefix: process.env.PREFIX || "+",
    token: process.env.TOKEN || process.env.DISCORD_TOKEN,
    owners: ["1061373376767201360"],
    version: "1.0.0"
};

// Rendre la config accessible globalement
global.botConfig = globalConfig;

// Créer le client Discord.js
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildMessageReactions
    ]
});

// Initialiser les collections
client.commands = new Collection();
client.snipes = new Collection();

// Charger les commandes
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
    console.log(`Commande chargée : ${command.name}`);
}

// Événement ready
client.once('ready', () => {
    console.log('Bot en ligne !');
    console.log(`Version actuelle: ${globalConfig.version}`);
    console.log(`Inviter le bot: https://discord.com/oauth2/authorize?client_id=${client.user.id}&scope=bot&permissions=8`);
    
    client.user.setPresence({
        activities: [{ 
            name: `${globalConfig.prefix}help | v${globalConfig.version}`,
            type: ActivityType.Playing
        }],
        status: 'online'
    });
});

// Événement guildCreate - Quand le bot rejoint un serveur
client.on('guildCreate', guild => {
    console.log(`Bot ajouté au serveur: ${guild.name} (${guild.id})`);
});

// Map pour le spam (userId -> [timestamps])
const spamMap = new Map();
const SPAM_LIMIT = 5; // messages
const SPAM_INTERVAL = 7000; // ms

// --- ANTI-RAID / ANTI-SPAM ---
const raidMessageWindow = 10000; // 10s
const raidMessageThreshold = 20; // messages
const raidUserThreshold = 5; // utilisateurs
const raidJoinWindow = 10000; // 10s
const raidJoinThreshold = 5; // membres
let raidLockdown = false;
let recentMessages = [];
let recentJoins = [];

async function activateLockdown(guild, client) {
    if (raidLockdown) return;
    raidLockdown = true;
    for (const channel of guild.channels.cache.values()) {
        if (channel.type === 0) { // GuildText
            await channel.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: false }).catch(() => {});
        }
    }
    const logChannelId = config.moderationLogChannelId;
    if (logChannelId) {
        const logChannel = guild.channels.cache.get(logChannelId);
        if (logChannel) {
            logChannel.send({ content: '🚨 **Mode anti-raid activé : tous les salons ont été verrouillés !**' });
        }
    }
}

async function deactivateLockdown(guild, client) {
    if (!raidLockdown) return;
    raidLockdown = false;
    for (const channel of guild.channels.cache.values()) {
        if (channel.type === 0) { // GuildText
            await channel.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: null }).catch(() => {});
        }
    }
    const logChannelId = config.moderationLogChannelId;
    if (logChannelId) {
        const logChannel = guild.channels.cache.get(logChannelId);
        if (logChannel) {
            logChannel.send({ content: '✅ **Mode anti-raid désactivé : tous les salons sont déverrouillés.**' });
        }
    }
}

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith(globalConfig.prefix)) return;
    const args = message.content.slice(globalConfig.prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = client.commands.get(commandName);
    if (!command) return;

    try {
        if (isOwner(message.author.id)) {
            await command.execute(message, args);
        } else if (!command.permissions) {
            // Si pas de permissions requises, exécuter la commande
            await command.execute(message, args);
        } else if (command.permissions && typeof command.permissions === 'string') {
            // Vérifier si la permission existe dans PermissionsBitField
            const permFlag = PermissionsBitField.Flags[command.permissions];
            if (permFlag && message.member.permissions.has(permFlag)) {
                await command.execute(message, args);
            } else {
                return message.reply(`❌ Vous n'avez pas la permission \`${command.permissions}\` nécessaire.`);
            }
        } else {
            return message.reply('❌ Configuration de permission invalide.');
        }
    } catch (error) {
        console.error('Erreur commande:', error);
        message.reply('❌ Une erreur est survenue lors de l\'exécution de la commande.').catch(console.error);
    }

    // --- AUTO-MODERATION : INSULTES ---
    const content = message.content.toLowerCase();
    if (wordlist.bannedWords.some(word => content.includes(word))) {
        await message.delete().catch(() => {});
        await sendError(message.channel, `Message supprimé : langage inapproprié.`);
        // Warn automatique
        const warningsPath = './data/warnings.json';
        const warnings = readJson(warningsPath, '{}');
        warnings[message.author.id] = (warnings[message.author.id] || []).concat({ reason: 'Langage inapproprié', moderator: client.user.id, date: new Date().toISOString() });
        writeJson(warningsPath, warnings);
        await logModerationAction(message.guild, client.user, message.author, 'auto-warn', 'Langage inapproprié');
        return;
    }

    // --- AUTO-MODERATION : LIENS NON AUTORISÉS ---
    const urlRegex = /(https?:\/\/|www\.)[\w\-]+(\.[\w\-]+)+\S*/gi;
    if (urlRegex.test(content)) {
        // Ajoute ici les salons autorisés si besoin
        const allowedChannels = config.allowedLinkChannels || [];
        if (!allowedChannels.includes(message.channel.id)) {
            await message.delete().catch(() => {});
            await sendError(message.channel, `Message supprimé : liens non autorisés.`);
            const warningsPath = './data/warnings.json';
            const warnings = readJson(warningsPath, '{}');
            warnings[message.author.id] = (warnings[message.author.id] || []).concat({ reason: 'Lien non autorisé', moderator: client.user.id, date: new Date().toISOString() });
            writeJson(warningsPath, warnings);
            await logModerationAction(message.guild, client.user, message.author, 'auto-warn', 'Lien non autorisé');
            return;
        }
    }

    // --- AUTO-MODERATION : SPAM ---
    const now = Date.now();
    const userTimestamps = spamMap.get(message.author.id) || [];
    const recentTimestamps = userTimestamps.filter(ts => now - ts < SPAM_INTERVAL);
    recentTimestamps.push(now);
    spamMap.set(message.author.id, recentTimestamps);
    if (recentTimestamps.length >= SPAM_LIMIT) {
        await message.delete().catch(() => {});
        await sendError(message.channel, `Message supprimé : spam détecté.`);
        const warningsPath = './data/warnings.json';
        const warnings = readJson(warningsPath, '{}');
        warnings[message.author.id] = (warnings[message.author.id] || []).concat({ reason: 'Spam', moderator: client.user.id, date: new Date().toISOString() });
        writeJson(warningsPath, warnings);
        await logModerationAction(message.guild, client.user, message.author, 'auto-warn', 'Spam détecté');
        spamMap.set(message.author.id, []); // reset
        return;
    }

    // --- ANTI-RAID : Afflux massif de messages ---
    if (!message.author.bot) {
        recentMessages.push({ user: message.author.id, time: now });
        // Nettoyer les anciens messages
        recentMessages = recentMessages.filter(m => now - m.time < raidMessageWindow);
        const uniqueUsers = new Set(recentMessages.map(m => m.user));
        if (!raidLockdown && recentMessages.length >= raidMessageThreshold && uniqueUsers.size >= raidUserThreshold) {
            await activateLockdown(message.guild, client);
        }
    }

    // --- Commande admin pour unlock ---
    if (message.content === '+unlockall' && message.member.permissions.has('Administrator')) {
        await deactivateLockdown(message.guild, client);
        await sendSuccess(message, 'Tous les salons ont été déverrouillés.');
    }
});

// Gestion des erreurs simplifiée
process.on('unhandledRejection', err => logger.logError(err));
process.on('uncaughtException', err => logger.logError(err));

// Améliorer l'événement messageDelete
client.on('messageDelete', message => {
    try {
        // Ne pas snipe les messages vides ou les messages de bots
        if (!message || !message.author || message.author.bot) return;
        
        // Sauvegarder le message supprimé
        client.snipes.set(message.channel.id, {
            content: message.content,
            author: message.author,
            attachments: message.attachments,
            timestamp: Date.now(),
            member: message.member
        });

        // Supprimer le message snipé après 5 minutes
        setTimeout(() => {
            if (client.snipes.get(message.channel.id)?.timestamp === Date.now()) {
                client.snipes.delete(message.channel.id);
            }
        }, 300000); // 5 minutes

        console.log(`Message snipé dans #${message.channel.name}: ${message.content}`);
    } catch (error) {
        console.error('Erreur lors du snipe:', error);
    }
});

// Gestionnaire d'interactions pour les tickets
client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    // Gestion du bouton giveaway
    if (interaction.customId === 'giveaway_enter') {
        const giveaway = activeGiveaways.get(interaction.message.id);
        if (!giveaway || giveaway.ended) {
            return interaction.reply({ content: 'Ce giveaway est terminé ou introuvable.', ephemeral: true });
        }
        giveaway.participants.add(interaction.user.id);
        return interaction.reply({ content: 'Tu participes au giveaway !', ephemeral: true });
    }

    if (interaction.customId === 'ticket_button') {
        try {
            await interaction.deferReply({ ephemeral: true });
            const channel = await createTicketChannel(interaction.guild, interaction.user);
            if (channel) {
                await interaction.editReply({
                    content: `Votre ticket a été créé: ${channel}`,
                    ephemeral: true
                });
            } else {
                await interaction.editReply({
                    content: 'Une erreur est survenue lors de la création du ticket.',
                    ephemeral: true
                });
            }
        } catch (error) {
            console.error('Erreur ticket:', error);
            await interaction.editReply({
                content: 'Une erreur est survenue.',
                ephemeral: true
            }).catch(() => {});
        }
    }

    // Gestion de la fermeture des tickets
    if (interaction.customId === 'close_ticket') {
        try {
            await interaction.reply('🔒 Ce ticket sera fermé dans 5 secondes...');
            setTimeout(() => interaction.channel.delete(), 5000);
        } catch (error) {
            console.error('Erreur fermeture ticket:', error);
        }
    }
});

client.on('guildMemberAdd', async (member) => {
    const now = Date.now();
    recentJoins.push(now);
    recentJoins = recentJoins.filter(t => now - t < raidJoinWindow);
    if (!raidLockdown && recentJoins.length >= raidJoinThreshold) {
        await activateLockdown(member.guild, client);
    }
});

client.login(config.token).then(() => {
    console.log(`Logged in as ${client.user.tag}`);
    startServer();
}).catch(error => {
    console.error('Login error:', error);
});
