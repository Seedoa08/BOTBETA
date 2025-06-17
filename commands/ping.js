const cooldowns = new Map();

module.exports = {
    name: 'ping',
    description: 'Affiche la latence du bot et de l\'API Discord.',
    usage: '+ping',
    category: 'Public',
    permissions: null, // Commande publique
    async execute(message) {
        const cooldownTime = 5000; // 5 secondes
        const now = Date.now();

        if (cooldowns.has(message.author.id)) {
            const expirationTime = cooldowns.get(message.author.id) + cooldownTime;
            if (now < expirationTime) {
                const timeLeft = ((expirationTime - now) / 1000).toFixed(1);
                return message.reply(`⏳ Veuillez attendre ${timeLeft} seconde(s) avant de réutiliser cette commande.`);
            }
        }

        cooldowns.set(message.author.id, now);
        setTimeout(() => cooldowns.delete(message.author.id), cooldownTime);

        try {
            const start = Date.now();
            const sentMessage = await message.channel.send('🏓 Calcul de la latence...');
            const botLatency = Date.now() - start;
            const apiLatency = Math.round(message.client.ws.ping);

            const status = botLatency < 200 ? '🟢 Excellent' : botLatency < 400 ? '🟠 Moyen' : '🔴 Mauvais';

            const pingEmbed = {
                color: botLatency < 200 ? 0x00ff00 : botLatency < 400 ? 0xff9900 : 0xff0000,
                title: '🏓 Pong!',
                fields: [
                    { name: 'Latence du bot', value: `${botLatency}ms`, inline: true },
                    { name: 'Latence de l\'API', value: `${apiLatency}ms`, inline: true },
                    { name: 'Statut', value: status, inline: true }
                ],
                footer: {
                    text: `Demandé par ${message.author.tag}`,
                    icon_url: message.author.displayAvatarURL({ dynamic: true })
                },
                timestamp: new Date()
            };

            sentMessage.edit({ content: null, embeds: [pingEmbed] });
        } catch (error) {
            console.error('Erreur dans la commande ping:', error);
            message.reply('❌ Une erreur est survenue lors du calcul de la latence.');
        }
    }
};
