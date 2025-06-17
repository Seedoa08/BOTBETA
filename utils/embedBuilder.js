const { EmbedBuilder } = require('discord.js');

class BetterEmbed extends EmbedBuilder {
    constructor(data = {}) {
        super({
            ...data,
            footer: {
                text: data.footer?.text || '© Nayz Bot • Made by Heiwa',
                icon_url: data.footer?.icon_url
            },
            timestamp: data.timestamp || new Date(),
            color: data.color || 0x0099ff
        });
    }

    setSuccessStyle() {
        return this.setColor(0x00ff00)
            .setAuthor({ name: '✅ Succès', iconURL: 'https://i.imgur.com/8PGsESb.png' });
    }

    setErrorStyle() {
        return this.setColor(0xff0000)
            .setAuthor({ name: '❌ Erreur', iconURL: 'https://i.imgur.com/QBDZaYS.png' });
    }

    setWarningStyle() {
        return this.setColor(0xffff00)
            .setAuthor({ name: '⚠️ Attention', iconURL: 'https://i.imgur.com/M6pWZQ7.png' });
    }

    setInfoStyle() {
        return this.setColor(0x0099ff)
            .setAuthor({ name: 'ℹ️ Information', iconURL: 'https://i.imgur.com/HjlOoZN.png' });
    }
}

module.exports = BetterEmbed;
