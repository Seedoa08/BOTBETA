const fs = require('fs');
const path = require('path');

class ServerConfig {
    constructor() {
        this.configPath = path.join(__dirname, '../data/serverConfig.json');
        this.defaultConfig = {
            antiRaid: {
                enabled: false,
                joinCooldown: 10,
                maxJoins: 5,
                action: 'kick',
                whitelist: []
            }
        };
        this.loadConfig();
    }

    loadConfig() {
        try {
            if (!fs.existsSync(this.configPath)) {
                fs.writeFileSync(this.configPath, JSON.stringify({}, null, 4));
            }
            this.config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
        } catch (error) {
            console.error('Erreur lors du chargement de la configuration:', error);
            this.config = {};
        }
    }

    saveConfig() {
        try {
            fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 4));
        } catch (error) {
            console.error('Erreur lors de la sauvegarde de la configuration:', error);
        }
    }

    getServerConfig(guildId) {
        if (!this.config[guildId]) {
            this.config[guildId] = { ...this.defaultConfig };
            this.saveConfig();
        }
        return this.config[guildId];
    }

    updateServerConfig(guildId, newConfig) {
        this.config[guildId] = { ...this.config[guildId], ...newConfig };
        this.saveConfig();
    }
}

module.exports = new ServerConfig();
