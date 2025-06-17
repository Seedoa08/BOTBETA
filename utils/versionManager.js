const fs = require('fs');
const path = require('path');

function incrementVersion() {
    const packagePath = path.join(__dirname, '../package.json');
    const configPath = path.join(__dirname, '../config.json');

    try {
        // Lire les fichiers
        const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));

        // Convertir la version en array [major, minor, patch]
        const version = packageData.version.split('.').map(Number);
        
        // Incrémenter le numéro de patch
        version[2]++;

        // Si patch atteint 10, incrémenter minor et réinitialiser patch
        if (version[2] >= 10) {
            version[1]++;
            version[2] = 0;
            
            // Si minor atteint 10, incrémenter major et réinitialiser minor
            if (version[1] >= 10) {
                version[0]++;
                version[1] = 0;
            }
        }

        // Convertir en string
        const newVersion = version.join('.');

        // Mettre à jour les deux fichiers
        packageData.version = newVersion;
        configData.version = newVersion;

        // Sauvegarder les modifications
        fs.writeFileSync(packagePath, JSON.stringify(packageData, null, 4));
        fs.writeFileSync(configPath, JSON.stringify(configData, null, 4));

        console.log(`✅ Version mise à jour: ${newVersion}`);
        return newVersion;
    } catch (error) {
        console.error('Erreur lors de la mise à jour de la version:', error);
        return null;
    }
}

module.exports = { incrementVersion };
