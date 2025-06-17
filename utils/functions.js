const { EmbedBuilder } = require('discord.js');
const config = require('../config/config');
const Logger = require('./logger');

// Vérification des permissions
function checkPermissions(member, permission) {
    return member.permissions.has(permission);
}

// Vérification des permissions du bot
function checkBotPermissions(guild, permission) {
    return guild.members.me.permissions.has(permission);
}

// Création d'un embed de succès
function createSuccessEmbed(title, description, fields = []) {
    return new EmbedBuilder()
        .setColor(config.colors.success)
        .setTitle(title)
        .setDescription(description)
        .addFields(fields)
        .setFooter(config.embeds.footer)
        .setTimestamp();
}

// Création d'un embed d'erreur
function createErrorEmbed(title, description) {
    return new EmbedBuilder()
        .setColor(config.colors.error)
        .setTitle(title)
        .setDescription(description)
        .setFooter(config.embeds.footer)
        .setTimestamp();
}

// Création d'un embed de modération
function createModerationEmbed(title, fields = []) {
    return new EmbedBuilder()
        .setColor(config.colors.moderation)
        .setTitle(title)
        .addFields(fields)
        .setFooter(config.embeds.footer)
        .setTimestamp();
}

// Vérification de la durée
function checkDuration(duration, type) {
    const { min, max } = config.durations[type];
    return duration >= min && duration <= max;
}

// Vérification des limites
function checkLimit(value, type, subType = null) {
    const limits = subType ? config.limits[type][subType] : config.limits[type];
    return value >= limits.min && value <= limits.max;
}

// Log d'une action
function logAction(action, data) {
    if (!config.logs.enabled) return;
    
    Logger.log(action, {
        ...data,
        color: config.logs.colors[action]
    });
}

// Log d'une erreur
function logError(action, error) {
    Logger.error(action, error);
}

// Formatage de la durée
function formatDuration(duration) {
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} jour(s)`;
    if (hours > 0) return `${hours} heure(s)`;
    if (minutes > 0) return `${minutes} minute(s)`;
    return `${seconds} seconde(s)`;
}

// Vérification des arguments
function validateArgs(args, required) {
    return args.length >= required;
}

// Vérification de l'utilisateur
async function validateUser(guild, userId) {
    try {
        const user = await guild.client.users.fetch(userId);
        const member = await guild.members.fetch(userId);
        return { user, member };
    } catch {
        return null;
    }
}

// Vérification du rôle
function validateRole(role, member, bot) {
    if (role.managed) return false;
    if (role.position >= bot.roles.highest.position) return false;
    if (role.position >= member.roles.highest.position) return false;
    return true;
}

function sendSuccess(message, text) {
    return message.reply({ embeds: [new EmbedBuilder().setColor(0x00ff00).setDescription(`✅ ${text}`)] });
}

function sendError(message, text) {
    return message.reply({ embeds: [new EmbedBuilder().setColor(0xff0000).setDescription(`❌ ${text}`)] });
}

module.exports = {
    checkPermissions,
    checkBotPermissions,
    createSuccessEmbed,
    createErrorEmbed,
    createModerationEmbed,
    checkDuration,
    checkLimit,
    logAction,
    logError,
    formatDuration,
    validateArgs,
    validateUser,
    validateRole,
    sendSuccess,
    sendError
}; 