const fs = require('fs');
const path = require('path');
const { sendWelcomeMessage } = require('../commands/welcome');

module.exports = {
    name: 'guildMemberAdd',
    async execute(member) {
        const welcomeConfigPath = path.join(__dirname, '../config/welcome.json');
        
        // Vérifier si la configuration existe
        if (!fs.existsSync(welcomeConfigPath)) return;
        
        const config = JSON.parse(fs.readFileSync(welcomeConfigPath));
        if (!config.enabled || !config.channel) return;

        const welcomeChannel = member.guild.channels.cache.get(config.channel);
        if (!welcomeChannel) return;

        try {
            await sendWelcomeMessage(member, welcomeChannel, config);
        } catch (error) {
            console.error('Erreur lors de l\'envoi du message de bienvenue:', error);
        }
    }
};
