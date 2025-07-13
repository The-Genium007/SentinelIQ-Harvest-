/**
 * 🚀 WireScanner - Module principal optimisé
 * Version refactorisée pour performance et réutilisabilité maximales
 */

import { logger } from '../utils/logger.js';
import { performanceManager } from './performanceManager.js';
import { feedProcessor } from './feedProcessor.js';
import { dataManager } from './dataManager.js';
import { getConfig } from './config.js';

class WireScanner {
    constructor() {
        this.config = getConfig();
        this.isRunning = false;
        this.currentSession = null;
    }

    /**
     * Point d'entrée principal pour le crawling optimisé
     * @param {Object} options - Options de configuration
     * @returns {Promise<Object>} Résultats du scrapping
     */
    async crawl(options = {}) {
        if (this.isRunning) {
            throw new Error('Crawling déjà en cours');
        }

        this.isRunning = true;
        this.currentSession = {
            startTime: Date.now(),
            options: { ...this.config, ...options }
        };

        try {
            // Démarrage du monitoring des performances
            performanceManager.startMonitoring();

            logger.info('🚀 Démarrage du crawling WireScanner optimisé', 'WireScanner');

            // Phase 1: Récupération des flux RSS
            const feeds = await this.loadRssFeeds();

            // Phase 2: Traitement des flux avec optimisations
            const articles = await this.processFeeds(feeds);

            // Phase 3: Sauvegarde des articles avec batching
            const results = await this.saveArticles(articles);

            // Finalisation et métriques
            const finalResults = await this.finalizeCrawling(results);

            return finalResults;

        } catch (error) {
            logger.error(`❌ Erreur critique dans le crawling: ${error.message}`, 'WireScanner');
            throw error;
        } finally {
            this.isRunning = false;
            this.currentSession = null;
        }
    }

    /**
     * Phase 1: Récupération des flux RSS
     * @returns {Promise<Array>} Liste des flux RSS actifs
     */
    async loadRssFeeds() {
        logger.info('📡 Phase 1: Récupération des flux RSS', 'WireScanner');

        // Test de connexion
        await dataManager.testConnection();

        // Récupération des flux
        const feeds = await dataManager.getAllRssFeeds();

        if (feeds.length === 0) {
            logger.warning('⚠️ Aucun flux RSS actif trouvé', 'WireScanner');
            return [];
        }

        logger.info(`✅ ${feeds.length} flux RSS récupérés`, 'WireScanner');
        return feeds;
    }

    /**
     * Phase 2: Traitement optimisé des flux
     * @param {Array} feeds - Liste des flux RSS
     * @returns {Promise<Array>} Articles extraits et validés
     */
    async processFeeds(feeds) {
        logger.info(`🔄 Phase 2: Traitement de ${feeds.length} flux RSS`, 'WireScanner');

        if (feeds.length === 0) {
            return [];
        }

        const allArticles = [];
        const feedUrls = feeds.map(feed => feed.url);

        // Traitement en parallèle avec contrôle de concurrence
        const feedResults = await feedProcessor.processMultipleFeeds(feedUrls);

        // Extraction des articles de chaque flux
        for (const result of feedResults) {
            if (result.success && result.feed) {
                try {
                    const articles = feedProcessor.extractValidArticles(result.feed, result.url);
                    allArticles.push(...articles);

                    logger.debug(`📄 ${articles.length} articles extraits de ${result.url}`, 'WireScanner');
                } catch (error) {
                    logger.warning(`⚠️ Erreur extraction articles de ${result.url}: ${error.message}`, 'WireScanner');
                }
            } else {
                logger.warning(`❌ Échec traitement flux ${result.url}: ${result.error}`, 'WireScanner');
            }
        }

        logger.info(`✅ ${allArticles.length} articles totaux extraits`, 'WireScanner');
        return allArticles;
    }

    /**
     * Phase 3: Sauvegarde optimisée des articles
     * @param {Array} articles - Articles à sauvegarder
     * @returns {Promise<Object>} Résultats de la sauvegarde
     */
    async saveArticles(articles) {
        logger.info(`💾 Phase 3: Sauvegarde de ${articles.length} articles`, 'WireScanner');

        if (articles.length === 0) {
            return { inserted: 0, skipped: 0, errors: 0 };
        }

        let inserted = 0;
        let skipped = 0;
        let errors = 0;

        // Traitement par chunks pour optimiser les performances
        const chunks = this.chunkArray(articles, this.config.performance.BATCH_SIZE);

        for (const [chunkIndex, chunk] of chunks.entries()) {
            logger.debug(`📦 Traitement chunk ${chunkIndex + 1}/${chunks.length} (${chunk.length} articles)`, 'WireScanner');

            // Vérification d'existence en parallèle
            const existenceChecks = await Promise.allSettled(
                chunk.map(article => dataManager.articleExists(article.url))
            );

            // Traitement des articles nouveaux
            for (const [articleIndex, article] of chunk.entries()) {
                const existenceResult = existenceChecks[articleIndex];

                if (existenceResult.status === 'fulfilled' && !existenceResult.value) {
                    try {
                        await dataManager.queueArticleForInsertion(article);
                        inserted++;

                        if (this.config.env.VERBOSE) {
                            logger.debug(`✅ Article ajouté à la queue: ${article.url}`, 'WireScanner');
                        }
                    } catch (error) {
                        errors++;
                        logger.warning(`⚠️ Erreur ajout article ${article.url}: ${error.message}`, 'WireScanner');
                    }
                } else if (existenceResult.status === 'fulfilled') {
                    skipped++;

                    if (this.config.env.VERBOSE) {
                        logger.debug(`🔁 Article existant ignoré: ${article.url}`, 'WireScanner');
                    }
                } else {
                    errors++;
                    logger.warning(`❌ Erreur vérification existence ${article.url}`, 'WireScanner');
                }
            }

            // Délai adaptatif entre les chunks
            if (chunkIndex < chunks.length - 1) {
                await performanceManager.smartDelay();
            }
        }

        // Force le traitement de tous les articles en queue
        await dataManager.flushPendingInserts();

        const results = { inserted, skipped, errors };
        logger.info(`✅ Sauvegarde terminée: ${inserted} insérés, ${skipped} ignorés, ${errors} erreurs`, 'WireScanner');

        return results;
    }

    /**
     * Finalisation du crawling avec métriques
     * @param {Object} saveResults - Résultats de la sauvegarde
     * @returns {Promise<Object>} Résultats finaux
     */
    async finalizeCrawling(saveResults) {
        logger.info('🏁 Finalisation du crawling', 'WireScanner');

        // Arrêt du monitoring et récupération des métriques
        const performanceMetrics = performanceManager.stopMonitoring();

        // Statistiques des gestionnaires
        const feedStats = feedProcessor.getStats();
        const dataStats = dataManager.getStats();

        const finalResults = {
            success: true,
            timestamp: new Date().toISOString(),
            duration: performanceMetrics.duration,
            durationFormatted: performanceMetrics.durationFormatted,

            // Résultats de traitement
            sources: saveResults.inserted + saveResults.skipped + saveResults.errors > 0 ?
                Math.ceil((saveResults.inserted + saveResults.skipped + saveResults.errors) / this.config.performance.BATCH_SIZE) : 0,
            articles: saveResults.inserted,
            skipped: saveResults.skipped,
            errors: saveResults.errors,

            // Métriques de performance
            performance: {
                memory: performanceMetrics.memory,
                processing: performanceMetrics.processing,
                cache: performanceMetrics.cache
            },

            // Statistiques détaillées
            stats: {
                feedProcessor: feedStats,
                dataManager: dataStats
            }
        };

        // Log du résumé final
        this.logFinalSummary(finalResults);

        return finalResults;
    }

    /**
     * Log du résumé final
     * @param {Object} results - Résultats finaux
     */
    logFinalSummary(results) {
        logger.info('📊 === RÉSUMÉ DU CRAWLING ===', 'WireScanner');
        logger.info(`⏱️ Durée: ${results.durationFormatted}`, 'WireScanner');
        logger.info(`📈 Articles: ${results.articles} nouveaux, ${results.skipped} existants`, 'WireScanner');
        logger.info(`🧠 Mémoire pic: ${results.performance.memory.peak.toFixed(2)}MB`, 'WireScanner');
        logger.info(`💾 Cache: ${results.performance.cache.hitRate}% de réussite`, 'WireScanner');

        if (results.errors > 0) {
            logger.warning(`⚠️ ${results.errors} erreurs rencontrées`, 'WireScanner');
        }

        logger.success('✅ Crawling terminé avec succès', 'WireScanner');
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
     * Obtient le statut actuel du scanner
     * @returns {Object} Statut
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            currentSession: this.currentSession,
            config: this.config,
            version: '2.0.0-optimized'
        };
    }

    /**
     * Arrêt gracieux du scanner
     */
    async stop() {
        if (this.isRunning) {
            logger.info('⏹️ Arrêt du crawling en cours...', 'WireScanner');

            // Finalise les opérations en cours
            await dataManager.flushPendingInserts();
            performanceManager.stopMonitoring();

            this.isRunning = false;
            this.currentSession = null;

            logger.info('🛑 Crawling arrêté', 'WireScanner');
        }
    }
}

// Instance singleton
const wireScanner = new WireScanner();

/**
 * Fonction de compatibilité avec l'ancienne API
 * @returns {Promise<Object>} Résultats du crawling
 */
export async function crawlUrl() {
    return await wireScanner.crawl();
}

// Export des nouvelles API
export { wireScanner };
export default WireScanner;
