const { EmbedBuilder } = require('discord.js');
const { EventEmitter } = require('events');

class RaidDefense extends EventEmitter {
    constructor(client) {
        super();
        this.client = client;
        this.raidMode = new Map();
        this.joinQueue = new Map();
        this.verificationLevels = {
            LOW: { captcha: false, accountAge: 1 },
            MEDIUM: { captcha: true, accountAge: 7 },
            HIGH: { captcha: true, accountAge: 30, verification: true }
        };
    }

    enableRaidMode(guild, level = 'MEDIUM') {
        const settings = {
            enabled: true,
            level,
            timestamp: Date.now(),
            autoDisableIn: 30 * 60 * 1000, // 30 minutes
            ...this.verificationLevels[level]
        };

        this.raidMode.set(guild.id, settings);
        this.applyRaidProtection(guild, settings);
    }

    async applyRaidProtection(guild, settings) {
        try {
            // Verrouiller les canaux sensibles
            const channels = guild.channels.cache.filter(ch => 
                ['GUILD_TEXT', 'GUILD_VOICE'].includes(ch.type)
            );

            await Promise.all(channels.map(channel => 
                channel.permissionOverwrites.edit(guild.roles.everyone, {
                    SendMessages: false,
                    Connect: false,
                    AddReactions: false
                })
            ));

            // Créer un salon d'informations
            const infoChannel = await guild.channels.create({
                name: 'raid-protection',
                type: 0,
                permissionOverwrites: [
                    {
                        id: guild.roles.everyone.id,
                        allow: ['ViewChannel'],
                        deny: ['SendMessages']
                    }
                ]
            });

            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('🛡️ Mode Anti-Raid Activé')
                .setDescription(`Le serveur est actuellement en mode protection.\nNiveau: ${settings.level}`)
                .addFields(
                    { name: 'Durée', value: '30 minutes' },
                    { name: 'Restrictions', value: this.getRestrictionsList(settings) }
                )
                .setTimestamp();

            await infoChannel.send({ embeds: [embed] });

            // Configuration automatique
            await guild.setVerificationLevel(settings.verification ? 'HIGH' : 'MEDIUM');
        } catch (error) {
            console.error('Erreur lors de l\'application de la protection:', error);
        }
    }

    getRestrictionsList(settings) {
        const restrictions = [
            '• Messages restreints dans tous les salons',
            '• Connexion vocale désactivée'
        ];

        if (settings.captcha) restrictions.push('• Vérification CAPTCHA requise');
        if (settings.accountAge) restrictions.push(`• Âge minimum du compte: ${settings.accountAge} jours`);
        if (settings.verification) restrictions.push('• Vérification par téléphone requise');

        return restrictions.join('\n');
    }

    async processJoin(member) {
        const settings = this.raidMode.get(member.guild.id);
        if (!settings?.enabled) return true;

        const accountAge = (Date.now() - member.user.createdTimestamp) / (1000 * 60 * 60 * 24);
        
        if (accountAge < settings.accountAge) {
            await member.kick('Compte trop récent - Protection anti-raid');
            return false;
        }

        if (settings.captcha) {
            return this.handleCaptchaVerification(member);
        }

        return true;
    }

    async handleCaptchaVerification(member) {
        // Implémentation du système de CAPTCHA
        // ...existing code...
    }
}

module.exports = RaidDefense;