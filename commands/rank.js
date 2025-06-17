const { PermissionsBitField } = require('discord.js');
const isOwner = require('../utils/isOwner');

module.exports = {
    name: 'rank',
    description: 'Ajoute un rôle à un utilisateur',
    usage: '+rank @role @utilisateur',
    permissions: 'ManageRoles',
    async execute(message, args) {
        // Vérifier uniquement les permissions du bot
        if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
            return message.reply('❌ Je n\'ai pas la permission de gérer les rôles.');
        }

        // Bypass des permissions pour les owners
        if (!isOwner(message.author.id) && !message.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
            return message.reply('❌ Vous n\'avez pas la permission de gérer les rôles.');
        }

        const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[0]);
        const member = message.mentions.members.first();

        if (!role || !member) {
            return message.reply('❌ Utilisation : `+rank @role @utilisateur`');
        }

        // Vérifier si le rôle est gérable par le bot
        if (!role.editable || role.position >= message.guild.members.me.roles.highest.position) {
            return message.reply('❌ Je ne peux pas gérer ce rôle. Il est peut-être plus haut que mon rôle le plus élevé.');
        }

        try {
            if (member.roles.cache.has(role.id)) {
                await member.roles.remove(role);
                message.reply(`✅ Rôle \`${role.name}\` retiré de ${member.user.tag}`);
            } else {
                await member.roles.add(role);
                message.reply(`✅ Rôle \`${role.name}\` ajouté à ${member.user.tag}`);
            }
        } catch (error) {
            console.error('Erreur lors de la modification du rôle:', error);
            message.reply('❌ Une erreur est survenue lors de la modification du rôle.');
        }
    }
};
