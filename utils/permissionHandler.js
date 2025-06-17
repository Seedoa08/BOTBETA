const { PermissionsBitField } = require('discord.js');
const config = require('../config/commands');

class PermissionHandler {
    constructor(client) {
        this.client = client;
    }

    // Vérifier les permissions d'un utilisateur pour une commande
    async checkPermissions(member, command) {
        // Si la commande n'a pas de permissions requises, elle est accessible à tous
        if (!command.permissions) return true;

        // Vérifier si l'utilisateur est propriétaire du bot
        if (config.owners.includes(member.id)) return true;

        // Vérifier les permissions spécifiques de la commande
        if (Array.isArray(command.permissions)) {
            return command.permissions.every(perm => member.permissions.has(perm));
        }

        // Vérifier une seule permission
        return member.permissions.has(command.permissions);
    }

    // Vérifier les permissions du bot
    async checkBotPermissions(channel, permissions) {
        const botMember = channel.guild.members.cache.get(this.client.user.id);
        if (!botMember) return false;

        if (Array.isArray(permissions)) {
            return permissions.every(perm => botMember.permissionsIn(channel).has(perm));
        }

        return botMember.permissionsIn(channel).has(permissions);
    }

    // Obtenir les permissions manquantes
    getMissingPermissions(member, permissions) {
        if (!Array.isArray(permissions)) {
            permissions = [permissions];
        }

        return permissions.filter(perm => !member.permissions.has(perm));
    }

    // Vérifier les permissions pour une catégorie de commandes
    async checkCategoryPermissions(member, category) {
        const categoryConfig = config.categories[category];
        if (!categoryConfig) return true;

        const defaultPerms = config.defaultPermissions[category];
        if (!defaultPerms) return true;

        return this.checkPermissions(member, { permissions: defaultPerms });
    }

    // Vérifier les permissions pour un rôle spécifique
    async checkRolePermissions(member, roleId) {
        return member.roles.cache.has(roleId);
    }

    // Vérifier les permissions pour un canal spécifique
    async checkChannelPermissions(member, channel) {
        const permissions = channel.permissionsFor(member);
        return permissions ? permissions.has(PermissionsBitField.Flags.ViewChannel) : false;
    }

    // Obtenir les permissions nécessaires pour une commande
    getRequiredPermissions(command) {
        if (!command.permissions) return [];

        if (Array.isArray(command.permissions)) {
            return command.permissions;
        }

        return [command.permissions];
    }

    // Vérifier si un utilisateur peut gérer les messages
    async canManageMessages(member) {
        return member.permissions.has(PermissionsBitField.Flags.ManageMessages);
    }

    // Vérifier si un utilisateur peut gérer les membres
    async canManageMembers(member) {
        return member.permissions.has(PermissionsBitField.Flags.ModerateMembers);
    }

    // Vérifier si un utilisateur peut gérer le serveur
    async canManageGuild(member) {
        return member.permissions.has(PermissionsBitField.Flags.ManageGuild);
    }
}

module.exports = PermissionHandler; 