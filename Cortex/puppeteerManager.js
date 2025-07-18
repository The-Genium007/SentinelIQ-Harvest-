/**
 * 🖥️ Gestionnaire Puppeteer multi-plateforme
 * Optimisé pour Debian et macOS avec détection automatique
 */

import puppeteer from 'puppeteer';
import { logger } from '../utils/logger.js';
import { detectPlatform, getPuppeteerConfig, getPerformanceConfig } from './config.js';

class PuppeteerManager {
    constructor() {
        this.browsers = new Map();
        this.platformConfig = null;
        this.puppeteerConfig = null;
        this.performanceConfig = null;
        this.isInitialized = false;
    }

    /**
     * 🚀 Initialisation avec détection de plateforme
     */
    async initialize() {
        if (this.isInitialized) {
            return this.platformConfig;
        }

        try {
            logger.info('🔍 Détection de la plateforme pour Puppeteer', 'PuppeteerManager');

            // Détection de la plateforme
            this.platformConfig = await detectPlatform();
            this.puppeteerConfig = getPuppeteerConfig(this.platformConfig);
            this.performanceConfig = getPerformanceConfig(this.platformConfig);

            // Affichage des informations de plateforme
            const platform = this.platformConfig.IS_MACOS ? 'macOS' :
                this.platformConfig.IS_DEBIAN ? 'Debian/Linux' : 'Autre Linux';

            logger.info(`🖥️ Plateforme détectée: ${platform}`, 'PuppeteerManager');
            logger.info(`🎯 Pool de navigateurs: ${this.performanceConfig.BROWSER_POOL_SIZE}`, 'PuppeteerManager');
            logger.info(`⚡ Pages concurrentes max: ${this.performanceConfig.MAX_CONCURRENT_PAGES}`, 'PuppeteerManager');

            // Test de compatibilité Puppeteer
            const testResult = await this.testPuppeteerCompatibility();
            if (!testResult) {
                logger.warning('⚠️ Test Puppeteer échoué, mais initialisation continuée', 'PuppeteerManager');
            }

            this.isInitialized = true;
            logger.success('✅ PuppeteerManager initialisé avec succès', 'PuppeteerManager');

            return this.platformConfig;

        } catch (error) {
            logger.error(`❌ Erreur initialisation PuppeteerManager: ${error.message}`, 'PuppeteerManager');
            
            // En cas d'erreur critique, on continue quand même pour les conteneurs
            if (process.env.NODE_ENV === 'production') {
                logger.warning('⚠️ Initialisation PuppeteerManager en mode dégradé (production)', 'PuppeteerManager');
                this.isInitialized = true;
                return this.platformConfig;
            }
            throw error;
        }
    }

    /**
     * 🧪 Test de compatibilité Puppeteer
     */
    async testPuppeteerCompatibility() {
        logger.info('🧪 Test de compatibilité Puppeteer', 'PuppeteerManager');

        // En environnement conteneur, on fait un test plus simple mais on continue
        if (process.env.NODE_ENV === 'production' || process.env.DOCKER_ENV || process.env.PUPPETEER_DISABLE_SECURITY) {
            logger.info('⚡ Environnement conteneur détecté - Test Puppeteer simplifié', 'PuppeteerManager');
            
            // Test simplifié pour conteneur
            try {
                const testConfig = {
                    headless: 'new',
                    args: ['--no-sandbox', '--disable-setuid-sandbox', '--single-process'],
                    executablePath: this.puppeteerConfig.executablePath
                };
                
                const browser = await puppeteer.launch(testConfig);
                await browser.close();
                logger.info('✅ Test Puppeteer conteneur réussi', 'PuppeteerManager');
                return true;
            } catch (error) {
                logger.warning(`⚠️ Test conteneur échoué mais on continue: ${error.message}`, 'PuppeteerManager');
                return true; // On continue même si le test échoue en conteneur
            }
        }

        try {
            // Configuration ultra-basique pour le test
            const testConfig = {
                headless: 'new',
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--single-process'
                ],
                executablePath: this.puppeteerConfig.executablePath
            };

            // Test minimal
            const browser = await puppeteer.launch(testConfig);
            const page = await browser.newPage();

            // Test ultra-simple sans navigation
            await page.setContent('<h1>Test OK</h1>');
            const content = await page.content();
            
            await page.close();
            await browser.close();

            const success = content.includes('Test OK');
            logger.info(`✅ Test Puppeteer ${success ? 'réussi' : 'échoué'}`, 'PuppeteerManager');
            return success;

        } catch (error) {
            logger.error(`❌ Test de compatibilité échoué: ${error.message}`, 'PuppeteerManager');

            // Suggestions de résolution selon la plateforme
            if (this.platformConfig.IS_DEBIAN) {
                logger.warning('💡 Pour Debian/Ubuntu, installez: sudo apt-get install chromium-browser', 'PuppeteerManager');
                logger.warning('💡 Ou: sudo apt-get install google-chrome-stable', 'PuppeteerManager');
            } else if (this.platformConfig.IS_MACOS) {
                logger.warning('💡 Pour macOS, installez: brew install chromium', 'PuppeteerManager');
                logger.warning('💡 Ou téléchargez Chrome depuis https://www.google.com/chrome/', 'PuppeteerManager');
            }

            return false;
        }
    }

    /**
     * Vérifie si Puppeteer est compatible avec l'environnement conteneur
     */
    isContainerCompatible() {
        // Si Puppeteer est explicitement activé en conteneur, retourner true
        if (process.env.DOCKER_ENV && process.env.CORTEX_MODE === 'container') {
            return true;
        }
        
        // Si on n'est pas en conteneur, toujours compatible
        if (!process.env.DOCKER_ENV) {
            return true;
        }
        
        // En conteneur sans configuration spécifique, essayer quand même
        return true;
    }

    /**
     * 🌐 Création d'un navigateur optimisé
     */
    async createBrowser() {
        if (!this.isInitialized) {
            await this.initialize();
        }

        try {
            logger.debug('🌐 Création d\'un nouveau navigateur Puppeteer', 'PuppeteerManager');

            // Configuration spéciale pour conteneur avec plus de tolérance
            let launchConfig = { ...this.puppeteerConfig };
            
            if (process.env.NODE_ENV === 'production' || process.env.DOCKER_ENV) {
                logger.info('🐳 Mode conteneur - Configuration Puppeteer optimisée', 'PuppeteerManager');
                
                // Configuration ultra-conservatrice pour conteneur
                launchConfig = {
                    ...launchConfig,
                    timeout: 60000, // 60s pour démarrer (au lieu de 30s)
                    protocolTimeout: 60000, // 60s pour les protocoles (au lieu de 30s)
                    pipe: true, // Utiliser pipe au lieu de websocket
                    dumpio: false, // Pas de debug output
                };
            }

            const browser = await puppeteer.launch(launchConfig);

            // Configuration des événements de monitoring
            browser.on('disconnected', () => {
                logger.warning('🔌 Navigateur déconnecté', 'PuppeteerManager');
            });

            browser.on('targetcreated', () => {
                logger.debug('🎯 Nouvelle cible créée', 'PuppeteerManager');
            });

            return browser;

        } catch (error) {
            logger.error(`❌ Erreur création navigateur: ${error.message}`, 'PuppeteerManager');

            // Tentative avec configuration fallback
            if (this.platformConfig.IS_DEBIAN) {
                logger.info('🔄 Tentative avec configuration fallback pour Debian', 'PuppeteerManager');
                return await this.createBrowserFallback();
            }

            throw error;
        }
    }

    /**
     * 🆘 Configuration fallback pour Debian
     */
    async createBrowserFallback() {
        const fallbackConfig = {
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--single-process',
                '--disable-gpu'
            ]
        };

        try {
            logger.info('🆘 Utilisation de la configuration fallback', 'PuppeteerManager');
            return await puppeteer.launch(fallbackConfig);
        } catch (error) {
            logger.error(`❌ Configuration fallback échouée: ${error.message}`, 'PuppeteerManager');
            throw new Error('Impossible de lancer Puppeteer sur cette plateforme');
        }
    }

    /**
     * 🏊‍♂️ Gestion du pool de navigateurs
     */
    async getBrowserFromPool(poolId = 'default') {
        if (!this.browsers.has(poolId)) {
            const browser = await this.createBrowser();
            this.browsers.set(poolId, {
                browser,
                pages: new Set(),
                lastUsed: Date.now()
            });

            logger.debug(`🏊‍♂️ Nouveau navigateur ajouté au pool: ${poolId}`, 'PuppeteerManager');
        }

        const browserInfo = this.browsers.get(poolId);
        browserInfo.lastUsed = Date.now();

        return browserInfo.browser;
    }

    /**
     * 📄 Création d'une page optimisée
     */
    async createOptimizedPage(browser) {
        const page = await browser.newPage();

        // Configuration de base
        await page.setViewport(this.puppeteerConfig.defaultViewport);
        await page.setUserAgent(this.puppeteerConfig.userAgent || 'SentinelIQ-Cortex/2.0');

        // Optimisations réseau selon la plateforme
        if (this.platformConfig.IS_DEBIAN) {
            // Optimisations plus agressives pour Debian
            await page.setRequestInterception(true);

            page.on('request', (request) => {
                const resourceType = request.resourceType();
                if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
                    request.abort();
                } else {
                    request.continue();
                }
            });
        }

        // Timeout adapté à la plateforme
        page.setDefaultTimeout(this.performanceConfig.TIMEOUT || 30000);
        page.setDefaultNavigationTimeout(this.performanceConfig.TIMEOUT || 30000);

        return page;
    }

    /**
     * 🧹 Nettoyage des ressources
     */
    async cleanup() {
        logger.info('🧹 Nettoyage des navigateurs Puppeteer', 'PuppeteerManager');

        for (const [poolId, browserInfo] of this.browsers.entries()) {
            try {
                await browserInfo.browser.close();
                logger.debug(`🗑️ Navigateur fermé: ${poolId}`, 'PuppeteerManager');
            } catch (error) {
                logger.error(`❌ Erreur fermeture navigateur ${poolId}: ${error.message}`, 'PuppeteerManager');
            }
        }

        this.browsers.clear();
        logger.success('✅ Nettoyage Puppeteer terminé', 'PuppeteerManager');
    }

    /**
     * 📊 Statistiques du gestionnaire
     */
    getStats() {
        return {
            platform: this.platformConfig?.IS_MACOS ? 'macOS' :
                this.platformConfig?.IS_DEBIAN ? 'Debian' : 'Linux',
            browsersActive: this.browsers.size,
            isInitialized: this.isInitialized,
            config: {
                browserPoolSize: this.performanceConfig?.BROWSER_POOL_SIZE,
                maxConcurrentPages: this.performanceConfig?.MAX_CONCURRENT_PAGES,
                timeout: this.performanceConfig?.TIMEOUT
            }
        };
    }
}

// Instance singleton
export const puppeteerManager = new PuppeteerManager();

// Export des fonctions utilitaires
export { PuppeteerManager };
