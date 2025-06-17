const fs = require('fs');
const path = require('path');

class LocalDB {
    constructor(dbFilePath) {
        this.dbFilePath = dbFilePath;

        // Vérifiez si le fichier existe, sinon créez-le avec un objet vide
        if (!fs.existsSync(this.dbFilePath)) {
            fs.writeFileSync(this.dbFilePath, JSON.stringify({}, null, 4));
        }
    }

    // Lire les données de la base de données
    read() {
        try {
            const data = fs.readFileSync(this.dbFilePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error(`Erreur lors de la lecture de la base de données : ${error.message}`);
            return {};
        }
    }

    // Écrire des données dans la base de données
    write(data) {
        try {
            fs.writeFileSync(this.dbFilePath, JSON.stringify(data, null, 4));
        } catch (error) {
            console.error(`Erreur lors de l'écriture dans la base de données : ${error.message}`);
        }
    }

    // Ajouter ou mettre à jour une clé dans la base de données
    set(key, value) {
        const data = this.read();
        data[key] = value;
        this.write(data);
    }

    // Récupérer une valeur par clé
    get(key) {
        const data = this.read();
        return data[key];
    }

    // Supprimer une clé de la base de données
    delete(key) {
        const data = this.read();
        delete data[key];
        this.write(data);
    }

    // Vérifier si une clé existe
    has(key) {
        const data = this.read();
        return Object.prototype.hasOwnProperty.call(data, key);
    }
}

module.exports = LocalDB;
