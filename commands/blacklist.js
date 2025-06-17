const { PermissionsBitField } = require('discord.js');
const fs = require('fs');
const path = require('path');
const isOwner = require('../utils/isOwner');

// Définir les chemins des fichiers
const dataPath = path.join(__dirname, '../data');
const blacklistFile = path.join(dataPath, 'blacklist.json');

// Créer le dossier data s'il n'existe pas
if (!fs.existsSync(dataPath)) {
    fs.mkdirSync(dataPath, { recursive: true });
}

// Initialiser le fichier blacklist s'il n'existe pas
if (!fs.existsSync(blacklistFile)) {
    fs.writeFileSync(blacklistFile, JSON.stringify({
        users: [],
        reasons: {}
    }, null, 4));
}

module.exports = {
    name: 'blacklist',
    description: 'Gère la liste noire du bot',
    usage: '+blacklist <add/remove/list> [utilisateur] [raison]',
    category: 'Administration',
    permissions: null,
    ownerOnly: true,
    async execute(message, args) {
        if (!isOwner(message.author.id)) {
            return message.reply('❌ Cette commande est réservée aux owners du bot.');
        }

        const blacklist = JSON.parse(fs.readFileSync(blacklistFile, 'utf8'));
        const subCommand = args[0]?.toLowerCase();

        switch (subCommand) {
            case 'add':
                const userToAdd = message.mentions.users.first() || await message.client.users.fetch(args[1]).catch(() => null);
                if (!userToAdd) {
                    return message.reply('❌ Utilisateur introuvable.');
                }

                if (blacklist.users.includes(userToAdd.id)) {
                    return message.reply('❌ Cet utilisateur est déjà dans la blacklist.');
                }

                const reason = args.slice(2).join(' ') || 'Aucune raison fournie.';
                blacklist.users.push(userToAdd.id);
                blacklist.reasons[userToAdd.id] = {
                    reason,
                    date: new Date().toISOString(),
                    by: message.author.id
                };

                fs.writeFileSync(blacklistFile, JSON.stringify(blacklist, null, 4));
                message.reply(`✅ ${userToAdd.tag} a été ajouté à la blacklist.\nRaison: ${reason}`);
                break;

            case 'remove':
                const userToRemove = message.mentions.users.first() || await message.client.users.fetch(args[1]).catch(() => null);
                if (!userToRemove) {
                    return message.reply('❌ Utilisateur introuvable.');
                }

                const index = blacklist.users.indexOf(userToRemove.id);
                if (index === -1) {
                    return message.reply('❌ Cet utilisateur n\'est pas dans la blacklist.');
                }

                blacklist.users.splice(index, 1);
                delete blacklist.reasons[userToRemove.id];

                fs.writeFileSync(blacklistFile, JSON.stringify(blacklist, null, 4));
                message.reply(`✅ ${userToRemove.tag} a été retiré de la blacklist.`);
                break;

            case 'list':
                if (blacklist.users.length === 0) {
                    return message.reply('📋 La blacklist est vide.');
                }

                const listEmbed = {
                    color: 0xff0000,
                    title: '📋 Liste noire du bot',
                    description: 'Liste des utilisateurs blacklistés:',
                    fields: await Promise.all(blacklist.users.map(async userId => {
                        const user = await message.client.users.fetch(userId).catch(() => null);
                        const info = blacklist.reasons[userId] || {};
                        return {
                            name: user ? user.tag : `ID: ${userId}`,
                            value: [
                                `Raison: ${info.reason || 'Non spécifiée'}`,
                                `Date: ${info.date ? new Date(info.date).toLocaleString() : 'Inconnue'}`,
                                `Par: ${info.by ? `<@${info.by}>` : 'Inconnu'}`
                            ].join('\n')
                        };
                    })),
                    timestamp: new Date()
                };

                message.reply({ embeds: [listEmbed] });
                break;

            default:
                message.reply('❌ Usage: `+blacklist <add/remove/list> [utilisateur] [raison]`');
        }
    }
};
