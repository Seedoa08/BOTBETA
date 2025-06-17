const { ActivityType, EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'userinfo',
    description: 'Affiche des informations détaillées sur un utilisateur.',
    usage: '+userinfo [@utilisateur]',
    category: 'Utilitaires',
    permissions: null,
    async execute(message, args) {
        const user = message.mentions.users.first() || message.author;
        const member = message.guild.members.cache.get(user.id);
        
        if (!member) {
            return message.reply('❌ Cet utilisateur n\'est pas dans le serveur.');
        }

        // Vérifier si l'utilisateur est banni
        const isBanned = await message.guild.bans.fetch(user.id).catch(() => null);
        if (isBanned) {
            return message.reply(`❌ ${user.tag} est banni du serveur.`);
        }

        // Informations sur les rôles
        const roles = member.roles.cache
            .filter(role => role.id !== message.guild.id)
            .sort((a, b) => b.position - a.position)
            .map(role => `<@&${role.id}>`)
            .join(' ') || 'Aucun rôle';

        // Informations sur les activités
        const activities = member.presence?.activities || [];
        const activityList = activities.map(activity => {
            let type;
            switch (activity.type) {
                case ActivityType.Custom:
                    type = 'Statut personnalisé';
                    break;
                case ActivityType.Playing:
                    type = 'Joue à';
                    break;
                case ActivityType.Streaming:
                    type = 'En stream';
                    break;
                case ActivityType.Listening:
                    type = 'Écoute';
                    break;
                case ActivityType.Watching:
                    type = 'Regarde';
                    break;
                case ActivityType.Competing:
                    type = 'En compétition';
                    break;
                default:
                    type = 'Activité';
            }
            return `**${type}**: ${activity.name || activity.state || 'Non spécifié'}`;
        }).join('\n') || 'Aucune activité visible';

        // Informations sur le boost
        const boostInfo = member.premiumSinceTimestamp
            ? `Boost depuis <t:${Math.floor(member.premiumSinceTimestamp / 1000)}:R>`
            : 'Aucun boost';

        // Permissions importantes
        const importantPermissions = [
            { name: 'Administrateur', value: member.permissions.has(PermissionsBitField.Flags.Administrator) ? '✅' : '❌' },
            { name: 'Modérer', value: member.permissions.has(PermissionsBitField.Flags.ModerateMembers) ? '✅' : '❌' },
            { name: 'Gérer le serveur', value: member.permissions.has(PermissionsBitField.Flags.ManageGuild) ? '✅' : '❌' },
            { name: 'Gérer les messages', value: member.permissions.has(PermissionsBitField.Flags.ManageMessages) ? '✅' : '❌' },
            { name: 'Gérer les rôles', value: member.permissions.has(PermissionsBitField.Flags.ManageRoles) ? '✅' : '❌' },
            { name: 'Gérer les salons', value: member.permissions.has(PermissionsBitField.Flags.ManageChannels) ? '✅' : '❌' }
        ];

        // Statut de l'utilisateur
        const status = {
            online: '🟢 En ligne',
            idle: '🟡 Inactif',
            dnd: '🔴 Ne pas déranger',
            offline: '⚫ Hors ligne'
        }[member.presence?.status || 'offline'];

        // Créer l'embed
        const embed = new EmbedBuilder()
            .setColor(member.displayHexColor === '#000000' ? '#00ff00' : member.displayHexColor)
            .setTitle(`Informations sur ${user.tag}`)
            .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 512 }))
            .setDescription(`**Statut:** ${status}`)
            .addFields(
                { name: '👤 Informations générales', value: 
                    `**ID:** ${user.id}\n` +
                    `**Pseudo:** ${member.displayName}\n` +
                    `**Bot:** ${user.bot ? 'Oui' : 'Non'}\n` +
                    `**Boost:** ${boostInfo}`, inline: false },
                { name: '📅 Dates', value: 
                    `**Compte créé le:** <t:${Math.floor(user.createdTimestamp / 1000)}:F>\n` +
                    `**A rejoint le:** <t:${Math.floor(member.joinedTimestamp / 1000)}:F>`, inline: false },
                { name: `👑 Rôles [${member.roles.cache.size - 1}]`, value: roles.length > 1024 ? roles.substring(0, 1021) + '...' : roles, inline: false },
                { name: '🎮 Activités', value: activityList, inline: false },
                { name: '🔑 Permissions importantes', value: importantPermissions.map(p => `${p.name}: ${p.value}`).join('\n'), inline: false }
            )
            .setFooter({ 
                text: `Demandé par ${message.author.tag}`,
                icon_url: message.author.displayAvatarURL({ dynamic: true })
            })
            .setTimestamp();

        // Ajouter la bannière si elle existe
        if (user.banner) {
            embed.setImage(user.bannerURL({ dynamic: true, size: 512 }));
        }

        try {
            await message.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Erreur dans la commande userinfo:', error);
            message.reply('❌ Une erreur est survenue lors de l\'envoi des informations.');
        }
    }
};
