const { PermissionsBitField } = require('discord.js');
const ms = require('ms');
const isOwner = require('../utils/isOwner');
const userResolver = require('../utils/userResolver');

module.exports = {
    name: 'softban',
    description: 'Bannit puis débannit un utilisateur pour purger ses messages',
    usage: '+softban @utilisateur [durée] [raison]',
    permissions: 'BanMembers',
    async execute(message, args) {
        // Vérifier uniquement les permissions du bot
        if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.BanMembers)) {
            return message.reply('❌ Je n\'ai pas la permission de bannir des membres.');
        }

        // Bypass des permissions pour les owners
        if (!isOwner(message.author.id) && !message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
            return message.reply('❌ Vous n\'avez pas la permission de softban des membres.');
        }

        const user = message.mentions.users.first();
        const duration = args[1];
        const reason = args.slice(2).join(' ') || 'Aucune raison fournie.';
        if (!user) {
            return message.reply('❌ Vous devez mentionner un utilisateur à bannir.');
        }

        const member = message.guild.members.cache.get(user.id);
        if (!member) {
            return message.reply('❌ Cet utilisateur n\'est pas dans le serveur.');
        }

        const durationMs = ms(duration);
        if (isNaN(durationMs)) {
            return message.reply('❌ Durée invalide! Exemple: `10m`, `1h`.');
        }

        try {
            await member.ban({ reason });
            message.reply(`✅ ${user.tag} a été banni temporairement pour ${ms(durationMs, { long: true })}. Raison: ${reason}`);

            setTimeout(async () => {
                try {
                    await message.guild.members.unban(user.id, 'Fin du bannissement temporaire');
                    message.channel.send(`✅ ${user.tag} a été débanni après ${ms(durationMs, { long: true })}.`);
                } catch (error) {
                    console.error('Erreur lors du débannissement:', error);
                }
            }, durationMs);
        } catch (error) {
            console.error('Erreur lors du bannissement temporaire:', error);
            message.reply('❌ Une erreur est survenue lors du bannissement temporaire.');
        }
    }
};
