const fs = require('fs');
const path = require('path');
const { PermissionsBitField, ChannelType } = require('discord.js');

function generateTranscript(channel) {
    // Code pour générer la transcription
}

function saveTicketLog(ticket) {
    // Code pour sauvegarder les logs
}

async function createTicketChannel(guild, user) {
    try {
        // Ensure user is cached
        const member = await guild.members.fetch(user.id);
        
        return await guild.channels.create({
            name: `ticket-${user.username}`,
            type: ChannelType.GuildText,
            permissionOverwrites: [
                {
                    id: guild.id, // @everyone role
                    deny: [PermissionsBitField.Flags.ViewChannel]
                },
                {
                    id: member.id,
                    allow: [
                        PermissionsBitField.Flags.ViewChannel,
                        PermissionsBitField.Flags.SendMessages,
                        PermissionsBitField.Flags.ReadMessageHistory
                    ]
                }
            ]
        });
    } catch (error) {
        console.error('Erreur création ticket:', error);
        return null;
    }
}

module.exports = {
    generateTranscript,
    saveTicketLog,
    createTicketChannel
};
