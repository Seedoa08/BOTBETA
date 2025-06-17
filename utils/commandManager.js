const fs = require('fs');
const path = require('path');

class CommandManager {
    constructor() {
        this.commands = new Map();
        this.categories = {
            "🛡️ Modération": ['ban', 'kick', 'mute', 'unmute', 'warn', 'clear', 'lock', 'unlock', 'slowmode', 'purge', 'nuke'],
            "⚙️ Configuration": ['anti-raid', 'settings', 'maintenance', 'automod'],
            "📊 Utilitaires": ['ping', 'info', 'serverinfo', 'userinfo', 'pic', 'banner'],
            "🛠️ Système": ['help', 'helpall', 'warnings'],
            "🔒 Owner": ['eval', 'maintenance', 'owneronly']
        };
    }

    registerCommand(command) {
        // Enregistrer la commande
        this.commands.set(command.name, command);

        // Trouver la catégorie appropriée
        let found = false;
        for (const [category, commands] of Object.entries(this.categories)) {
            if (commands.includes(command.name)) {
                found = true;
                break;
            }
        }

        // Si la commande n'est pas dans une catégorie, l'ajouter à Utilitaires
        if (!found) {
            this.categories["📊 Utilitaires"].push(command.name);
        }

        this.saveCategories();
    }

    saveCategories() {
        const configPath = path.join(__dirname, '../config/categories.json');
        fs.writeFileSync(configPath, JSON.stringify(this.categories, null, 2));
    }

    getCommandsByCategory() {
        return this.categories;
    }

    getAllCommands() {
        return this.commands;
    }

    getCommandInfo(commandName) {
        return this.commands.get(commandName);
    }

    findCategory(commandName) {
        for (const [category, commands] of Object.entries(this.categories)) {
            if (commands.includes(commandName)) {
                return category;
            }
        }
        return "📊 Utilitaires";
    }
}

module.exports = new CommandManager();
