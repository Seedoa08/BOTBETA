const { PermissionsBitField } = require('discord.js');
const fs = require('fs');
const path = require('path');
const isOwner = require('../utils/isOwner');

// Chemin vers le fichier des avertissements
const warningsPath = path.join(__dirname, '../data/warnings.json');

module.exports = {
    name: 'clearwarns',
    description: 'Supprime les avertissements d\'un utilisateur',
    usage: '+clearwarns @utilisateur [nombre/all]',
    category: 'Modération',
    permissions: 'ManageMessages',
    async execute(message, args) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages) && !isOwner(message.author.id)) {
            return message.reply('❌ Vous n\'avez pas la permission de supprimer les avertissements.');
        }

        const user = message.mentions.users.first();
        if (!user) {
            return message.reply('❌ Vous devez mentionner un utilisateur.');
        }

        if (!fs.existsSync(warningsPath)) {
            return message.reply('❌ Aucun avertissement enregistré.');
        }

        const warnings = JSON.parse(fs.readFileSync(warningsPath, 'utf8'));
        if (!warnings[user.id] || warnings[user.id].length === 0) {
            return message.reply('✅ Cet utilisateur n\'a aucun avertissement.');
        }

        const amount = args[1]?.toLowerCase();

        if (amount === 'all') {
            // Supprimer tous les avertissements
            warnings[user.id] = [];
            fs.writeFileSync(warningsPath, JSON.stringify(warnings, null, 4));
            return message.reply(`✅ Tous les avertissements de ${user.tag} ont été supprimés.`);
        }

        const numberToRemove = parseInt(amount);
        if (isNaN(numberToRemove) || numberToRemove < 1) {
            return message.reply('❌ Veuillez spécifier un nombre valide ou "all".');
        }

        // Supprimer le nombre spécifié d'avertissements
        warnings[user.id].splice(-numberToRemove);
        fs.writeFileSync(warningsPath, JSON.stringify(warnings, null, 4));

        const remainingWarns = warnings[user.id].length;
        message.reply(`✅ ${numberToRemove} avertissement(s) de ${user.tag} ont été supprimés. Il lui reste ${remainingWarns} avertissement(s).`);
    }
};
