const { PermissionsBitField } = require('discord.js');
const ms = require('ms');

module.exports = {
    name: 'voicemute',
    description: 'Mute un utilisateur en vocal',
    usage: '+voicemute @utilisateur [durée] [raison]',
    permissions: 'MuteMembers',
    async execute(message, args) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.MuteMembers)) {
            return message.reply('❌ Permission manquante: Mute les membres');
        }

        const member = message.mentions.members.first();
        if (!member) return message.reply('❌ Mentionnez un membre');
        if (!member.voice.channel) return message.reply('❌ L\'utilisateur n\'est pas en vocal');

        const duration = args[1] ? ms(args[1]) : null;
        const reason = args.slice(2).join(' ') || 'Aucune raison fournie';

        try {
            await member.voice.setMute(true, reason);
            const embed = {
                color: 0xff0000,
                title: '🎤 Mute Vocal',
                description: `${member} a été mute en vocal`,
                fields: [
                    { name: 'Durée', value: duration ? ms(duration, { long: true }) : 'Indéfini' },
                    { name: 'Raison', value: reason }
                ]
            };

            message.reply({ embeds: [embed] });

            if (duration) {
                setTimeout(() => {
                    member.voice.setMute(false, 'Fin du mute vocal')
                        .catch(console.error);
                }, duration);
            }
        } catch (error) {
            message.reply('❌ Erreur lors du mute vocal');
        }
    }
};
