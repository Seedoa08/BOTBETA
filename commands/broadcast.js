const { PermissionsBitField } = require('discord.js');
const isOwner = require('../utils/isOwner');

module.exports = {
    name: 'broadcast',
    description: 'Envoie un message dans tous les salons',
    permissions: 'Administrator',
    async execute(message, args) {
        // Les commandes de broadcast sont réservées uniquement aux owners
        if (!isOwner(message.author.id)) {
            return message.reply('❌ Cette commande est réservée aux owners du bot.');
        }

        // Extraire les options
        const preview = args.includes('--preview');
        const ping = args.includes('--ping');
        const delayFlag = args.find(arg => arg.startsWith('--delay'));
        const delay = delayFlag ? parseInt(delayFlag.split(' ')[1]) * 1000 : 0;

        // Nettoyer les arguments
        args = args.filter(arg => !arg.startsWith('--'));
        const broadcastMessage = args.join(' ');

        if (!broadcastMessage) {
            return message.reply('❌ Veuillez fournir un message à diffuser.');
        }

        const embed = {
            color: 0x0099ff,
            title: '📢 Annonce importante',
            description: broadcastMessage,
            fields: [
                { name: 'Envoyé par', value: message.author.tag, inline: true },
                { name: 'Date', value: new Date().toLocaleString(), inline: true }
            ],
            footer: {
                text: `Message de ${message.client.user.username}`,
                icon_url: message.client.user.displayAvatarURL()
            },
            timestamp: new Date()
        };

        // Aperçu si demandé
        if (preview) {
            const previewEmbed = { ...embed };
            previewEmbed.title = '📝 Aperçu de l\'annonce';
            await message.channel.send({ 
                content: ping ? '@everyone' : null,
                embeds: [previewEmbed] 
            });
            
            const confirmation = await message.channel.send('Voulez-vous envoyer ce message ? (oui/non)');
            const filter = m => m.author.id === message.author.id && ['oui', 'non'].includes(m.content.toLowerCase());
            const collected = await message.channel.awaitMessages({ filter, max: 1, time: 30000 });

            if (!collected.size || collected.first().content.toLowerCase() === 'non') {
                return message.reply('❌ Diffusion annulée.');
            }
        }

        const status = await message.reply('📤 Diffusion en cours...');
        let successCount = 0;
        let failCount = 0;
        const failedGuilds = [];

        for (const [_, guild] of message.client.guilds.cache) {
            try {
                const channel = guild.channels.cache
                    .find(ch => ch.type === 0 && ch.permissionsFor(guild.members.me).has(['SendMessages', 'EmbedLinks']));
                
                if (channel) {
                    await channel.send({
                        content: ping ? '@everyone' : null,
                        embeds: [embed]
                    });
                    successCount++;
                    
                    if (delay) {
                        await new Promise(resolve => setTimeout(resolve, delay));
                    }
                } else {
                    failCount++;
                    failedGuilds.push(guild.name);
                }
            } catch (error) {
                failCount++;
                failedGuilds.push(`${guild.name} (${error.message})`);
            }

            // Mettre à jour le statut tous les 5 serveurs
            if ((successCount + failCount) % 5 === 0) {
                await status.edit(`📤 Diffusion en cours... ${successCount + failCount}/${message.client.guilds.cache.size} serveurs traités`);
            }
        }

        const finalEmbed = {
            color: successCount > failCount ? 0x00ff00 : 0xff0000,
            title: '📊 Rapport de diffusion',
            fields: [
                { name: '✅ Succès', value: `${successCount} serveurs`, inline: true },
                { name: '❌ Échecs', value: `${failCount} serveurs`, inline: true },
                { name: 'Message', value: broadcastMessage.substring(0, 1000) }
            ],
            timestamp: new Date()
        };

        if (failedGuilds.length > 0) {
            finalEmbed.fields.push({
                name: '❌ Serveurs en échec',
                value: failedGuilds.slice(0, 10).join('\n') + (failedGuilds.length > 10 ? '\n...' : '')
            });
        }

        await status.edit({ content: null, embeds: [finalEmbed] });
    }
};
