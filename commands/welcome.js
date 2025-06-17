const { PermissionsBitField, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const welcomeConfigPath = path.join(__dirname, '../config/welcome.json');

module.exports = {
    name: 'welcome',
    description: 'Configure le système de bienvenue',
    usage: '+welcome <setup/config/test/toggle>',
    category: 'Configuration',
    permissions: 'ManageGuild',
    async execute(message, args) {
        // Vérifier si le fichier de configuration existe, sinon le créer
        if (!fs.existsSync(welcomeConfigPath)) {
            const defaultConfig = {
                enabled: false,
                channel: null,
                message: "Bienvenue {user} sur {server} ! Tu es notre {count}ème membre !",
                embedColor: "0x7289DA",
                withImage: true
            };
            fs.writeFileSync(welcomeConfigPath, JSON.stringify(defaultConfig, null, 4));
        }

        const config = JSON.parse(fs.readFileSync(welcomeConfigPath));
        const subcommand = args[0]?.toLowerCase();

        switch (subcommand) {
            case 'setup':
                const channel = message.mentions.channels.first();
                if (!channel) {
                    return message.reply('❌ Vous devez mentionner un salon!');
                }
                config.channel = channel.id;
                config.enabled = true;
                message.reply(`✅ Salon de bienvenue défini sur ${channel}`);
                break;

            case 'toggle':
                config.enabled = !config.enabled;
                message.reply(`✅ Messages de bienvenue ${config.enabled ? 'activés' : 'désactivés'}`);
                break;

            case 'config':
                let colorValue = config.embedColor;
                if (typeof colorValue === 'string' && colorValue.startsWith('0x')) {
                    colorValue = parseInt(colorValue, 16);
                }
                const embed = new EmbedBuilder()
                    .setColor(colorValue)
                    .setTitle('⚙️ Configuration des messages de bienvenue')
                    .addFields([
                        { name: 'État', value: config.enabled ? '✅ Activé' : '❌ Désactivé' },
                        { name: 'Salon', value: config.channel ? `<#${config.channel}>` : 'Non défini' },
                        { name: 'Message', value: config.message },
                        { name: 'Image', value: config.withImage ? '✅ Activée' : '❌ Désactivée' }
                    ]);
                message.reply({ embeds: [embed] });
                break;

            case 'test':
                if (!config.channel) {
                    return message.reply('❌ Le salon de bienvenue n\'est pas configuré!');
                }
                const welcomeChannel = message.guild.channels.cache.get(config.channel);
                if (!welcomeChannel) {
                    return message.reply('❌ Le salon de bienvenue n\'existe plus!');
                }
                
                // Simuler un message de bienvenue
                await sendWelcomeMessage(message.member, welcomeChannel, config);
                message.reply('✅ Message de test envoyé!');
                break;

            default:
                message.reply('❌ Usage: `+welcome <setup/config/test/toggle>`');
        }

        fs.writeFileSync(welcomeConfigPath, JSON.stringify(config, null, 4));
    }
};

// Cette fonction sera exportée pour être utilisée par l'événement guildMemberAdd
async function sendWelcomeMessage(member, channel, config) {
    if (!config.enabled || !channel) return;

    let welcomeMessage = config.message
        .replace('{user}', member.toString())
        .replace('{server}', member.guild.name)
        .replace('{count}', member.guild.memberCount);

    let colorValue = config.embedColor;
    if (typeof colorValue === 'string' && colorValue.startsWith('0x')) {
        colorValue = parseInt(colorValue, 16);
    }
    const embed = new EmbedBuilder()
        .setColor(colorValue)
        .setTitle('👋 Nouveau membre!')
        .setDescription(welcomeMessage)
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
        .setTimestamp();

    if (config.withImage) {
        embed.setImage('https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.pinterest.com%2Fpin%2Fwelcome-gif-welcome-discover-share-gifs--992199361644578877%2F&psig=AOvVaw3HT23CFfmZAVuu_FcZcU3k&ust=1746102516799000&source=images&cd=vfe&opi=89978449&ved=0CBMQjRxqFwoTCKj8g_jg_4wDFQAAAAAdAAAAABAJ'); // Remplacez par votre image
    }

    await channel.send({ embeds: [embed] });
}

module.exports.sendWelcomeMessage = sendWelcomeMessage;
