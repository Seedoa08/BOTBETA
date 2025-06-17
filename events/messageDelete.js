const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../data/logsConfig.json');
const defaultConfig = {
    enabled: true,
    events: {
        messageDelete: true,
        messageEdit: true,
        memberBoost: true,
        moderation: true,
        memberJoin: true,
        memberLeave: true
    },
    channelId: null
};

function loadConfig() {
    try {
        if (!fs.existsSync(configPath)) {
            fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
            return defaultConfig;
        }
        return JSON.parse(fs.readFileSync(configPath));
    } catch (error) {
        console.error('Error loading logs config:', error);
        return defaultConfig;
    }
}

module.exports = async (message, client) => {
    if (!message.guild || message.author.bot) return;
    
    const config = loadConfig();
    if (!config?.enabled || !config.events?.messageDelete) return;

    const logChannel = message.guild.channels.cache.get(config.channelId);
    if (!logChannel) return;

    const logEmbed = {
        color: 0xff0000,
        author: {
            name: message.author.tag,
            icon_url: message.author.displayAvatarURL({ dynamic: true })
        },
        description: `📝 **Message supprimé dans** <#${message.channel.id}>`,
        fields: [
            {
                name: 'Contenu',
                value: message.content || 'Aucun contenu texte'
            }
        ],
        footer: { text: `ID: ${message.author.id}` },
        timestamp: new Date()
    };

    logChannel.send({ embeds: [logEmbed] });
};
