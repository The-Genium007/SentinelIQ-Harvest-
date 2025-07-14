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
            await this.testPuppeteerCompatibility();

            this.isInitialized = true;
            logger.success('✅ PuppeteerManager initialisé avec succès', 'PuppeteerManager');

            return this.platformConfig;

        } catch (error) {
            logger.error(`❌ Erreur initialisation PuppeteerManager: ${error.message}`, 'PuppeteerManager');
            throw error;
        }
    }

    /**
     * 🧪 Test de compatibilité Puppeteer
     */
    async testPuppeteerCompatibility() {
        logger.info('🧪 Test de compatibilité Puppeteer', 'PuppeteerManager');

        try {
            // Configuration simplifiée pour test en environnement conteneur
            const isContainer = process.env.NODE_ENV === 'production' || process.env.DOCKER_ENV;
            const testConfig = isContainer ? {
                ...this.puppeteerConfig,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox', 
                    '--disable-dev-shm-usage',
                    '--single-process',
                    '--disable-gpu',
                    '--disable-web-security',
                    '--ignore-certificate-errors'
                ]
            } : this.puppeteerConfig;

            // Création directe sans passer par createBrowser() pour éviter la récursion
            const browser = await puppeteer.launch(testConfig);
            const page = await browser.newPage();

            // Test simple sans certificats SSL
            await page.goto('data:text/html,<h1>Test Puppeteer</h1>', {
                waitUntil: 'load', // Plus rapide que networkidle0
                timeout: 10000
            });

            const title = await page.evaluate(() => document.querySelector('h1').textContent);

            if (title !== 'Test Puppeteer') {
                throw new Error('Test de rendu échoué');
            }

            await page.close();
            await browser.close();

            logger.success('✅ Test de compatibilité Puppeteer réussi', 'PuppeteerManager');

        } catch (error) {
            logger.error(`❌ Test de compatibilité échoué: ${error.message}`, 'PuppeteerManager');

            // Suggestions de résolution selon la plateforme
            if (this.platformConfig.IS_DEBIAN) {
                logger.warn('💡 Pour Debian/Ubuntu, installez: sudo apt-get install chromium-browser', 'PuppeteerManager');
                logger.warn('💡 Ou: sudo apt-get install google-chrome-stable', 'PuppeteerManager');
            } else if (this.platformConfig.IS_MACOS) {
                logger.warn('💡 Pour macOS, installez: brew install chromium', 'PuppeteerManager');
                logger.warn('💡 Ou téléchargez Chrome depuis https://www.google.com/chrome/', 'PuppeteerManager');
            }

            throw error;
        }
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

            const browser = await puppeteer.launch(this.puppeteerConfig);

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
