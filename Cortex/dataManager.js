/**
 * 💾 Service de gestion des données optimisé pour Cortex
 * Gère les interactions avec la base de données pour les articles traités
 */

import { logger } from '../utils/logger.js';
import { cortexPerformanceManager } from './performanceManager.js';
import { DATABASE_CONFIG, PERFORMANCE_CONFIG, CONTENT_CONFIG } from './config.js';

// Import de la nouvelle couche database
import { ArticleUrlRepository, ArticleRepository, testSupabaseConnection } from '../database/index.js';

class CortexDataManager {
    constructor() {
        this.articleUrlRepo = new ArticleUrlRepository();
        this.articleRepo = new ArticleRepository();

        this.pendingInserts = [];
        this.processingQueue = [];
        this.isProcessingQueue = false;

        this.stats = {
            queriesExecuted: 0,
            articlesProcessed: 0,
            articlesInserted: 0,
            duplicatesSkipped: 0,
            validationFailures: 0,
            batchesProcessed: 0,
            cacheHits: 0,
            cacheMisses: 0
        };

        this.existenceCache = new Map();
        this.contentCache = new Map();
    }

    /**
     * Récupère les URLs d'articles à traiter depuis la base
     * @param {Object} options - Options de récupération
     * @returns {Promise<Array>} Liste des URLs à traiter
     */
    async getArticlesToProcess(options = {}) {
        try {
            logger.debug('📡 Récupération des articles à traiter', 'CortexDataManager');

            const {
                limit = 100,
                onlyUnprocessed = true,
                orderBy = { created_at: 'DESC' }
            } = options;

            // Récupération des URLs d'articles (table simple avec url uniquement)
            const articleUrls = await this.articleUrlRepo.findAll({
                select: 'id, url, created_at',
                limit,
                order: { column: 'created_at', ascending: false }
            });

            // Si on veut seulement les non traités, filtrer ceux qui existent déjà dans articles
            let articlesToProcess = articleUrls;

            if (onlyUnprocessed) {
                const filteredArticles = [];

                for (const article of articleUrls) {
                    const alreadyProcessed = await this.isArticleProcessed(article.url);
                    if (!alreadyProcessed) {
                        filteredArticles.push(article);
                    } else {
                        this.stats.duplicatesSkipped++;
                    }
                }

                articlesToProcess = filteredArticles;
            }

            this.stats.queriesExecuted++;

            logger.info(`✅ ${articlesToProcess.length} articles à traiter récupérés (${this.stats.duplicatesSkipped} doublons ignorés)`, 'CortexDataManager');
            return articlesToProcess;

        } catch (error) {
            logger.error(`❌ Erreur récupération articles: ${error.message}`, 'CortexDataManager');
            throw error;
        }
    }

    /**
     * Vérifie si un article a déjà été traité (avec cache)
     * @param {string} articleUrl - URL de l'article
     * @returns {Promise<boolean>} true si l'article est déjà traité
     */
    async isArticleProcessed(articleUrl) {
        if (!articleUrl) return false;

        // Vérification du cache d'existence
        const cacheKey = `processed:${articleUrl}`;
        if (this.existenceCache.has(cacheKey)) {
            this.stats.cacheHits++;
            return this.existenceCache.get(cacheKey);
        }

        try {
            // Vérifier dans la table articles (articles traités)
            const exists = await this.articleRepo.exists({ url: articleUrl });

            // Mise en cache
            this.existenceCache.set(cacheKey, exists);
            this.stats.cacheMisses++;
            this.stats.queriesExecuted++;

            // Nettoyage du cache si trop volumineux
            if (this.existenceCache.size > 500) {
                this.cleanExistenceCache();
            }

            return exists;

        } catch (error) {
            logger.error(`❌ Erreur vérification article traité ${articleUrl}: ${error.message}`, 'CortexDataManager');
            return false;
        }
    }

    /**
     * Sauvegarde un article traité avec validation
     * @param {Object} articleData - Données de l'article traité
     * @returns {Promise<boolean>} true si sauvegardé avec succès
     */
    async saveProcessedArticle(articleData) {
        try {
            // Validation du contenu avant sauvegarde
            const validatedData = this.validateArticleData(articleData);
            if (!validatedData) {
                this.stats.validationFailures++;
                logger.warning(`⚠️ Article invalide ignoré: ${articleData.url}`, 'CortexDataManager');
                return false;
            }

            // Vérification des doublons
            if (DATABASE_CONFIG.SKIP_DUPLICATE_URLS) {
                const alreadyExists = await this.isArticleProcessed(validatedData.url);
                if (alreadyExists) {
                    this.stats.duplicatesSkipped++;
                    logger.debug(`🔁 Article déjà traité ignoré: ${validatedData.url}`, 'CortexDataManager');
                    return false;
                }
            }

            // Préparation des données pour la base
            const dbData = {
                url: validatedData.url,
                title: validatedData.title,
                content: validatedData.content,
                dateRecuperation: new Date().toISOString(),
                datePublication: validatedData.date || new Date().toISOString(),
                source: 'Cortex',
                metadata: {
                    author: validatedData.author,
                    extractedAt: validatedData.extractedAt,
                    contentLength: validatedData.content.length,
                    processingVersion: '2.0.0'
                }
            };

            // Insertion dans la base
            await this.articleRepo.create(dbData);

            // Mise à jour du cache d'existence
            this.existenceCache.set(`processed:${validatedData.url}`, true);

            this.stats.articlesInserted++;
            this.stats.queriesExecuted++;

            logger.debug(`✅ Article sauvegardé: ${validatedData.url}`, 'CortexDataManager');
            return true;

        } catch (error) {
            logger.error(`❌ Erreur sauvegarde article ${articleData.url}: ${error.message}`, 'CortexDataManager');
            return false;
        }
    }

    /**
     * Traite plusieurs articles en lot avec optimisations
     * @param {Array} articlesData - Tableau d'articles traités
     * @returns {Promise<Object>} Résultats du traitement
     */
    async saveBatchProcessedArticles(articlesData) {
        if (!Array.isArray(articlesData) || articlesData.length === 0) {
            return { saved: 0, skipped: 0, errors: 0 };
        }

        logger.info(`💾 Sauvegarde batch de ${articlesData.length} articles`, 'CortexDataManager');

        let saved = 0;
        let skipped = 0;
        let errors = 0;

        // Traitement par chunks pour optimiser les performances
        const chunks = this.chunkArray(articlesData, DATABASE_CONFIG.BATCH_INSERT_SIZE);

        for (const [chunkIndex, chunk] of chunks.entries()) {
            logger.debug(`📦 Traitement batch chunk ${chunkIndex + 1}/${chunks.length} (${chunk.length} articles)`, 'CortexDataManager');

            // Traitement en parallèle du chunk
            const promises = chunk.map(async (article) => {
                try {
                    const result = await this.saveProcessedArticle(article);
                    return { success: result, article };
                } catch (error) {
                    logger.warning(`⚠️ Erreur sauvegarde article ${article.url}: ${error.message}`, 'CortexDataManager');
                    return { success: false, article, error: error.message };
                }
            });

            const results = await Promise.allSettled(promises);

            // Comptage des résultats
            for (const result of results) {
                if (result.status === 'fulfilled') {
                    if (result.value.success) {
                        saved++;
                    } else {
                        skipped++;
                    }
                } else {
                    errors++;
                }
            }

            this.stats.batchesProcessed++;

            // Délai adaptatif entre les chunks
            if (chunkIndex < chunks.length - 1) {
                await new Promise(resolve => setTimeout(resolve, PERFORMANCE_CONFIG.PROCESSING_DELAY));
            }
        }

        const results = { saved, skipped, errors };
        logger.info(`✅ Batch traité: ${saved} sauvegardés, ${skipped} ignorés, ${errors} erreurs`, 'CortexDataManager');

        return results;
    }

    /**
     * Valide les données d'un article avant sauvegarde
     * @param {Object} articleData - Données à valider
     * @returns {Object|null} Données validées ou null si invalides
     */
    validateArticleData(articleData) {
        if (!articleData || typeof articleData !== 'object') {
            return null;
        }

        // Validation des champs requis
        if (!articleData.url || typeof articleData.url !== 'string') {
            logger.debug('❌ URL manquante ou invalide', 'CortexDataManager');
            return null;
        }

        if (!articleData.title || articleData.title.length < CONTENT_CONFIG.MIN_WORDS_COUNT) {
            logger.debug('❌ Titre manquant ou trop court', 'CortexDataManager');
            return null;
        }

        if (!articleData.content || articleData.content.length < CONTENT_CONFIG.MIN_WORDS_COUNT) {
            logger.debug('❌ Contenu manquant ou trop court', 'CortexDataManager');
            return null;
        }

        // Nettoyage et normalisation
        const cleanedData = {
            url: articleData.url.trim(),
            title: this.cleanText(articleData.title),
            content: this.cleanText(articleData.content),
            date: articleData.date || new Date().toISOString(),
            author: this.cleanText(articleData.author || ''),
            extractedAt: articleData.extractedAt || new Date().toISOString()
        };

        // Validation finale
        if (cleanedData.content.length > CONTENT_CONFIG.MAX_WORDS_COUNT) {
            cleanedData.content = cleanedData.content.substring(0, CONTENT_CONFIG.MAX_WORDS_COUNT) + '...';
        }

        return cleanedData;
    }

    /**
     * Nettoie un texte selon la configuration
     * @param {string} text - Texte à nettoyer
     * @returns {string} Texte nettoyé
     */
    cleanText(text) {
        if (!text || typeof text !== 'string') return '';

        let cleaned = text;

        if (CONTENT_CONFIG.CLEAN_HTML) {
            cleaned = cleaned.replace(/<[^>]*>/g, '');
        }

        if (CONTENT_CONFIG.NORMALIZE_WHITESPACE) {
            cleaned = cleaned.replace(/\s+/g, ' ').trim();
        }

        if (CONTENT_CONFIG.REMOVE_EMPTY_PARAGRAPHS) {
            cleaned = cleaned.replace(/\n\s*\n/g, '\n');
        }

        return cleaned;
    }

    /**
     * Test de connexion à la base de données
     */
    async testConnection() {
        try {
            await testSupabaseConnection();
            logger.info('✅ Connexion base de données Cortex OK', 'CortexDataManager');
            return true;
        } catch (error) {
            logger.error(`❌ Erreur connexion DB Cortex: ${error.message}`, 'CortexDataManager');
            throw error;
        }
    }

    /**
     * Nettoyage du cache d'existence
     */
    cleanExistenceCache() {
        // Garde seulement les 250 entrées les plus récentes
        const entries = Array.from(this.existenceCache.entries());
        this.existenceCache.clear();

        entries.slice(-250).forEach(([key, value]) => {
            this.existenceCache.set(key, value);
        });

        logger.debug('🧹 Cache d\'existence Cortex nettoyé', 'CortexDataManager');
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
     * Obtient les statistiques du gestionnaire
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
        this.pendingInserts = [];
        this.processingQueue = [];
        this.existenceCache.clear();
        this.contentCache.clear();
        this.isProcessingQueue = false;

        this.stats = {
            queriesExecuted: 0,
            articlesProcessed: 0,
            articlesInserted: 0,
            duplicatesSkipped: 0,
            validationFailures: 0,
            batchesProcessed: 0,
            cacheHits: 0,
            cacheMisses: 0
        };

        logger.info('🔄 CortexDataManager réinitialisé', 'CortexDataManager');
    }
}

// Instance singleton
const cortexDataManager = new CortexDataManager();

export { cortexDataManager };
export default CortexDataManager;
