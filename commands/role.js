const { PermissionsBitField } = require('discord.js');
const isOwner = require('../utils/isOwner');

module.exports = {
    name: 'role',
    description: 'Gère les rôles d\'un utilisateur',
    usage: '+role <add/remove/info> @utilisateur @role',
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

        const action = args[0]?.toLowerCase();
        const member = message.mentions.members.first();
        const role = message.mentions.roles.first();

        if (!['add', 'remove', 'info'].includes(action)) {
            return message.reply('❌ Action invalide. Utilisez `add`, `remove` ou `info`.');
        }

        if (!member) {
            return message.reply('❌ Mentionnez un utilisateur.');
        }

        switch (action) {
            case 'add':
                if (!role) return message.reply('❌ Mentionnez un rôle à ajouter.');
                await member.roles.add(role);
                return message.reply(`✅ Rôle ${role.name} ajouté à ${member.user.tag}`);

            case 'remove':
                if (!role) return message.reply('❌ Mentionnez un rôle à retirer.');
                await member.roles.remove(role);
                return message.reply(`✅ Rôle ${role.name} retiré de ${member.user.tag}`);

            case 'info':
                const roles = member.roles.cache
                    .filter(r => r.id !== message.guild.id)
                    .sort((a, b) => b.position - a.position)
                    .map(r => `\`${r.name}\``)
                    .join(', ');

                const embed = {
                    color: member.displayColor || 0x0099ff,
                    title: `Rôles de ${member.user.tag}`,
                    description: roles || 'Aucun rôle',
                    footer: { text: `${member.roles.cache.size - 1} rôles` }
                };
                return message.reply({ embeds: [embed] });
        }
    }
};
