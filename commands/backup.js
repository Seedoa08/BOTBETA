const { PermissionsBitField } = require('discord.js');
const isOwner = require('../utils/isOwner');

module.exports = {
    name: 'backup',
    description: 'Gère les sauvegardes du serveur',
    usage: '+backup <create/load/list/info>',
    permissions: 'Administrator',
    
    async execute(message, args) {
        // Bypass pour les owners
        if (!isOwner(message.author.id) && !message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply('❌ Vous devez être administrateur pour utiliser cette commande.');
        }
        
        const backupDir = './backups';
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }

        const filesToBackup = [
            './warnings.json',
            './authorizedUsers.json',
            './muteHistory.json',
            './logs/moderation.json'
        ];

        try {
            for (const file of filesToBackup) {
                if (fs.existsSync(file)) {
                    const fileName = path.basename(file);
                    const backupPath = path.join(backupDir, `${fileName}.backup-${Date.now()}`);
                    fs.copyFileSync(file, backupPath);
                    console.log(`📁 Fichier sauvegardé : ${backupPath}`);
                }
            }
            message.reply('✅ Sauvegarde effectuée avec succès.');
        } catch (error) {
            console.error('Erreur lors de la sauvegarde :', error);
            message.reply('❌ Une erreur est survenue lors de la sauvegarde.');
        }
    }
};
