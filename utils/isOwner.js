const fs = require('fs');
const path = require('path');

function isOwner(userId) {
    try {
        const configPath = path.join(__dirname, '../config.json');
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        
        // Si l'utilisateur est dans la liste des owners
        if (config.owners && config.owners.includes(userId)) {
            return true;
        }

        // Par défaut, retourner false
        return false;
    } catch (error) {
        console.error('Erreur lors de la vérification du statut owner:', error);
        return false;
    }
}

module.exports = isOwner;
