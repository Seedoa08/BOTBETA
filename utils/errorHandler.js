const fs = require('fs');
const path = require('path');

class ErrorHandler {
    constructor() {
        this.errorLogPath = path.join(__dirname, '../logs/errors.json');
        this.ensureLogFile();
    }

    ensureLogFile() {
        const dir = path.dirname(this.errorLogPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        if (!fs.existsSync(this.errorLogPath)) {
            fs.writeFileSync(this.errorLogPath, JSON.stringify([], null, 2));
        }
    }

    logError(error, context) {
        const errorLog = {
            timestamp: new Date().toISOString(),
            type: error.name,
            message: error.message,
            stack: error.stack,
            context: context,
        };

        const currentLogs = JSON.parse(fs.readFileSync(this.errorLogPath, 'utf8'));
        currentLogs.unshift(errorLog);
        
        // Garder uniquement les 100 dernières erreurs
        if (currentLogs.length > 100) {
            currentLogs.pop();
        }

        fs.writeFileSync(this.errorLogPath, JSON.stringify(currentLogs, null, 2));
        return errorLog;
    }

    handleError(error, message, command) {
        const context = {
            command: command?.name || 'Unknown',
            user: message?.author?.tag || 'Unknown',
            guild: message?.guild?.name || 'DM',
            channel: message?.channel?.name || 'Unknown'
        };

        const errorLog = this.logError(error, context);

        // Réponses personnalisées selon le type d'erreur
        const errorMessages = {
            'DiscordAPIError[50013]': '❌ Je n\'ai pas les permissions nécessaires pour effectuer cette action.',
            'DiscordAPIError[50001]': '❌ Je n\'ai pas accès à cette ressource.',
            'DiscordAPIError[10008]': '❌ Message introuvable ou supprimé.',
            'RangeError': '❌ Une valeur invalide a été fournie.',
            'TypeError': '❌ Une erreur de type s\'est produite.',
            default: '❌ Une erreur est survenue lors de l\'exécution de la commande.'
        };

        const errorMessage = errorMessages[error.name] || errorMessages.default;
        return {
            errorLog,
            userMessage: errorMessage,
            errorId: errorLog.timestamp
        };
    }
}

module.exports = {
    handleError(error, message, command) {
        const errorId = Date.now();
        console.error(`Error ${errorId}:`, error);
        
        return {
            userMessage: 'Une erreur est survenue lors de l\'exécution de la commande.',
            errorId: errorId
        };
    }
};
