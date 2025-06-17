const fs = require('fs');
const path = require('path');

// Charger la configuration
const config = require('./config.json');

// Remplacer le token par la variable d'environnement
if (process.env.TOKEN) {
    config.token = process.env.TOKEN;
}

// Sauvegarder la configuration
fs.writeFileSync(
    path.join(__dirname, 'config.json'),
    JSON.stringify(config, null, 4)
);

// Démarrer le bot
require('./index.js');
