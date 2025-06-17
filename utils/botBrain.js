const fs = require('fs');
const path = require('path');
const { ownerId } = require('../config/owner');

class BotBrain {
    constructor() {
        // Création du dossier data s'il n'existe pas
        const dataDir = path.join(__dirname, '../data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        this.learningPath = path.join(dataDir, 'learning.json');
        this.contextPath = path.join(dataDir, 'context.json');
        this.patternPath = path.join(dataDir, 'patterns.json');
        
        // Création des fichiers s'ils n'existent pas
        const defaultData = { patterns: {}, responses: {}, keywords: {} };
        
        if (!fs.existsSync(this.learningPath)) {
            fs.writeFileSync(this.learningPath, JSON.stringify(defaultData, null, 2));
        }
        if (!fs.existsSync(this.contextPath)) {
            fs.writeFileSync(this.contextPath, JSON.stringify({}, null, 2));
        }
        if (!fs.existsSync(this.patternPath)) {
            fs.writeFileSync(this.patternPath, JSON.stringify({}, null, 2));
        }
        
        // Initialisation des systèmes
        this.learning = this.loadData(this.learningPath);
        this.context = this.loadData(this.contextPath);
        this.patterns = this.loadData(this.patternPath);
        
        // Système d'auto-apprentissage
        this.spamPatterns = new Map();
        this.userBehavior = new Map();
        this.messagePatterns = new Map();

        // Système d'IA avancée
        this.decisionPatterns = new Map();
        this.actionHistory = new Map();
        this.serverContexts = new Map();
        this.adaptiveThresholds = {
            spam: 0.7,
            toxicity: 0.6,
            risk: 0.8
        };

        this.ownerId = require('../config/owner').ownerId;
    }

    loadData(filePath) {
        try {
            return fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath)) : {};
        } catch (error) {
            console.error(`Erreur lors du chargement des données: ${error}`);
            return {};
        }
    }

    saveData(data, filePath) {
        try {
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        } catch (error) {
            console.error(`Erreur lors de la sauvegarde des données: ${error}`);
        }
    }

    learn(message) {
        const content = message.content.toLowerCase();
        const guildId = message.guild.id;
        
        if (!this.learning[guildId]) {
            this.learning[guildId] = {
                patterns: {},
                responses: {},
                keywords: {}
            };
        }

        // Apprentissage des mots clés et patterns
        const words = content.split(/\s+/);
        words.forEach(word => {
            if (!this.learning[guildId].keywords[word]) {
                this.learning[guildId].keywords[word] = 0;
            }
            this.learning[guildId].keywords[word]++;
        });

        this.saveData(this.learning, this.learningPath);
    }

    analyzeContext(message) {
        const guildId = message.guild.id;
        if (!this.context[guildId]) {
            this.context[guildId] = {
                mood: 'neutral',
                lastInteraction: Date.now(),
                messageCount: 0,
                userInteractions: {}
            };
        }

        // Analyse du contexte
        const content = message.content.toLowerCase();
        const ctx = this.context[guildId];
        ctx.messageCount++;
        
        // Analyse de l'humeur basée sur les mots
        if (content.match(/merci|super|génial|cool/)) ctx.mood = 'happy';
        if (content.match(/bug|erreur|problème/)) ctx.mood = 'concerned';
        if (content.match(/aide|help|sos/)) ctx.mood = 'helpful';

        // Suivi des interactions utilisateur
        if (!ctx.userInteractions[message.author.id]) {
            ctx.userInteractions[message.author.id] = 0;
        }
        ctx.userInteractions[message.author.id]++;

        this.saveData(this.context, this.contextPath);
        return ctx;
    }

    generateResponse(message) {
        const ctx = this.analyzeContext(message);
        const content = message.content.toLowerCase();

        // Génération de réponse contextuelle
        let response = {
            content: null,
            mood: ctx.mood,
            confidence: 0
        };

        // Réponses basées sur l'humeur
        switch (ctx.mood) {
            case 'happy':
                response.content = "Je suis content que tout se passe bien ! 😊";
                break;
            case 'concerned':
                response.content = "Je peux peut-être vous aider avec ce problème ? 🤔";
                break;
            case 'helpful':
                response.content = "Je suis là pour vous aider ! Que puis-je faire ? 💪";
                break;
        }

        return response;
    }

    async autoModerate(message) {
        const serverConfig = require('./serverConfig').getConfig(message.guild.id);
        
        // Vérifier si l'automod est activé pour ce serveur
        if (!serverConfig.automod) return;

        // Bypass TOTAL pour l'owner
        if (message.author.id === this.ownerId) return;

        const context = {
            message,
            behavior: await this.analyzeUserBehavior(message),
            patterns: this.detectPatterns(message.content)
        };

        const decision = await this.makeDecision(context);

        if (decision.action === 'automod') {
            const actionTaken = await this.executeAutoModAction(message, decision);
            this.logDecision(decision, actionTaken);
            this.updateServerContext(message.guild.id, decision);
        }

        // Ajuster les seuils en fonction des résultats
        this.adaptThresholds(decision);
    }

    updateUserBehavior(userId, message) {
        if (!this.userBehavior.has(userId)) {
            this.userBehavior.set(userId, {
                messageCount: 0,
                warningCount: 0,
                patterns: [],
                lastMessages: []
            });
        }

        const behavior = this.userBehavior.get(userId);
        behavior.messageCount++;
        behavior.lastMessages.push({
            content: message.content,
            timestamp: Date.now()
        });

        // Garder seulement les 10 derniers messages
        if (behavior.lastMessages.length > 10) {
            behavior.lastMessages.shift();
        }
    }

    detectPatterns(content, messageObject = null) {
        // Bypass complet pour l'owner
        if (messageObject?.author?.id === this.ownerId) {
            return {
                spam: false,
                caps: false,
                links: 0,
                mentions: 0,
                repeatedChars: false,
                toxicity: 0
            };
        }

        const patterns = {
            spam: this.detectSpamPattern(content),
            caps: content.toUpperCase() === content && content.length > 10,
            links: (content.match(/https?:\/\/[^\s]+/g) || []).length,
            mentions: (content.match(/<@!?\d+>/g) || []).length,
            repeatedChars: this.detectRepeatedChars(content)
        };

        return patterns;
    }

    calculateRiskScore(message) {
        let score = 0;
        const patterns = this.detectPatterns(message.content);
        const behavior = this.userBehavior.get(message.author.id);

        // Facteurs de score
        if (patterns.spam) score += 30;
        if (patterns.caps) score += 10;
        if (patterns.links > 3) score += 20;
        if (patterns.mentions > 5) score += 25;
        if (patterns.repeatedChars) score += 15;
        if (behavior?.warningCount > 2) score += 25;

        return score;
    }

    async handleHighRisk(message) {
        try {
            await message.delete();
            const userId = message.author.id;
            const behavior = this.userBehavior.get(userId);
            behavior.warningCount++;

            if (behavior.warningCount >= 3) {
                // Mute automatique
                const member = message.member;
                if (member && member.moderatable) {
                    await member.timeout(300000, 'Auto-modération: Comportement à haut risque');
                }
            }

            // Log l'action
            this.logAutoMod({
                type: 'high_risk',
                userId: userId,
                messageContent: message.content,
                action: 'delete_and_timeout'
            });
        } catch (error) {
            console.error('Erreur dans handleHighRisk:', error);
        }
    }

    detectSpamPattern(content) {
        // Détection de spam basée sur la répétition et la vitesse
        const repeatedWords = content.split(' ').filter((word, index, array) => 
            array.indexOf(word) !== index
        ).length;

        return repeatedWords > 5;
    }

    detectRepeatedChars(content) {
        // Détection de caractères répétés (ex: "aaaaaa")
        return /(.)\1{4,}/.test(content);
    }

    learnPattern(content, riskScore) {
        // Apprentissage des nouveaux patterns
        const words = content.toLowerCase().split(/\s+/);
        
        words.forEach(word => {
            if (!this.patterns[word]) {
                this.patterns[word] = {
                    riskScore: 0,
                    occurrences: 0
                };
            }

            this.patterns[word].occurrences++;
            this.patterns[word].riskScore = (this.patterns[word].riskScore + riskScore) / 2;
        });

        // Sauvegarder les nouveaux patterns
        this.saveData(this.patterns, this.patternPath);
    }

    logAutoMod(data) {
        const logPath = path.join(__dirname, '../logs/automod.json');
        const logs = this.loadData(logPath);
        
        logs.push({
            ...data,
            timestamp: new Date().toISOString()
        });

        this.saveData(logs, logPath);
    }

    async analyzeUserBehavior(message) {
        const userId = message.author.id;
        const owners = require('../config/owners');
        
        // Protection basée sur le niveau d'owner
        const ownerLevel = owners.getOwnerLevel(userId);
        if (ownerLevel > 0) {
            return {
                messageCount: 0,
                warningCount: 0,
                patterns: [],
                toxicityScore: 0,
                lastMessages: [],
                recentInfractions: [],
                trustScore: 100,
                isOwner: true,
                ownerLevel: ownerLevel,
                immune: true,
                bypassAll: ownerLevel >= 2
            };
        }

        const behavior = this.userBehavior.get(userId) || {
            messageCount: 0,
            warningCount: 0,
            patterns: [],
            toxicityScore: 0,
            lastMessages: [],
            recentInfractions: [],
            trustScore: 100
        };

        // Analyse du message
        const messageScore = await this.analyzeToxicity(message.content);
        behavior.toxicityScore = (behavior.toxicityScore * 0.8) + (messageScore * 0.2);
        behavior.trustScore = Math.max(0, behavior.trustScore - (messageScore > 0.7 ? 10 : 0));

        // Détection de comportement suspect
        if (this.isSpamming(behavior.lastMessages)) {
            behavior.trustScore -= 5;
            behavior.recentInfractions.push({
                type: 'spam',
                timestamp: Date.now()
            });
        }

        // Système de réhabilitation
        if (behavior.trustScore < 50) {
            await this.handleLowTrustUser(message, behavior);
        }

        // Analyse comportementale avancée
        behavior.patterns = this.detectUserPatterns(behavior.lastMessages);
        behavior.toxicityTrend = this.calculateToxicityTrend(behavior.lastMessages);
        behavior.interactionQuality = await this.evaluateInteractionQuality(message);
        
        // Système de réhabilitation amélioré
        behavior.trustScore = this.calculateTrustScore(behavior);
        behavior.rehabilitationProgress = this.evaluateRehabilitation(behavior);

        this.userBehavior.set(userId, behavior);
        return behavior;
    }

    async analyzeToxicity(content) {
        // Analyse de toxicité basée sur les patterns appris
        let toxicityScore = 0;
        const words = content.toLowerCase().split(/\s+/);
        
        words.forEach(word => {
            if (this.patterns[word]) {
                toxicityScore += this.patterns[word].riskScore / this.patterns[word].occurrences;
            }
        });

        return Math.min(1, toxicityScore);
    }

    async handleLowTrustUser(message, behavior) {
        const actions = {
            warning: behavior.trustScore < 50,
            timeout: behavior.trustScore < 30,
            ban: behavior.trustScore < 10
        };

        if (actions.ban) {
            await this.recommendBan(message);
        } else if (actions.timeout) {
            await this.autoTimeout(message);
        } else if (actions.warning) {
            await this.sendWarning(message);
        }
    }

    async autoTimeout(message) {
        const member = message.member;
        if (!member || !member.moderatable) return;

        const timeouts = {
            first: 5 * 60 * 1000,    // 5 minutes
            second: 15 * 60 * 1000,  // 15 minutes
            third: 60 * 60 * 1000,   // 1 heure
            fourth: 24 * 60 * 60 * 1000 // 24 heures
        };

        const behavior = this.userBehavior.get(member.id);
        const duration = timeouts[Object.keys(timeouts)[Math.min(behavior.warningCount, 3)]] || timeouts.fourth;

        await member.timeout(duration, 'Comportement inapproprié détecté par l\'auto-modération');
        
        const embed = {
            color: 0xFF0000,
            title: '🤖 Auto-Modération',
            description: `${member.user.tag} a été automatiquement mute pour comportement inapproprié.`,
            fields: [
                { name: 'Durée', value: `${duration / 60000} minutes`, inline: true },
                { name: 'Trust Score', value: `${behavior.trustScore}/100`, inline: true }
            ],
            timestamp: new Date()
        };

        await message.channel.send({ embeds: [embed] });
    }

    async recommendBan(message) {
        const behavior = this.userBehavior.get(message.author.id);
        const embed = {
            color: 0xFF0000,
            title: '⚠️ Recommandation de bannissement',
            description: `L'utilisateur ${message.author.tag} présente un comportement très toxique.`,
            fields: [
                { name: 'Trust Score', value: `${behavior.trustScore}/100`, inline: true },
                { name: 'Infractions', value: `${behavior.recentInfractions.length}`, inline: true },
                { name: 'Comportement', value: this.generateBehaviorReport(behavior) }
            ],
            timestamp: new Date()
        };

        // Trouver un canal de logs de modération
        const modChannel = message.guild.channels.cache.find(c => 
            c.name.includes('mod-logs') || c.name.includes('moderation')
        );

        if (modChannel) {
            await modChannel.send({ embeds: [embed] });
        }
    }

    generateBehaviorReport(behavior) {
        const warnings = behavior.recentInfractions
            .slice(-5)
            .map(inf => `- ${inf.type} (${new Date(inf.timestamp).toLocaleString()})`)
            .join('\n');

        return `Dernières infractions:\n${warnings || "Aucune infraction récente"}`;
    }

    isSpamming(messages) {
        if (messages.length < 3) return false;

        const recentMessages = messages.filter(msg => 
            Date.now() - msg.timestamp < 5000 // Messages des 5 dernières secondes
        );

        if (recentMessages.length >= 5) return true; // Plus de 5 messages en 5 secondes

        // Vérifier les messages similaires
        const content = messages.map(m => m.content);
        const uniqueMessages = new Set(content);
        return uniqueMessages.size < content.length * 0.5; // Plus de 50% de messages similaires
    }

    async analyzeMessage(message) {
        const serverConfig = require('./serverConfig').getConfig(message.guild.id);
        const content = message.content.toLowerCase();
        const result = {
            shouldAct: false,
            toxicity: 0,
            spamScore: 0,
            patterns: [],
            action: null
        };

        // Analyse du contenu
        const toxicityScore = await this.analyzeToxicity(content);
        const patterns = this.detectPatterns(content, message.author);  // Passage de l'auteur
        const behavior = this.userBehavior.get(message.author.id);

        result.toxicity = toxicityScore;
        result.patterns = patterns;
        result.spamScore = this.isSpamming(behavior?.lastMessages || []) ? 1 : 0;

        // Déterminer si une action est nécessaire
        if (toxicityScore > 0.7 || result.spamScore > 0.8 || patterns.spam) {
            result.shouldAct = true;
            result.action = this.determineAction(toxicityScore, result.spamScore, patterns);
        }
        
        // Utiliser les paramètres spécifiques au serveur
        if (serverConfig.automod) {
            // Appliquer les règles spécifiques au serveur
            if (patterns.mentions > serverConfig.maxMentions) {
                result.shouldAct = true;
            }
        }

        return result;
    }

    determineAction(toxicity, spamScore, patterns) {
        if (toxicity > 0.9 || spamScore > 0.9) {
            return 'timeout';
        } else if (patterns.spam || patterns.repeatedChars) {
            return 'delete';
        } else if (toxicity > 0.7 || spamScore > 0.7) {
            return 'warn';
        }
        return 'monitor';
    }

    async handleViolation(message, analysis) {
        // Double vérification pour le owner
        if (message.author.id === ownerId) return;

        switch (analysis.action) {
            case 'timeout':
                await this.handleHighRisk(message);
                break;
            case 'delete':
                await message.delete().catch(console.error);
                await this.sendWarning(message);
                break;
            case 'warn':
                await this.sendWarning(message);
                break;
            case 'monitor':
                this.logAutoMod({
                    type: 'monitor',
                    userId: message.author.id,
                    messageContent: message.content,
                    analysis: analysis
                });
                break;
        }
    }

    async sendWarning(message) {
        const warningEmbed = {
            color: 0xFFAA00,
            title: '⚠️ Avertissement',
            description: 'Votre comportement a été détecté comme potentiellement inapproprié.',
            footer: {
                text: 'Auto-modération',
                icon_url: message.client.user.displayAvatarURL()
            },
            timestamp: new Date()
        };

        try {
            const warningMsg = await message.channel.send({ embeds: [warningEmbed] });
            setTimeout(() => warningMsg.delete().catch(console.error), 5000);
        } catch (error) {
            console.error('Erreur lors de l\'envoi de l\'avertissement:', error);
        }
    }

    async makeDecision(context) {
        const { message, behavior, patterns } = context;
        const serverContext = this.getServerContext(message.guild.id);
        
        // Analyse du contexte global du serveur
        const serverState = {
            activityLevel: serverContext.messageRate,
            recentIncidents: serverContext.incidents.length,
            timeOfDay: new Date().getHours(),
            userTrustScore: behavior.trustScore
        };

        // Calcul des facteurs de risque
        const riskFactors = {
            messageContent: await this.analyzeToxicity(message.content),
            userHistory: this.calculateUserRisk(behavior),
            serverContext: this.evaluateServerRisk(serverState),
            patternMatch: this.detectRiskPatterns(patterns)
        };

        // Prise de décision autonome
        const decision = this.evaluateRisksAndDecide(riskFactors);
        
        // Apprentissage de la décision
        this.learnFromDecision(decision, context);

        return decision;
    }

    evaluateRisksAndDecide(riskFactors) {
        const totalRisk = Object.values(riskFactors).reduce((a, b) => a + b, 0) / 4;
        
        if (totalRisk > this.adaptiveThresholds.risk) {
            return {
                action: 'automod',
                type: totalRisk > 0.9 ? 'ban' : totalRisk > 0.8 ? 'mute' : 'warn',
                reason: 'Comportement à risque détecté automatiquement',
                confidence: totalRisk
            };
        }

        return {
            action: 'monitor',
            type: 'passive',
            confidence: 1 - totalRisk
        };
    }

    getServerContext(guildId) {
        if (!this.serverContexts.has(guildId)) {
            this.serverContexts.set(guildId, {
                messageRate: 0,
                incidents: [],
                lastUpdate: Date.now(),
                adaptiveRules: {
                    spamThreshold: 5,
                    toxicityThreshold: 0.6,
                    warningThreshold: 3
                }
            });
        }

        return this.serverContexts.get(guildId);
    }

    executeAutoModAction(message, decision) {
        switch (decision.type) {
            case 'warn':
                return this.handleWarning(message, decision.reason);
            case 'mute':
                return this.handleMute(message, decision.reason);
            case 'ban':
                return this.handleBan(message, decision.reason);
        }
    }

    adaptThresholds(decision) {
        // Ajuster les seuils en fonction du succès des décisions
        Object.keys(this.adaptiveThresholds).forEach(key => {
            const currentThreshold = this.adaptiveThresholds[key];
            const adjustment = decision.success ? 0.01 : -0.01;
            this.adaptiveThresholds[key] = Math.max(0.3, Math.min(0.9, currentThreshold + adjustment));
        });
    }

    calculateUserRisk(behavior) {
        if (!behavior) return 0;

        let risk = 0;
        
        // Facteurs de risque basés sur le comportement
        if (behavior.toxicityScore > 0.5) risk += 0.3;
        if (behavior.trustScore < 50) risk += 0.3;
        if (behavior.recentInfractions.length > 2) risk += 0.2;
        if (behavior.warningCount > 3) risk += 0.2;

        // Analyse des messages récents
        const recentMessageCount = behavior.lastMessages.filter(
            msg => Date.now() - msg.timestamp < 300000 // 5 dernières minutes
        ).length;
        if (recentMessageCount > 15) risk += 0.2;

        return Math.min(1, risk);
    }

    evaluateServerRisk(serverState) {
        // Bypass pour les actions de l'owner
        if (serverState?.lastActionBy === this.ownerId) return 0;

        // Protection contre les valeurs undefined
        if (!serverState) {
            return 0;
        }

        let risk = 0;

        // Analyse avancée du serveur
        const timeFactors = {
            night: { start: 0, end: 5, risk: 0.3 },
            peak: { start: 20, end: 23, risk: 0.25 },
            normal: { start: 6, end: 19, risk: 0.1 }
        };

        const hour = serverState.timeOfDay || new Date().getHours();
        const currentTimeFactor = Object.entries(timeFactors).find(([_, period]) => 
            hour >= period.start && hour <= period.end
        )?.[1]?.risk || 0.1;

        risk += currentTimeFactor;

        // Sécurisation des valeurs undefined
        const messageRate = serverState.messageRate || 0;
        const averageRate = serverState.averageRate || 1;
        const recentIncidents = serverState.incidents?.length || 0;
        const uniqueUsers = serverState.uniqueUsers || 0;

        if (messageRate > averageRate * 2) risk += 0.4; // Pics d'activité
        if (recentIncidents > 3) risk += 0.3; // Incidents récents
        if (uniqueUsers < 5) risk += 0.2; // Faible diversité d'utilisateurs

        // Analyse des tendances
        if (this.detectRaidPattern(serverState)) risk += 0.5;
        if (this.detectSpamWave(serverState)) risk += 0.4;

        return Math.min(1, risk);
    }

    detectRaidPattern(serverState) {
        // Protection contre les valeurs undefined
        if (!serverState || !serverState.recentJoins || !serverState.recentMessages) {
            return false;
        }

        // Vérification que recentJoins et recentMessages sont des tableaux
        const recentJoins = Array.isArray(serverState.recentJoins) ? serverState.recentJoins : [];
        const recentMessages = Array.isArray(serverState.recentMessages) ? serverState.recentMessages : [];

        const newMembers = recentJoins.filter(join => 
            join && join.timestamp && (Date.now() - join.timestamp < 300000)
        ).length;

        const suspiciousMessages = recentMessages.filter(msg =>
            msg && this.isSuspiciousMessage(msg)
        ).length;

        return (newMembers > 5 && suspiciousMessages > 10);
    }

    detectRiskPatterns(patterns) {
        let risk = 0;

        // Évaluation des patterns à risque
        if (patterns.spam) risk += 0.4;
        if (patterns.caps) risk += 0.1;
        if (patterns.links > 2) risk += 0.2;
        if (patterns.mentions > 3) risk += 0.2;
        if (patterns.repeatedChars) risk += 0.1;

        return Math.min(1, risk);
    }

    learnFromDecision(decision, context) {
        const guildId = context.message.guild.id;
        const serverContext = this.getServerContext(guildId);

        // Mise à jour des statistiques du serveur
        serverContext.messageRate = this.calculateNewRate(
            serverContext.messageRate,
            context.message.createdTimestamp
        );

        // Enregistrement des incidents si nécessaire
        if (decision.action === 'automod') {
            serverContext.incidents.push({
                type: decision.type,
                timestamp: Date.now(),
                confidence: decision.confidence
            });

            // Garder seulement les 50 derniers incidents
            if (serverContext.incidents.length > 50) {
                serverContext.incidents = serverContext.incidents.slice(-50);
            }
        }

        // Mise à jour des règles adaptatives
        this.updateAdaptiveRules(serverContext, decision);
    }

    calculateNewRate(currentRate, timestamp) {
        const decay = 0.95; // Facteur de décroissance
        const timeDiff = (Date.now() - timestamp) / 1000; // Différence en secondes
        return (currentRate * decay) + (1 / Math.max(1, timeDiff));
    }

    updateAdaptiveRules(serverContext, decision) {
        const rules = serverContext.adaptiveRules;
        const adjustment = 0.05;

        if (decision.success) {
            // Renforcer les règles qui ont bien fonctionné
            rules.spamThreshold *= (1 - adjustment);
            rules.toxicityThreshold *= (1 - adjustment);
        } else {
            // Assouplir les règles qui ont généré des faux positifs
            rules.spamThreshold *= (1 + adjustment);
            rules.toxicityThreshold *= (1 + adjustment);
        }

        // Garder les seuils dans des limites raisonnables
        rules.spamThreshold = Math.max(3, Math.min(10, rules.spamThreshold));
        rules.toxicityThreshold = Math.max(0.3, Math.min(0.9, rules.toxicityThreshold));
    }

    calculateTrustScore(behavior) {
        const baseScore = 100;
        const penalties = {
            spam: -15,
            toxicity: -20,
            warnings: -10,
            violations: -25
        };

        let score = baseScore;
        
        // Pénalités progressives
        score += penalties.spam * (behavior.spamCount || 0);
        score += penalties.toxicity * (behavior.toxicityScore || 0);
        score += penalties.warnings * (behavior.warningCount || 0);
        score += penalties.violations * (behavior.recentInfractions.length || 0);

        // Bonus de bon comportement
        const goodBehaviorTime = (Date.now() - behavior.lastInfraction) / (24 * 60 * 60 * 1000);
        if (goodBehaviorTime > 7) { // Plus de 7 jours de bon comportement
            score += Math.min(50, goodBehaviorTime);
        }

        return Math.max(0, Math.min(100, score));
    }

    detectUserPatterns(messages) {
        if (!Array.isArray(messages)) {
            return {
                messageFrequency: 0,
                reactionPatterns: { positive: 0, negative: 0, total: 0 },
                messageTypes: { text: 0, media: 0, embeds: 0, commands: 0 },
                interactionStyle: { mentions: 0, emoji: 0, caps: 0, links: 0 },
                contentQuality: 0
            };
        }

        return {
            messageFrequency: this.calculateMessageFrequency(messages),
            reactionPatterns: this.analyzeReactions(messages),
            messageTypes: this.categorizeMessages(messages),
            interactionStyle: this.analyzeInteractionStyle(messages),
            contentQuality: this.evaluateContentQuality(messages[messages.length - 1]?.content || '')
        };
    }

    calculateToxicityTrend(messages) {
        const recentMessages = messages.slice(-10);
        const toxicityScores = recentMessages.map(msg => msg.toxicityScore || 0);
        
        return {
            current: toxicityScores[toxicityScores.length - 1] || 0,
            average: toxicityScores.reduce((a, b) => a + b, 0) / toxicityScores.length,
            trend: this.calculateTrend(toxicityScores)
        };
    }

    calculateTrend(values) {
        if (values.length < 2) return 'stable';
        const diff = values[values.length - 1] - values[0];
        if (diff > 0.2) return 'increasing';
        if (diff < -0.2) return 'decreasing';
        return 'stable';
    }

    async evaluateInteractionQuality(message) {
        if (!message || !message.content) return { score: 0, factors: {} };

        const qualityFactors = {
            formatting: this.evaluateFormatting(message.content),
            relevance: 0.5, // Valeur par défaut car l'évaluation de pertinence nécessite plus de contexte
            engagement: this.calculateEngagementScore(message) || 0,
            helpfulness: this.evaluateHelpfulness(message.content) || 0
        };

        return {
            score: Object.values(qualityFactors).reduce((a, b) => a + b, 0) / Object.keys(qualityFactors).length,
            factors: qualityFactors
        };
    }

    evaluateFormatting(content) {
        if (!content || typeof content !== 'string') return 0;

        const checks = {
            properPunctuation: /[.!?]$/.test(content),
            properCapitalization: /^[A-Z]/.test(content),
            noExcessivePunctuation: !/[!?]{3,}/.test(content),
            noExcessiveCaps: (content.match(/[A-Z]/g) || []).length / content.length < 0.7,
            noRepeatedChars: !/(.)\1{4,}/.test(content),
            reasonableLength: content.length >= 2 && content.length <= 2000,
            hasWords: /\w+/.test(content)
        };

        const validChecks = Object.values(checks).filter(Boolean).length;
        return validChecks / Object.keys(checks).length;
    }

    calculateEngagementScore(message) {
        if (!message) return 0;
        
        const factors = {
            hasContent: message.content.length > 0,
            hasAttachments: message.attachments.size > 0,
            hasMentions: message.mentions.users.size > 0,
            isReply: !!message.reference
        };

        return Object.values(factors).filter(Boolean).length / Object.keys(factors).length;
    }

    evaluateHelpfulness(content) {
        if (!content || typeof content !== 'string') return 0;

        const helpfulPatterns = {
            explanation: /parce que|car|donc|ainsi|en effet/i,
            suggestion: /tu peux|vous pouvez|essayez de|je suggère/i,
            guidance: /voici|regardez|suivez|étape/i,
            politeness: /s'il (te|vous) plaît|merci|svp/i
        };

        const matches = Object.values(helpfulPatterns).filter(pattern => pattern.test(content));
        return matches.length / Object.keys(helpfulPatterns).length;
    }

    evaluateRehabilitation(behavior) {
        const positiveFactors = {
            goodBehaviorStreak: this.calculateGoodBehaviorStreak(behavior),
            positiveInteractions: this.countPositiveInteractions(behavior),
            warningReduction: this.evaluateWarningTrend(behavior),
            trustScoreImprovement: this.calculateTrustScoreImprovement(behavior)
        };

        return {
            progress: Object.values(positiveFactors).reduce((a, b) => a + b, 0) / 4,
            nextMilestone: this.calculateNextMilestone(behavior),
            recommendations: this.generateRehabilitationRecommendations(behavior)
        };
    }

    countPositiveInteractions(behavior) {
        if (!behavior || !behavior.lastMessages) return 0;

        const positiveIndicators = behavior.lastMessages.filter(msg => {
            // Messages sans violation
            const noViolations = !msg.toxicityScore || msg.toxicityScore < 0.3;
            
            // Messages avec des réactions positives
            const hasPositiveReactions = msg.reactions?.cache.some(r => 
                ['👍', '❤️', '✅', '🎉'].includes(r.emoji.name)
            );

            // Messages d'aide ou de contribution positive
            const isHelpful = this.evaluateHelpfulness(msg.content) > 0.7;

            return noViolations || hasPositiveReactions || isHelpful;
        }).length;

        return Math.min(1, positiveIndicators / Math.max(1, behavior.lastMessages.length));
    }

    evaluateWarningTrend(behavior) {
        if (!behavior || !behavior.recentInfractions) return 1;
        
        const now = Date.now();
        const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);
        
        const recentWarnings = behavior.recentInfractions.filter(inf => 
            inf.timestamp > oneWeekAgo
        ).length;

        const previousWarnings = behavior.recentInfractions.filter(inf =>
            inf.timestamp <= oneWeekAgo
        ).length;

        // Si pas d'avertissements récents, c'est positif
        if (recentWarnings === 0) return 1;
        
        // Si moins d'avertissements récents que précédents, c'est une amélioration
        return Math.max(0, 1 - (recentWarnings / Math.max(1, previousWarnings)));
    }

    calculateTrustScoreImprovement(behavior) {
        if (!behavior || !behavior.trustScoreHistory) return 0;
        
        const recentScores = behavior.trustScoreHistory.slice(-5);
        if (recentScores.length < 2) return 0;

        const improvement = recentScores[recentScores.length - 1] - recentScores[0];
        return Math.max(0, Math.min(1, improvement / 50)); // Normalisé sur une amélioration de 50 points
    }

    calculateNextMilestone(behavior) {
        const trustScore = behavior.trustScore || 0;
        const milestones = [
            { score: 30, label: 'Réduction des restrictions' },
            { score: 50, label: 'Accès aux canaux généraux' },
            { score: 70, label: 'Privilèges standards' },
            { score: 90, label: 'Statut de membre de confiance' }
        ];

        return milestones.find(m => m.score > trustScore) || { score: 100, label: 'Score maximal atteint' };
    }

    generateRehabilitationRecommendations(behavior) {
        const recommendations = [];

        if (behavior.toxicityScore > 0.3) {
            recommendations.push('Améliorer la qualité des interactions');
        }
        if (behavior.warningCount > 0) {
            recommendations.push('Éviter les comportements ayant mené aux avertissements');
        }
        if (behavior.spamScore > 0.2) {
            recommendations.push('Réduire la fréquence des messages');
        }

        return recommendations;
    }

    detectSpamWave(serverState) {
        const messageRateThreshold = serverState.averageRate * 3;
        const recentMessages = serverState.recentMessages || [];
        const last5Minutes = recentMessages.filter(msg => 
            Date.now() - msg.timestamp < 300000
        );

        return {
            isSpamWave: last5Minutes.length > messageRateThreshold,
            intensity: last5Minutes.length / messageRateThreshold,
            participants: new Set(last5Minutes.map(msg => msg.authorId)).size
        };
    }

    calculateGoodBehaviorStreak(behavior) {
        const lastInfractionTime = behavior.recentInfractions[behavior.recentInfractions.length - 1]?.timestamp || 0;
        const streakDays = (Date.now() - lastInfractionTime) / (24 * 60 * 60 * 1000);
        return Math.min(1, streakDays / 30); // Normalisé sur 30 jours
    }

    calculateMessageFrequency(messages) {
        const intervals = [];
        for (let i = 1; i < messages.length; i++) {
            intervals.push(messages[i].timestamp - messages[i-1].timestamp);
        }
        
        return {
            averageInterval: intervals.length ? intervals.reduce((a,b) => a + b, 0) / intervals.length : 0,
            burstCount: intervals.filter(i => i < 1000).length, // Messages envoyés à moins d'1 seconde d'intervalle
            normalizedRate: Math.min(1, intervals.length / 100)
        };
    }

    analyzeReactions(messages) {
        return {
            positive: messages.filter(m => m.reactions?.cache.some(r => ['👍', '❤️', '✅'].includes(r.emoji.name))).length,
            negative: messages.filter(m => m.reactions?.cache.some(r => ['👎', '❌', '🚫'].includes(r.emoji.name))).length,
            total: messages.reduce((acc, m) => acc + (m.reactions?.cache.size || 0), 0)
        };
    }

    categorizeMessages(messages) {
        return {
            text: messages.filter(m => !m.attachments.size && !m.embeds.length).length,
            media: messages.filter(m => m.attachments.size > 0).length,
            embeds: messages.filter(m => m.embeds.length > 0).length,
            commands: messages.filter(m => m.content.startsWith('+')).length
        };
    }

    analyzeInteractionStyle(messages) {
        const style = {
            mentions: messages.reduce((acc, m) => acc + (m.mentions.users.size || 0), 0),
            emoji: messages.filter(m => /[\u{1F300}-\u{1F9FF}]/u.test(m.content)).length,
            caps: messages.filter(m => m.content === m.content.toUpperCase()).length,
            links: messages.filter(m => /https?:\/\/[^\s]+/.test(m.content)).length
        };

        return {
            ...style,
            spamLikelihood: this.calculateSpamLikelihood(style, messages.length)
        };
    }

    calculateSpamLikelihood(style, totalMessages) {
        if (totalMessages === 0) return 0;
        
        const spamIndicators = [
            style.mentions / totalMessages > 0.5,
            style.caps / totalMessages > 0.3,
            style.links / totalMessages > 0.4
        ];

        return spamIndicators.filter(Boolean).length / spamIndicators.length;
    }

    evaluateContentQuality(content) {
        if (!content || typeof content !== 'string') {
            return {
                length: 0,
                variety: 0,
                formatting: 0,
                relevance: 0
            };
        }

        const quality = {
            length: Math.min(1, content.length / 500),
            variety: this.calculateTextVariety(content),
            formatting: this.checkFormatting(content),
            relevance: 0.5 // Valeur par défaut
        };

        return Object.values(quality).reduce((a, b) => a + b, 0) / 4;
    }

    calculateTextVariety(content) {
        if (!content) return 0;
        const words = content.split(/\s+/);
        if (words.length === 0) return 0;
        const uniqueWords = new Set(words);
        return uniqueWords.size / words.length;
    }

    checkFormatting(content) {
        const checks = {
            properPunctuation: /[.!?]$/.test(content),
            properCapitalization: /^[A-Z]/.test(content),
            noExcessiveRepetition: !/(.)\1{4,}/.test(content),
            reasonableLength: content.length > 2 && content.length < 2000
        };

        return Object.values(checks).filter(Boolean).length / Object.keys(checks).length;
    }

    checkRelevance(message) {
        const channel = message.channel;
        const relevanceScore = {
            matchesChannelTopic: channel.topic ? 
                this.calculateSimilarity(message.content, channel.topic) : 0.5,
            followsConversation: this.checkConversationFlow(message),
            appropriateContent: this.checkContentAppropriateness(message)
        };

        return Object.values(relevanceScore).reduce((a, b) => a + b, 0) / 3;
    }

    calculateSimilarity(text1, text2) {
        const words1 = new Set(text1.toLowerCase().split(/\s+/));
        const words2 = new Set(text2.toLowerCase().split(/\s+/));
        const intersection = new Set([...words1].filter(x => words2.has(x)));
        const union = new Set([...words1, ...words2]);
        
        return intersection.size / union.size;
    }
}

module.exports = BotBrain;
