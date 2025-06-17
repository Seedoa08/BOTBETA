const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const ms = require('ms');

// Map globale pour stocker les giveaways actifs
const activeGiveaways = new Map();

module.exports = {
    name: 'giveaway',
    description: 'Créer un giveaway',
    usage: '+giveaway <durée> <gagnants> <prix> [description]',
    category: 'Fun',
    permissions: 'ManageEvents',
    async execute(message, args) {
        // Vérifier les permissions
        if (!message.member.permissions.has(PermissionFlagsBits.ManageEvents)) {
            return message.reply('❌ Vous n\'avez pas la permission de créer des giveaways.');
        }

        // Vérifier les arguments
        if (!args[0] || !args[1] || !args[2]) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#FF0000')
                        .setTitle('❌ Usage incorrect')
                        .setDescription(
                            '**Usage:** `+giveaway <durée> <gagnants> <prix> [description]`\n\n' +
                            '**Exemples:**\n' +
                            '`+giveaway 1h 1 Nitro`\n' +
                            '`+giveaway 1d 3 Discord Nitro "Un super giveaway!"`\n\n' +
                            '**Durées valides:**\n' +
                            '`s` - secondes\n' +
                            '`m` - minutes\n' +
                            '`h` - heures\n' +
                            '`d` - jours'
                        )
                ]
            });
        }

        const duration = ms(args[0]);
        if (!duration || duration < 10000) {
            return message.reply('❌ Veuillez spécifier une durée valide (minimum 10s).');
        }

        const winners = parseInt(args[1]);
        if (isNaN(winners) || winners < 1 || winners > 10) {
            return message.reply('❌ Veuillez spécifier un nombre valide de gagnants (1-10).');
        }

        const prize = args[2];
        const description = args.slice(3).join(' ') || 'Aucune description fournie';

        const endTime = Date.now() + duration;

        // Créer l'embed du giveaway
        const embed = new EmbedBuilder()
            .setColor('#FF69B4')
            .setTitle('🎉 GIVEAWAY 🎉')
            .setDescription(
                `**Prix:** ${prize}\n` +
                `**Description:** ${description}\n` +
                `**Gagnant(s):** ${winners}\n` +
                `**Fin:** <t:${Math.floor(endTime/1000)}:R>\n` +
                `**Organisé par:** ${message.author}\n\n` +
                `Cliquez sur le bouton ci-dessous pour participer!`
            )
            .setFooter({ text: `ID: ${message.id}` })
            .setTimestamp(endTime);

        // Créer les boutons
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('giveaway_enter')
                    .setLabel('Participer!')
                    .setEmoji('🎉')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('giveaway_info')
                    .setLabel('Informations')
                    .setEmoji('ℹ️')
                    .setStyle(ButtonStyle.Secondary)
            );

        // Envoyer le message du giveaway
        const giveawayMsg = await message.channel.send({
            embeds: [embed],
            components: [row]
        });

        // Stocker les informations du giveaway
        const giveawayData = {
            messageId: giveawayMsg.id,
            channelId: message.channel.id,
            guildId: message.guild.id,
            prize,
            description,
            winners,
            endTime,
            participants: new Set(),
            ended: false,
            hostId: message.author.id
        };
        activeGiveaways.set(giveawayMsg.id, giveawayData);

        // Supprimer le message de commande
        await message.delete().catch(() => {});

        // Programmer la fin du giveaway
        setTimeout(() => endGiveaway(giveawayData, message.client), duration);
    }
};

// Fonction pour terminer le giveaway
async function endGiveaway(giveaway, client) {
    if (giveaway.ended) return;
    giveaway.ended = true;
    activeGiveaways.delete(giveaway.messageId);

    try {
        const channel = await client.channels.fetch(giveaway.channelId);
        const message = await channel.messages.fetch(giveaway.messageId);

        const winners = pickWinners(Array.from(giveaway.participants), giveaway.winners);
        const winnerText = winners.length ? winners.map(w => `<@${w}>`).join(', ') : 'Aucun participant valide';

        const endEmbed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('🎉 GIVEAWAY TERMINÉ 🎉')
            .setDescription(
                `**Prix:** ${giveaway.prize}\n` +
                `**Description:** ${giveaway.description}\n` +
                `**Gagnant(s):** ${winnerText}\n` +
                `**Participants:** ${giveaway.participants.size}\n` +
                `**Organisé par:** <@${giveaway.hostId}>`
            )
            .setTimestamp();

        await message.edit({
            embeds: [endEmbed],
            components: []
        });

        if (winners.length) {
            const winnerAnnouncement = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('🎉 Félicitations!')
                .setDescription(
                    `${winnerText} a(ont) gagné **${giveaway.prize}**!\n` +
                    `Merci à tous les ${giveaway.participants.size} participants!`
                )
                .setTimestamp();

            channel.send({ embeds: [winnerAnnouncement] });
        } else {
            const noWinnersEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('❌ Aucun gagnant')
                .setDescription(
                    `Aucun gagnant n'a pu être sélectionné car il n'y avait pas assez de participants.\n` +
                    `Prix: **${giveaway.prize}**`
                )
                .setTimestamp();

            channel.send({ embeds: [noWinnersEmbed] });
        }
    } catch (error) {
        console.error('Erreur giveaway:', error);
    }
}

// Fonction pour sélectionner les gagnants
function pickWinners(participants, count) {
    const winners = [];
    const shuffled = participants.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

// Export pour usage externe
module.exports.activeGiveaways = activeGiveaways;
module.exports.endGiveaway = endGiveaway;
