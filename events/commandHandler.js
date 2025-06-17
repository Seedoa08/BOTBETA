const commandManager = require('../utils/commandManager');
const ResponseManager = require('../utils/responseManager');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'messageCreate',
    async execute(message, client) {
        if (message.author.bot) return;

        const { prefix } = require('../config/globals');
        if (!message.content.startsWith(prefix)) return;

        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        const command = client.commands.get(commandName);
        if (!command) {
            // Si la commande n'existe pas, suggérer des commandes similaires
            const similarCommands = Array.from(client.commands.keys())
                .filter(cmd => cmd.includes(commandName))
                .slice(0, 3);

            if (similarCommands.length > 0) {
                return ResponseManager.sendInfo(
                    message,
                    `Commande non trouvée. Commandes similaires :\n${similarCommands.map(cmd => `\`${prefix}${cmd}\``).join('\n')}`,
                    '❓ Commande inconnue'
                );
            }
            return;
        }

        // Permissions fines
        if (command.allowedRoles && Array.isArray(command.allowedRoles)) {
            const memberRoles = message.member ? message.member.roles.cache.map(r => r.name) : [];
            const hasPermission = memberRoles.some(role => command.allowedRoles.includes(role));
            if (!hasPermission) {
                return ResponseManager.sendError(
                    message,
                    "Tu n'as pas la permission d'utiliser cette commande.",
                    command
                );
            }
        }

        // Log d'utilisation
        try {
            await command.execute(message, args);
            commandManager.registerCommand(command);

            const log = {
                user: message.author.id,
                username: message.author.tag,
                command: command.name,
                channel: message.channel.id,
                channelName: message.channel.name,
                date: new Date().toISOString()
            };
            const logPath = path.join(__dirname, '../logs/commandUsage.json');
            fs.appendFileSync(logPath, JSON.stringify(log) + '\n');
        } catch (error) {
            console.error('Erreur lors de l\'exécution de la commande :', error);
            ResponseManager.sendError(
                message,
                `Une erreur est survenue lors de l'exécution de cette commande.\n\`\`\`${error.message}\`\`\``,
                command
            );
        }
    }
};