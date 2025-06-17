const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../config.json');

module.exports = {
    name: 'help',
    description: 'Affiche l\'aide des commandes',
    usage: '+help [catégorie]',
    category: 'Utilitaires',
    async execute(message, args) {
        const categories = {
            'moderation': {
                name: '🛡️ Modération',
                color: '#FF0000',
                description: 'Commandes de modération pour gérer votre serveur',
                commands: [
                    { name: 'ban', description: 'Bannir un membre', usage: '+ban @membre [raison]' },
                    { name: 'unban', description: 'Débannir un membre', usage: '+unban ID' },
                    { name: 'kick', description: 'Expulser un membre', usage: '+kick @membre [raison]' },
                    { name: 'mute', description: 'Rendre muet un membre', usage: '+mute @membre [durée] [raison]' },
                    { name: 'unmute', description: 'Rendre la parole à un membre', usage: '+unmute @membre' },
                    { name: 'tempmute', description: 'Mute temporaire', usage: '+tempmute @membre [durée] [raison]' },
                    { name: 'voicemute', description: 'Mute vocal', usage: '+voicemute @membre [durée]' },
                    { name: 'warn', description: 'Avertir un membre', usage: '+warn @membre [raison]' },
                    { name: 'warnings', description: 'Voir les avertissements', usage: '+warnings @membre' },
                    { name: 'clearwarns', description: 'Effacer les avertissements', usage: '+clearwarns @membre' },
                    { name: 'softban', description: 'Bannir temporairement', usage: '+softban @membre [raison]' },
                    { name: 'lock', description: 'Verrouiller un salon', usage: '+lock' },
                    { name: 'unlock', description: 'Déverrouiller un salon', usage: '+unlock' },
                    { name: 'slowmode', description: 'Définir le mode lent', usage: '+slowmode [durée]' },
                    { name: 'purge', description: 'Supprimer des messages', usage: '+purge [nombre]' },
                    { name: 'clear', description: 'Nettoyer des messages', usage: '+clear [nombre]' },
                    { name: 'nuke', description: 'Supprimer un salon', usage: '+nuke' }
                ]
            },
            'administration': {
                name: '📊 Administration',
                color: '#00FF00',
                description: 'Commandes d\'administration avancées',
                commands: [
                    { name: 'modpanel', description: 'Panneau de modération', usage: '+modpanel' },
                    { name: 'modstats', description: 'Statistiques de modération', usage: '+modstats' },
                    { name: 'modlogs', description: 'Logs de modération', usage: '+modlogs [@membre]' },
                    { name: 'modconfig', description: 'Configuration de la modération', usage: '+modconfig' },
                    { name: 'sanctions', description: 'Voir les sanctions', usage: '+sanctions @membre' },
                    { name: 'case', description: 'Gérer les cas de modération', usage: '+case [ID]' },
                    { name: 'history', description: 'Historique des actions', usage: '+history @membre' },
                    { name: 'audit', description: 'Voir les logs d\'audit', usage: '+audit' },
                    { name: 'automod', description: 'Configuration de l\'auto-modération', usage: '+automod' },
                    { name: 'blacklist', description: 'Gérer la liste noire', usage: '+blacklist [add/remove] [mot]' }
                ]
            },
            'utilitaires': {
                name: '🎮 Utilitaires',
                color: '#0000FF',
                description: 'Commandes utiles pour tous les jours',
                commands: [
                    { name: 'help', description: 'Afficher l\'aide', usage: '+help [catégorie]' },
                    { name: 'helpall', description: 'Afficher toutes les commandes', usage: '+helpall' },
                    { name: 'ping', description: 'Voir la latence', usage: '+ping' },
                    { name: 'uptime', description: 'Voir le temps de fonctionnement', usage: '+uptime' },
                    { name: 'info', description: 'Informations sur le bot', usage: '+info' },
                    { name: 'serverinfo', description: 'Informations sur le serveur', usage: '+serverinfo' },
                    { name: 'userinfo', description: 'Informations sur un utilisateur', usage: '+userinfo @membre' },
                    { name: 'roleinfo', description: 'Informations sur un rôle', usage: '+roleinfo @rôle' },
                    { name: 'channel', description: 'Gérer les salons', usage: '+channel [create/delete]' },
                    { name: 'role', description: 'Gérer les rôles', usage: '+role [create/delete]' },
                    { name: 'nickname', description: 'Changer le pseudo', usage: '+nickname @membre [nouveau pseudo]' },
                    { name: 'banner', description: 'Voir la bannière', usage: '+banner @membre' },
                    { name: 'pic', description: 'Voir l\'avatar', usage: '+pic @membre' },
                    { name: 'emoji', description: 'Gérer les emojis', usage: '+emoji [add/remove]' },
                    { name: 'snipe', description: 'Voir le dernier message supprimé', usage: '+snipe' }
                ]
            },
            'fun': {
                name: '🎉 Fun & Événements',
                color: '#FF00FF',
                description: 'Commandes amusantes et événements',
                commands: [
                    { name: 'giveaway', description: 'Créer un giveaway', usage: '+giveaway [durée] [prix]' },
                    { name: 'welcome', description: 'Configuration des messages de bienvenue', usage: '+welcome' },
                    { name: 'verify', description: 'Système de vérification', usage: '+verify' },
                    { name: 'sun', description: 'Message spécial sur Sun', usage: '+sun' }
                ]
            },
            'configuration': {
                name: '⚙️ Configuration',
                color: '#FFFF00',
                description: 'Paramètres du serveur et du bot',
                commands: [
                    { name: 'settings', description: 'Paramètres du serveur', usage: '+settings' },
                    { name: 'setprefix', description: 'Changer le préfixe', usage: '+setprefix [nouveau préfixe]' },
                    { name: 'setpresence', description: 'Changer le statut', usage: '+setpresence [statut]' },
                    { name: 'maintenance', description: 'Mode maintenance', usage: '+maintenance [on/off]' },
                    { name: 'wordlist', description: 'Liste de mots interdits', usage: '+wordlist [add/remove] [mot]' }
                ]
            },
            'systeme': {
                name: '🔧 Système',
                color: '#FFA500',
                description: 'Commandes système réservées aux owners',
                commands: [
                    { name: 'backup', description: 'Sauvegarder le serveur', usage: '+backup' },
                    { name: 'broadcast', description: 'Diffuser un message', usage: '+broadcast [message]' },
                    { name: 'debug', description: 'Mode debug', usage: '+debug' },
                    { name: 'diagnostic', description: 'Diagnostic du bot', usage: '+diagnostic' },
                    { name: 'eval', description: 'Évaluer du code', usage: '+eval [code]' },
                    { name: 'leave', description: 'Quitter un serveur', usage: '+leave [ID serveur]' },
                    { name: 'reload', description: 'Recharger les commandes', usage: '+reload' },
                    { name: 'restart', description: 'Redémarrer le bot', usage: '+restart' },
                    { name: 'shutdown', description: 'Éteindre le bot', usage: '+shutdown' },
                    { name: 'stats', description: 'Statistiques du bot', usage: '+stats' },
                    { name: 'version', description: 'Version du bot', usage: '+version' }
                ]
            },
            'tickets': {
                name: '🎫 Tickets',
                color: '#00FFFF',
                description: 'Système de tickets de support',
                commands: [
                    { name: 'ticket', description: 'Gérer les tickets (support, signalement, partenariat, panel, close, add, remove)', usage: '+ticket <sous-commande>' }
                ]
            },
            'owner': {
                name: '👑 Propriétaire',
                color: '#FFD700',
                description: 'Commandes réservées aux owners',
                commands: [
                    { name: 'derank', description: 'Retirer des rôles', usage: '+derank @membre' },
                    { name: 'rank', description: 'Gérer les rangs', usage: '+rank [add/remove] @membre @rôle' }
                ]
            }
        };

        const categoryNames = Object.keys(categories);
        let currentPage = 0;

        if (args[0]) {
            const category = args[0].toLowerCase();
            if (categories[category]) {
                currentPage = categoryNames.indexOf(category);
            }
        }

        function createEmbed(page) {
            const category = categories[categoryNames[page]];
            const embed = new EmbedBuilder()
                .setColor(category.color)
                .setTitle(`${category.name}`)
                .setDescription(`${category.description}\n\nUtilisez \`${config.prefix}help <commande>\` pour plus de détails sur une commande.`)
                .setFooter({ text: `Page ${page + 1}/${categoryNames.length} • ${config.prefix}help [catégorie]` })
                .setTimestamp();

            category.commands.forEach(cmd => {
                embed.addFields({ 
                    name: `${config.prefix}${cmd.name}`, 
                    value: `${cmd.description}\n\`${cmd.usage}\``,
                    inline: false 
                });
            });

            return embed;
        }

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('prev')
                    .setLabel('◀️ Précédent')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('next')
                    .setLabel('Suivant ▶️')
                    .setStyle(ButtonStyle.Primary)
            );

        const helpMessage = await message.reply({
            embeds: [createEmbed(currentPage)],
            components: [row]
        });

        const filter = i => i.user.id === message.author.id;
        const collector = helpMessage.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async interaction => {
            if (interaction.customId === 'prev') {
                currentPage = (currentPage - 1 + categoryNames.length) % categoryNames.length;
            } else if (interaction.customId === 'next') {
                currentPage = (currentPage + 1) % categoryNames.length;
            }

            await interaction.update({
                embeds: [createEmbed(currentPage)],
                components: [row]
            });
        });

        collector.on('end', () => {
            helpMessage.edit({
                components: []
            }).catch(() => {});
        });
    }
};
