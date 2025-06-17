const { PermissionsBitField } = require('discord.js');
const isOwner = require('../utils/isOwner');

module.exports = {
    name: 'wordlist',
    description: 'Gère la liste des mots interdits',
    usage: '+wordlist <add/remove/list> [mot]',
    permissions: 'ManageMessages',
    variables: [
        { name: 'add', description: 'Ajoute un mot à la liste des mots interdits.' },
        { name: 'remove', description: 'Retire un mot de la liste des mots interdits.' },
        { name: 'list', description: 'Affiche la liste des mots interdits.' }
    ],
    async execute(message, args) {
        // Bypass des permissions pour les owners
        if (!isOwner(message.author.id) && !message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            return message.reply('❌ Vous n\'avez pas la permission de gérer la wordlist.');
        }

        const subCommand = args[0]?.toLowerCase();
        const word = args[1]?.toLowerCase();

        switch (subCommand) {
            case 'add':
                if (!word) {
                    return message.reply('❌ Vous devez spécifier un mot à ajouter. Exemple : `+wordlist add mot`');
                }
                const wordsToAdd = db.get('words') || [];
                if (wordsToAdd.includes(word)) {
                    return message.reply('❌ Ce mot est déjà dans la liste des mots interdits.');
                }
                wordsToAdd.push(word);
                db.set('words', wordsToAdd);
                return message.reply(`✅ Le mot \`${word}\` a été ajouté à la liste des mots interdits.`);

            case 'remove':
                if (!word) {
                    return message.reply('❌ Vous devez spécifier un mot à retirer. Exemple : `+wordlist remove mot`');
                }
                const wordsToRemove = db.get('words') || [];
                if (!wordsToRemove.includes(word)) {
                    return message.reply('❌ Ce mot n\'est pas dans la liste des mots interdits.');
                }
                db.set('words', wordsToRemove.filter(w => w !== word));
                return message.reply(`✅ Le mot \`${word}\` a été retiré de la liste des mots interdits.`);

            case 'list':
                const wordsList = db.get('words') || [];
                if (wordsList.length === 0) {
                    return message.reply('📋 La liste des mots interdits est vide.');
                }
                return message.reply(`📋 Liste des mots interdits :\n${wordsList.join(', ')}`);

            default:
                return message.reply('❌ Commande invalide. Utilisez `add`, `remove` ou `list`.');
        }
    }
};
