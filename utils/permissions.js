const fs = require('fs');
const { PermissionsBitField } = require('discord.js');
const authorizedUsersFile = './authorizedUsers.json';
const { ownerId } = require('../config/owner');

function isAuthorized(userId) {
    try {
        if (!fs.existsSync(authorizedUsersFile)) {
            fs.writeFileSync(authorizedUsersFile, JSON.stringify({ users: [] }, null, 4));
            return false;
        }
        const data = JSON.parse(fs.readFileSync(authorizedUsersFile, 'utf8'));
        return data.users?.includes(userId) || false;
    } catch (error) {
        console.error('Erreur lors de la vérification des autorisations:', error);
        return false;
    }
}

function checkPermissions(message, requiredPermissions) {
    // Bypass total pour l'owner
    if (message.author.id === ownerId) {
        return true;
    }

    // Vérification normale pour les autres utilisateurs
    return message.member.permissions.has(requiredPermissions);
}

module.exports = { isAuthorized, checkPermissions };
