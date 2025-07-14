/**
 * 🕷️ Service de scraping optimisé pour Cortex
 * Gère le pool de navigateurs et l'extraction de contenu avec optimisations multi-plateformes
 */

import { logger } from '../utils/logger.js';
import { cortexPerformanceManager } from './performanceManager.js';
import { puppeteerManager } from './puppeteerManager.js';
import { SCRAPING_CONFIG, PERFORMANCE_CONFIG } from './config.js';

class ScrapingEngine {
    constructor() {
        this.browserPool = [];
        this.activeBrowsers = new Set();
        this.scrapingQueue = [];
        this.isInitialized = false;
        this.poolSize = PERFORMANCE_CONFIG.BROWSER_POOL_SIZE;
        this.platformConfig = null;
        this.puppeteerCompatible = true; // Par défaut compatible, sera mis à jour lors de l'initialisation
    }

    /**
     * Initialise le moteur de scraping avec détection de plateforme
     */
    async initialize() {
        if (this.isInitialized) return;

        logger.info('🚀 Initialisation du moteur de scraping multi-plateforme', 'ScrapingEngine');

        try {
            // Initialisation du gestionnaire Puppeteer
            this.platformConfig = await puppeteerManager.initialize();

            // Mise à jour de la taille du pool selon la plateforme
            this.poolSize = this.platformConfig.IS_DEBIAN ?
                this.platformConfig.MEMORY.DEBIAN.BROWSER_POOL_SIZE :
                this.platformConfig.MEMORY.MACOS.BROWSER_POOL_SIZE;

            logger.info(`🏊‍♂️ Pool optimisé pour ${this.platformConfig.IS_MACOS ? 'macOS' : 'Debian'}: ${this.poolSize} navigateurs`, 'ScrapingEngine');

            // Pré-création des navigateurs pour le pool
            for (let i = 0; i < this.poolSize; i++) {
                const browser = await puppeteerManager.getBrowserFromPool(`pool-${i}`);
                this.browserPool.push(browser);
                cortexPerformanceManager.trackBrowserInstance('create');
            }

            this.isInitialized = true;
            this.puppeteerCompatible = true; // Puppeteer disponible et fonctionnel
            logger.success(`✅ Pool de navigateurs initialisé (${this.poolSize} instances)`, 'ScrapingEngine');

        } catch (error) {
            logger.error(`❌ Erreur initialisation pool navigateurs: ${error.message}`, 'ScrapingEngine');
            
            // En mode conteneur, on réduit les exigences mais on essaie quand même
            if (process.env.NODE_ENV === 'production' || process.env.DOCKER_ENV) {
                logger.warning('⚠️ Erreur Puppeteer en conteneur - Tentative avec configuration réduite', 'ScrapingEngine');
                
                try {
                    // Tentative avec un pool réduit (1 navigateur seulement)
                    this.poolSize = 1;
                    const browser = await puppeteerManager.getBrowserFromPool('container-single');
                    this.browserPool.push(browser);
                    this.isInitialized = true;
                    this.puppeteerCompatible = true;
                    logger.success('✅ Pool réduit initialisé pour conteneur (1 navigateur)', 'ScrapingEngine');
                    return;
                } catch (containerError) {
                    logger.error(`❌ Échec total Puppeteer en conteneur: ${containerError.message}`, 'ScrapingEngine');
                    logger.warning('⚠️ Initialisation ScrapingEngine en mode dégradé (sans Puppeteer)', 'ScrapingEngine');
                    this.isInitialized = true;
                    this.poolSize = 0;
                    this.puppeteerCompatible = false; // Puppeteer non disponible
                    return;
                }
            }
            
            throw error;
        }
    }

    /**
     * Crée un navigateur optimisé pour la plateforme courante
     */
    async createOptimizedBrowser() {
        return await puppeteerManager.createBrowser();
    }

    /**
     * Crée une page optimisée selon la plateforme
     */
    async createOptimizedPage(browser) {
        return await puppeteerManager.createOptimizedPage(browser);
    }

    /**
     * Optimise une page pour la performance
     */
    async optimizePage(page) {
        // Configuration du viewport
        await page.setViewport(SCRAPING_CONFIG.VIEWPORT);

        // User agent personnalisé
        await page.setUserAgent(SCRAPING_CONFIG.USER_AGENT);

        // Bloquer les ressources non nécessaires
        if (SCRAPING_CONFIG.BLOCK_RESOURCES.length > 0) {
            await page.setRequestInterception(true);
            page.on('request', (request) => {
                const resourceType = request.resourceType();

                if (SCRAPING_CONFIG.BLOCK_RESOURCES.includes(resourceType)) {
                    request.abort();
                } else if (resourceType === 'image' && SCRAPING_CONFIG.DISABLE_IMAGES) {
                    request.abort();
                } else {
                    request.continue();
                }
            });
        }

        // Configuration des timeouts
        page.setDefaultTimeout(PERFORMANCE_CONFIG.PAGE_TIMEOUT);
        page.setDefaultNavigationTimeout(PERFORMANCE_CONFIG.PAGE_TIMEOUT);

        return page;
    }

    /**
     * Obtient un navigateur du pool ou en crée un nouveau si nécessaire
     */
    async getBrowser() {
        if (!this.isInitialized) {
            await this.initialize();
        }

        // En mode conteneur, vérifier si Puppeteer est disponible
        if (process.env.DOCKER_ENV && !this.puppeteerCompatible) {
            throw new Error('Puppeteer non disponible en mode conteneur - utiliser un mode alternatif');
        }

        // Essayer de récupérer un navigateur du pool
        if (this.browserPool.length > 0) {
            const browser = this.browserPool.pop();
            this.activeBrowsers.add(browser);
            return browser;
        }

        // Si le pool est vide et qu'on n'a pas atteint la limite
        if (this.activeBrowsers.size < PERFORMANCE_CONFIG.MAX_CONCURRENT_BROWSERS) {
            const browser = await this.createOptimizedBrowser();
            this.activeBrowsers.add(browser);
            cortexPerformanceManager.trackBrowserInstance('create');
            return browser;
        }

        // Attendre qu'un navigateur se libère
        return this.waitForAvailableBrowser();
    }

    /**
     * Attend qu'un navigateur soit disponible
     */
    async waitForAvailableBrowser() {
        return new Promise((resolve) => {
            const checkInterval = setInterval(() => {
                if (this.browserPool.length > 0) {
                    clearInterval(checkInterval);
                    const browser = this.browserPool.pop();
                    this.activeBrowsers.add(browser);
                    resolve(browser);
                }
            }, 100);
        });
    }

    /**
     * Remet un navigateur dans le pool
     */
    releaseBrowser(browser) {
        this.activeBrowsers.delete(browser);

        // Vérifier que le navigateur est encore utilisable
        if (browser && !browser.isConnected()) {
            logger.warning('⚠️ Navigateur déconnecté, création d\'un nouveau', 'ScrapingEngine');
            this.createOptimizedBrowser()
                .then(newBrowser => this.browserPool.push(newBrowser))
                .catch(error => logger.error(`❌ Erreur création navigateur: ${error.message}`, 'ScrapingEngine'));
        } else {
            this.browserPool.push(browser);
        }
    }

    /**
     * Scrape un article avec optimisations complètes
     */
    async scrapeArticle(url) {
        const startTime = Date.now();

        // Vérifier le cache d'abord
        const cached = cortexPerformanceManager.getArticleFromCache(url);
        if (cached) {
            logger.debug(`📦 Article récupéré du cache: ${url}`, 'ScrapingEngine');
            return cached;
        }

        let browser = null;
        let page = null;

        try {
            // Obtenir un navigateur optimisé
            browser = await this.getBrowser();
            page = await browser.newPage();
            await this.optimizePage(page);

            // Navigation avec optimisations
            logger.debug(`🕷️ Scraping: ${url}`, 'ScrapingEngine');

            await page.goto(url, {
                waitUntil: 'domcontentloaded',
                timeout: PERFORMANCE_CONFIG.PAGE_TIMEOUT
            });

            // Attendre que le contenu soit chargé
            await page.waitForSelector('body', { timeout: 5000 });

            // Extraction du contenu avec sélecteurs optimisés
            const articleData = await this.extractContent(page, url);

            // Validation du contenu
            const validatedData = this.validateContent(articleData);

            if (validatedData) {
                // Mise en cache
                cortexPerformanceManager.cacheArticle(url, validatedData);
                cortexPerformanceManager.incrementMetric('successfulScrapes');

                const duration = Date.now() - startTime;
                cortexPerformanceManager.recordScrapingTime(duration);

                logger.debug(`✅ Article scrapé avec succès: ${url} (${duration}ms)`, 'ScrapingEngine');
                return validatedData;
            } else {
                throw new Error('Contenu invalide après validation');
            }

        } catch (error) {
            cortexPerformanceManager.incrementMetric('failedScrapes');
            logger.warning(`❌ Échec scraping ${url}: ${error.message}`, 'ScrapingEngine');
            throw error;

        } finally {
            // Nettoyage des ressources
            if (page) {
                try {
                    await page.close();
                } catch (error) {
                    logger.warning(`⚠️ Erreur fermeture page: ${error.message}`, 'ScrapingEngine');
                }
            }

            if (browser) {
                this.releaseBrowser(browser);
            }

            cortexPerformanceManager.incrementMetric('processedArticles');

            // Délai adaptatif pour éviter la surcharge
            await cortexPerformanceManager.adaptiveScrapingDelay();
        }
    }

    /**
     * Extrait le contenu d'une page avec sélecteurs optimisés
     */
    async extractContent(page, url) {
        return await page.evaluate((selectors, url) => {
            // Fonction utilitaire pour essayer plusieurs sélecteurs
            function trySelectors(selectorList, getAttribute = null) {
                for (const selector of selectorList) {
                    const element = document.querySelector(selector);
                    if (element) {
                        if (getAttribute) {
                            return element.getAttribute(getAttribute);
                        }
                        return element.textContent || element.innerText;
                    }
                }
                return '';
            }

            // Extraction du titre
            const title = trySelectors(selectors.title) || document.title || '';

            // Extraction du contenu principal
            let content = '';
            for (const selector of selectors.article) {
                const element = document.querySelector(selector);
                if (element) {
                    content = element.innerText || element.textContent || '';
                    if (content.length > 100) break; // Prendre le premier contenu substantiel
                }
            }

            // Si pas de contenu principal, essayer les paragraphes
            if (content.length < 100) {
                const paragraphs = Array.from(document.querySelectorAll('p'))
                    .map(p => p.textContent || p.innerText)
                    .filter(text => text && text.length > 20);
                content = paragraphs.join(' ');
            }

            // Extraction de la date
            const date = trySelectors(selectors.date, 'datetime') ||
                trySelectors(selectors.date) || '';

            // Extraction de l'auteur
            const author = trySelectors(selectors.author) || '';

            return {
                title: title.trim(),
                content: content.trim(),
                publishDate: date.trim(),
                author: author.trim(),
                url: url,
                extractedAt: new Date().toISOString()
            };

        }, SCRAPING_CONFIG.SELECTORS, url);
    }

    /**
     * Valide le contenu extrait
     */
    validateContent(data) {
        if (!data || typeof data !== 'object') {
            return null;
        }

        // Validation du titre
        if (!data.title || data.title.length < SCRAPING_CONFIG.MIN_TITLE_LENGTH) {
            logger.debug('❌ Titre invalide ou trop court', 'ScrapingEngine');
            return null;
        }

        // Validation du contenu
        if (!data.content || data.content.length < SCRAPING_CONFIG.MIN_CONTENT_LENGTH) {
            logger.debug('❌ Contenu invalide ou trop court', 'ScrapingEngine');
            return null;
        }

        if (data.content.length > SCRAPING_CONFIG.MAX_CONTENT_LENGTH) {
            data.content = data.content.substring(0, SCRAPING_CONFIG.MAX_CONTENT_LENGTH) + '...';
            logger.debug('⚠️ Contenu tronqué (trop long)', 'ScrapingEngine');
        }

        // Nettoyage du contenu
        data.content = data.content.replace(/\s+/g, ' ').trim();
        data.title = data.title.replace(/\s+/g, ' ').trim();

        // Ajout de la date si manquante
        if (!data.publishDate) {
            data.publishDate = new Date().toISOString().split('T')[0];
        }

        return data;
    }

    /**
     * Traite plusieurs articles en parallèle avec contrôle de concurrence
     */
    async scrapeMultipleArticles(urls) {
        if (!Array.isArray(urls) || urls.length === 0) {
            return [];
        }

        logger.info(`🔄 Scraping de ${urls.length} articles avec max ${PERFORMANCE_CONFIG.MAX_CONCURRENT_ARTICLES} en parallèle`, 'ScrapingEngine');

        const results = [];
        const chunks = this.chunkArray(urls, PERFORMANCE_CONFIG.MAX_CONCURRENT_ARTICLES);

        for (const [chunkIndex, chunk] of chunks.entries()) {
            logger.debug(`📦 Traitement chunk ${chunkIndex + 1}/${chunks.length} (${chunk.length} articles)`, 'ScrapingEngine');

            const chunkPromises = chunk.map(async (url) => {
                try {
                    const article = await this.scrapeArticle(url);
                    return { url, article, success: true };
                } catch (error) {
                    return { url, error: error.message, success: false };
                }
            });

            const chunkResults = await Promise.allSettled(chunkPromises);

            // Traiter les résultats
            for (const result of chunkResults) {
                if (result.status === 'fulfilled') {
                    results.push(result.value);
                } else {
                    results.push({ url: 'unknown', error: result.reason.message, success: false });
                }
            }

            // Délai entre les chunks
            if (chunkIndex < chunks.length - 1) {
                await new Promise(resolve => setTimeout(resolve, PERFORMANCE_CONFIG.PROCESSING_DELAY));
            }
        }

        const successful = results.filter(r => r.success).length;
        const failed = results.length - successful;

        logger.info(`✅ Scraping terminé: ${successful} succès, ${failed} échecs`, 'ScrapingEngine');

        return results;
    }

    /**
     * Divise un tableau en chunks
     */
    chunkArray(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }

    /**
     * Obtient les statistiques du moteur de scraping
     */
    getStats() {
        return {
            poolSize: this.browserPool.length,
            activeBrowsers: this.activeBrowsers.size,
            queueSize: this.scrapingQueue.length,
            isInitialized: this.isInitialized
        };
    }

    /**
     * Nettoyage complet des ressources
     */
    async cleanup() {
        logger.info('🧹 Nettoyage du moteur de scraping', 'ScrapingEngine');

        // Fermer tous les navigateurs actifs
        const closePromises = [];

        for (const browser of this.activeBrowsers) {
            closePromises.push(browser.close().catch(error =>
                logger.warning(`⚠️ Erreur fermeture navigateur actif: ${error.message}`, 'ScrapingEngine')
            ));
        }

        for (const browser of this.browserPool) {
            closePromises.push(browser.close().catch(error =>
                logger.warning(`⚠️ Erreur fermeture navigateur pool: ${error.message}`, 'ScrapingEngine')
            ));
        }

        await Promise.all(closePromises);

        this.browserPool = [];
        this.activeBrowsers.clear();
        this.isInitialized = false;

        logger.info('✅ Moteur de scraping nettoyé', 'ScrapingEngine');
    }
}

// Instance singleton
const scrapingEngine = new ScrapingEngine();

export { scrapingEngine };
export default ScrapingEngine;
