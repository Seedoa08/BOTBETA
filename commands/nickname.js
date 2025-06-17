const { PermissionsBitField } = require('discord.js');
const isOwner = require('../utils/isOwner');

module.exports = {
    name: 'nickname',
    description: 'Change le surnom d\'un utilisateur',
    usage: '+nickname @utilisateur [nouveau pseudo]',
    permissions: 'ManageNicknames',
    variables: [
        { name: '@utilisateur', description: 'L\'utilisateur dont on veut changer le pseudo' },
        { name: 'nouveau pseudo', description: 'Le nouveau pseudo (vide pour réinitialiser)' }
    ],
    async execute(message, args) {
        // Bypass des permissions pour les owners
        if (!isOwner(message.author.id) && !message.member.permissions.has(PermissionsBitField.Flags.ManageNicknames)) {
            return message.reply('❌ Vous n\'avez pas la permission de changer les surnoms.');
        }

        const member = message.mentions.members.first();
        if (!member) {
            return message.reply('❌ Mentionnez un utilisateur.');
        }

        const newNickname = args.slice(1).join(' ');

        try {
            await member.setNickname(newNickname);
            message.reply(`✅ Pseudo ${newNickname ? 'changé en ' + newNickname : 'réinitialisé'} pour ${member.user.tag}.`);
        } catch (error) {
            message.reply('❌ Je ne peux pas modifier ce pseudo.');
        }
    }
};
