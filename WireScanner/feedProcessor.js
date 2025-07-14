/**
 * 🔄 Service de traitement des flux RSS optimisé
 * Gère le parsing, la validation et le traitement concurrent
 */

import Parser from 'rss-parser';
import { logger } from '../utils/logger.js';
import { performanceManager } from './performanceManager.js';
import { RSS_CONFIG, PERFORMANCE_CONFIG } from './config.js';
import { rssRepository } from '../database/rssRepository.js';

class FeedProcessor {
    constructor() {
        this.parser = new Parser({
            timeout: PERFORMANCE_CONFIG.REQUEST_TIMEOUT,
            customFields: {
                feed: ['language', 'category'],
                item: ['author', 'category', 'enclosure']
            }
        });

        this.processingQueue = [];
        this.activeProcesses = 0;
    }

    /**
     * Parse un flux RSS avec cache et optimisations
     * @param {string} url - URL du flux RSS
     * @returns {Promise<Object>} Flux parsé
     */
    async parseFeed(url) {
        // Vérification du cache d'abord
        const cached = performanceManager.getFeedFromCache(url);
        if (cached) {
            logger.debug(`📦 Flux récupéré du cache: ${url}`, 'FeedProcessor');
            return cached;
        }

        try {
            logger.debug(`📡 Parsing du flux: ${url}`, 'FeedProcessor');

            const feed = await this.parser.parseURL(url);

            // Validation et nettoyage du flux
            const validatedFeed = this.validateAndCleanFeed(feed);

            // Mise en cache
            performanceManager.cacheFeed(url, validatedFeed);

            performanceManager.incrementMetric('processedFeeds');

            // Marquer le flux comme valide s'il était précédemment invalide
            try {
                await rssRepository.markAsValid(url);
            } catch (dbError) {
                logger.debug(`⚠️ Erreur marquage flux valide ${url}: ${dbError.message}`, 'FeedProcessor');
                // Ne pas faire échouer le parsing pour cette erreur de DB
            }

            return validatedFeed;

        } catch (error) {
            performanceManager.incrementMetric('errors');
            logger.error(`❌ Erreur parsing flux ${url}: ${error.message}`, 'FeedProcessor');

            // Marquer le flux comme invalide en base de données
            try {
                await rssRepository.markAsInvalid(url, error.message);
            } catch (dbError) {
                logger.error(`❌ Erreur marquage flux invalide ${url}: ${dbError.message}`, 'FeedProcessor');
            }

            throw new Error(`Échec du parsing pour ${url}: ${error.message}`);
        }
    }

    /**
     * Traite plusieurs flux en parallèle avec contrôle de concurrence
     * @param {Array<string>} urls - Liste des URLs à traiter
     * @returns {Promise<Array>} Résultats du traitement
     */
    async processMultipleFeeds(urls) {
        logger.info(`🔄 Traitement de ${urls.length} flux avec max ${PERFORMANCE_CONFIG.MAX_CONCURRENT_FEEDS} en parallèle`, 'FeedProcessor');

        const results = [];
        const chunks = this.chunkArray(urls, PERFORMANCE_CONFIG.MAX_CONCURRENT_FEEDS);

        for (const chunk of chunks) {
            const chunkPromises = chunk.map(async (url) => {
                try {
                    const feed = await this.parseFeed(url);
                    return { url, feed, success: true };
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
                    performanceManager.incrementMetric('errors');
                }
            }

            // Délai adaptatif entre les chunks
            if (chunks.indexOf(chunk) < chunks.length - 1) {
                await performanceManager.smartDelay();
            }
        }

        return results;
    }

    /**
     * Extrait et valide les articles d'un flux
     * @param {Object} feed - Flux RSS parsé
     * @param {string} sourceUrl - URL source du flux
     * @returns {Array} Articles validés
     */
    extractValidArticles(feed, sourceUrl) {
        if (!feed.items || !Array.isArray(feed.items)) {
            logger.warning(`⚠️ Aucun article trouvé dans ${sourceUrl}`, 'FeedProcessor');
            return [];
        }

        const validArticles = [];
        const now = Date.now();
        const maxAge = PERFORMANCE_CONFIG.MAX_ARTICLE_AGE_DAYS * 24 * 60 * 60 * 1000;

        for (const item of feed.items) {
            try {
                const article = this.validateAndCleanArticle(item, sourceUrl);

                if (article) {
                    // Vérification de l'âge de l'article
                    if (article.publishDate) {
                        const articleAge = now - new Date(article.publishDate).getTime();
                        if (articleAge > maxAge) {
                            logger.debug(`📅 Article trop ancien ignoré: ${article.url}`, 'FeedProcessor');
                            continue;
                        }
                    }

                    validArticles.push(article);
                    performanceManager.incrementMetric('processedArticles');
                }
            } catch (error) {
                performanceManager.incrementMetric('errors');
                logger.debug(`⚠️ Article invalide ignoré: ${error.message}`, 'FeedProcessor');
            }
        }

        logger.info(`✅ ${validArticles.length}/${feed.items.length} articles valides extraits de ${sourceUrl}`, 'FeedProcessor');
        return validArticles;
    }

    /**
     * Valide et nettoie un flux RSS
     * @param {Object} feed - Flux brut
     * @returns {Object} Flux validé
     */
    validateAndCleanFeed(feed) {
        if (!RSS_CONFIG.VALIDATE_FEED_STRUCTURE) {
            return feed;
        }

        // Validation des champs essentiels
        if (!feed.title) {
            logger.warning('⚠️ Flux sans titre détecté', 'FeedProcessor');
        }

        if (!feed.items || !Array.isArray(feed.items)) {
            throw new Error('Flux RSS invalide: aucun article trouvé');
        }

        // Nettoyage et optimisation
        return {
            title: this.cleanString(feed.title),
            description: this.cleanString(feed.description),
            link: feed.link,
            language: feed.language,
            lastBuildDate: feed.lastBuildDate,
            items: feed.items // Les items seront validés individuellement
        };
    }

    /**
     * Valide et nettoie un article
     * @param {Object} item - Article brut
     * @param {string} sourceUrl - URL source
     * @returns {Object|null} Article validé ou null si invalide
     */
    validateAndCleanArticle(item, sourceUrl) {
        // Validation URL
        if (!item.link || !this.isValidUrl(item.link)) {
            if (RSS_CONFIG.SKIP_INVALID_ARTICLES) {
                return null;
            }
            throw new Error(`URL invalide: ${item.link}`);
        }

        // Validation titre
        const title = this.cleanString(item.title);
        if (!title || title.length < RSS_CONFIG.MIN_ARTICLE_LENGTH) {
            if (RSS_CONFIG.SKIP_INVALID_ARTICLES) {
                return null;
            }
            throw new Error(`Titre invalide ou trop court: ${title}`);
        }

        return {
            url: item.link,
            title: title,
            description: this.cleanString(item.description || item.summary || ''),
            publishDate: item.pubDate || item.isoDate,
            author: this.cleanString(item.author),
            categories: item.categories || [],
            source: sourceUrl,
            extractedAt: new Date().toISOString()
        };
    }

    /**
     * Nettoie une chaîne de caractères
     * @param {string} str - Chaîne à nettoyer
     * @returns {string} Chaîne nettoyée
     */
    cleanString(str) {
        if (!str || typeof str !== 'string') return '';

        return str
            .trim()
            .replace(/\s+/g, ' ')           // Normalise les espaces
            .replace(/[\r\n\t]/g, ' ')      // Supprime les retours à la ligne
            .replace(/&nbsp;/g, ' ')        // Remplace les espaces insécables
            .slice(0, 1000);                // Limite la longueur
    }

    /**
     * Valide une URL
     * @param {string} url - URL à valider
     * @returns {boolean} true si valide
     */
    isValidUrl(url) {
        if (!url || typeof url !== 'string') return false;

        try {
            const urlObj = new URL(url);
            return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
        } catch {
            return false;
        }
    }

    /**
     * Divise un tableau en chunks
     * @param {Array} array - Tableau à diviser
     * @param {number} size - Taille des chunks
     * @returns {Array} Tableau de chunks
     */
    chunkArray(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }

    /**
     * Obtient les statistiques du processeur
     * @returns {Object} Statistiques
     */
    getStats() {
        return {
            cacheSize: performanceManager.feedCache.size,
            activeProcesses: this.activeProcesses,
            queueSize: this.processingQueue.length
        };
    }

    /**
     * Remet à zéro le processeur
     */
    reset() {
        this.processingQueue = [];
        this.activeProcesses = 0;
        performanceManager.feedCache.clear();
        logger.info('🔄 FeedProcessor réinitialisé', 'FeedProcessor');
    }
}

// Instance singleton
const feedProcessor = new FeedProcessor();

export { feedProcessor };
export default FeedProcessor;
