/**
 * 💾 Service de gestion des données optimisé
 * Gère les interactions avec la base de données avec batching et optimisations
 */

import { logger } from '../utils/logger.js';
import { performanceManager } from './performanceManager.js';
import { DATABASE_CONFIG, PERFORMANCE_CONFIG } from './config.js';

// Import de la nouvelle couche database
import { RssRepository, ArticleUrlRepository } from '../database/index.js';

class DataManager {
    constructor() {
        this.rssRepo = new RssRepository();
        this.articleUrlRepo = new ArticleUrlRepository();

        this.pendingInserts = [];
        this.insertionQueue = [];
        this.isProcessingQueue = false;

        this.stats = {
            queriesExecuted: 0,
            batchesProcessed: 0,
            cacheHits: 0,
            cacheMisses: 0
        };

        this.existenceCache = new Map();
    }

    /**
     * Récupère tous les flux RSS actifs avec cache
     * @returns {Promise<Array>} Liste des flux RSS
     */
    async getAllRssFeeds() {
        try {
            logger.debug('📡 Récupération des flux RSS', 'DataManager');

            const feeds = await this.rssRepo.findAll({
                where: { active: true },
                orderBy: { created_at: 'DESC' }
            });

            this.stats.queriesExecuted++;

            // Transformation pour compatibilité avec l'ancien format
            const formattedFeeds = feeds.map(feed => ({
                id: feed.id,
                url: feed.url_rss || feed.url,
                title: feed.titre || feed.title,
                description: feed.description,
                active: feed.active,
                created_at: feed.created_at
            }));

            logger.info(`✅ ${formattedFeeds.length} flux RSS actifs récupérés`, 'DataManager');
            return formattedFeeds;

        } catch (error) {
            logger.error(`❌ Erreur récupération flux RSS: ${error.message}`, 'DataManager');
            throw error;
        }
    }

    /**
     * Vérifie si un article existe (avec cache intelligent)
     * @param {string} articleUrl - URL de l'article
     * @returns {Promise<boolean>} true si l'article existe
     */
    async articleExists(articleUrl) {
        if (!articleUrl) return false;

        // Vérification du cache d'existence
        const cacheKey = `exists:${articleUrl}`;
        if (this.existenceCache.has(cacheKey)) {
            this.stats.cacheHits++;
            return this.existenceCache.get(cacheKey);
        }

        try {
            const exists = await this.articleUrlRepo.exists({ url: articleUrl });

            // Mise en cache avec TTL
            this.existenceCache.set(cacheKey, exists);
            this.stats.cacheMisses++;
            this.stats.queriesExecuted++;

            // Nettoyage du cache si trop volumineux
            if (this.existenceCache.size > 1000) {
                this.cleanExistenceCache();
            }

            return exists;

        } catch (error) {
            logger.error(`❌ Erreur vérification existence ${articleUrl}: ${error.message}`, 'DataManager');
            return false; // En cas d'erreur, on considère que l'article n'existe pas
        }
    }

    /**
     * Ajoute un article à la queue d'insertion par batch
     * @param {Object} article - Données de l'article
     */
    async queueArticleForInsertion(article) {
        this.pendingInserts.push({
            url: article.url,
            title: article.title || '',
            description: article.description || '',
            datePublication: article.publishDate || new Date().toISOString(),
            source: 'WireScanner',
            ...article
        });

        // Traitement par batch quand on atteint la taille limite
        if (this.pendingInserts.length >= PERFORMANCE_CONFIG.BATCH_SIZE) {
            await this.processPendingInserts();
        }
    }

    /**
     * Force le traitement de tous les articles en attente
     */
    async flushPendingInserts() {
        if (this.pendingInserts.length > 0) {
            await this.processPendingInserts();
        }
    }

    /**
     * Traite les insertions en attente par batch
     */
    async processPendingInserts() {
        if (this.isProcessingQueue || this.pendingInserts.length === 0) {
            return;
        }

        this.isProcessingQueue = true;
        const batch = [...this.pendingInserts];
        this.pendingInserts = [];

        try {
            logger.debug(`💾 Traitement batch de ${batch.length} articles`, 'DataManager');

            const insertPromises = batch.map(async (article) => {
                try {
                    await this.articleUrlRepo.create(article);

                    // Mise à jour du cache d'existence
                    this.existenceCache.set(`exists:${article.url}`, true);

                    return { success: true, url: article.url };
                } catch (error) {
                    logger.warning(`⚠️ Erreur insertion ${article.url}: ${error.message}`, 'DataManager');
                    return { success: false, url: article.url, error: error.message };
                }
            });

            // Traitement en parallèle avec limite de concurrence
            const results = await this.processWithConcurrencyLimit(
                insertPromises,
                PERFORMANCE_CONFIG.MAX_CONCURRENT_ARTICLES
            );

            const successful = results.filter(r => r.success).length;
            const failed = results.length - successful;

            this.stats.batchesProcessed++;
            this.stats.queriesExecuted += batch.length;

            logger.info(`✅ Batch traité: ${successful} succès, ${failed} échecs`, 'DataManager');

            if (failed > 0) {
                logger.warning(`⚠️ ${failed} articles n'ont pas pu être insérés`, 'DataManager');
            }

        } catch (error) {
            logger.error(`❌ Erreur traitement batch: ${error.message}`, 'DataManager');

            // Remettre les articles en queue en cas d'erreur globale
            this.pendingInserts.unshift(...batch);

        } finally {
            this.isProcessingQueue = false;

            // Délai adaptatif entre les batches
            await performanceManager.smartDelay(DATABASE_CONFIG.BATCH_INSERT_SIZE);
        }
    }

    /**
     * Exécute des promesses avec limite de concurrence
     * @param {Array} promises - Liste des promesses
     * @param {number} limit - Limite de concurrence
     * @returns {Promise<Array>} Résultats
     */
    async processWithConcurrencyLimit(promises, limit) {
        const results = [];

        for (let i = 0; i < promises.length; i += limit) {
            const batch = promises.slice(i, i + limit);
            const batchResults = await Promise.allSettled(batch);

            for (const result of batchResults) {
                if (result.status === 'fulfilled') {
                    results.push(await result.value);
                } else {
                    results.push({ success: false, error: result.reason.message });
                }
            }
        }

        return results;
    }

    /**
     * Insertion directe d'un article (pour compatibilité)
     * @param {string} articleUrl - URL de l'article
     */
    async insertArticle(articleUrl) {
        await this.queueArticleForInsertion({
            url: articleUrl,
            title: '',
            description: '',
            publishDate: new Date().toISOString()
        });

        // Force le traitement immédiat pour maintenir la compatibilité
        await this.flushPendingInserts();
    }

    /**
     * Test de connexion à la base de données
     */
    async testConnection() {
        try {
            // Test simple de connexion en récupérant les flux RSS
            await this.rssRepo.getAllFeeds();
            logger.info('✅ Connexion base de données OK', 'DataManager');
            return true;
        } catch (error) {
            logger.error(`❌ Erreur connexion DB: ${error.message}`, 'DataManager');
            throw error;
        }
    }

    /**
     * Nettoyage du cache d'existence
     */
    cleanExistenceCache() {
        // Garde seulement les 500 entrées les plus récentes
        const entries = Array.from(this.existenceCache.entries());
        this.existenceCache.clear();

        entries.slice(-500).forEach(([key, value]) => {
            this.existenceCache.set(key, value);
        });

        logger.debug('🧹 Cache d\'existence nettoyé', 'DataManager');
    }

    /**
     * Obtient les statistiques du gestionnaire
     * @returns {Object} Statistiques
     */
    getStats() {
        return {
            ...this.stats,
            pendingInserts: this.pendingInserts.length,
            cacheSize: this.existenceCache.size,
            isProcessingQueue: this.isProcessingQueue
        };
    }

    /**
     * Remet à zéro le gestionnaire
     */
    async reset() {
        // Traite les insertions en attente avant reset
        await this.flushPendingInserts();

        this.pendingInserts = [];
        this.insertionQueue = [];
        this.existenceCache.clear();
        this.isProcessingQueue = false;

        this.stats = {
            queriesExecuted: 0,
            batchesProcessed: 0,
            cacheHits: 0,
            cacheMisses: 0
        };

        logger.info('🔄 DataManager réinitialisé', 'DataManager');
    }
}

// Instance singleton
const dataManager = new DataManager();

export { dataManager };
export default DataManager;
