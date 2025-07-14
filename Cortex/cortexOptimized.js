/**
 * 🚀 Module principal optimisé pour Cortex v2.0
 * Orchestrateur intelligent pour le scraping d'articles avec Puppeteer
 * Version optimisée pour performances CPU/mémoire maximales
 */

import { logger } from '../utils/logger.js';
import { cortexPerformanceManager } from './performanceManager.js';
import { cortexDataManager } from './dataManager.js';
import { scrapingEngine } from './scrapingEngine.js';
import { contentProcessor } from './contentProcessor.js';
import { SCRAPING_CONFIG, PERFORMANCE_CONFIG, LOGGING_CONFIG } from './config.js';

class CortexOptimized {
    constructor() {
        this.isRunning = false;
        this.isPaused = false;
        this.currentSession = null;

        this.stats = {
            sessionsCompleted: 0,
            totalArticlesProcessed: 0,
            totalArticlesScraped: 0,
            totalErrors: 0,
            averageSessionTime: 0,
            lastSessionResults: null,
            startTime: null,
            totalRunTime: 0
        };

        this.errorHistory = [];
        this.sessionHistory = [];
    }

    /**
     * Lance une session de scraping optimisée
     * @param {Object} options - Options de configuration
     * @returns {Promise<Object>} Résultats de la session
     */
    async startScrapingSession(options = {}) {
        if (this.isRunning) {
            logger.warning('⚠️ Session Cortex déjà en cours', 'CortexOptimized');
            return { success: false, error: 'Session already running' };
        }

        const sessionId = `cortex-${Date.now()}`;
        const sessionStart = Date.now();

        this.isRunning = true;
        this.isPaused = false;
        this.stats.startTime = sessionStart;

        logger.info(`🚀 Démarrage session Cortex optimisée: ${sessionId}`, 'CortexOptimized');

        try {
            // Configuration de la session
            const sessionConfig = {
                maxArticles: 100,
                onlyUnprocessed: true,
                enableBatching: true,
                enableCaching: true,
                enablePerformanceMonitoring: true,
                ...options
            };

            // Initialisation des services
            await this.initializeServices();

            // Démarrage du monitoring
            if (sessionConfig.enablePerformanceMonitoring) {
                cortexPerformanceManager.startSession(sessionId);
            }

            // Récupération des articles à traiter
            const articlesToProcess = await this.getArticlesToProcess(sessionConfig);

            if (articlesToProcess.length === 0) {
                logger.info('📭 Aucun article à traiter', 'CortexOptimized');
                return this.completeSession(sessionId, sessionStart, { processed: 0, scraped: 0 });
            }

            logger.info(`📋 ${articlesToProcess.length} articles à traiter`, 'CortexOptimized');

            // Traitement des articles par chunks
            const results = await this.processArticlesInBatches(articlesToProcess, sessionConfig);

            // Finalisation de la session
            const sessionResults = await this.completeSession(sessionId, sessionStart, results);

            return sessionResults;

        } catch (error) {
            logger.error(`❌ Erreur session Cortex ${sessionId}: ${error.message}`, 'CortexOptimized');
            this.handleSessionError(sessionId, error);
            return { success: false, error: error.message, sessionId };
        } finally {
            this.isRunning = false;
            this.currentSession = null;
        }
    }

    /**
     * Initialise tous les services nécessaires
     */
    async initializeServices() {
        logger.debug('🔧 Initialisation services Cortex', 'CortexOptimized');

        // Test de connexion à la base de données
        await cortexDataManager.testConnection();

        // Initialisation du moteur de scraping
        await scrapingEngine.initialize();

        // Vérification des performances système
        const systemStatus = cortexPerformanceManager.getSystemStatus();
        if (systemStatus.memoryUsage > 80) {
            logger.warning(`⚠️ Utilisation mémoire élevée: ${systemStatus.memoryUsage}%`, 'CortexOptimized');
        }

        if (systemStatus.cpuUsage > 80) {
            logger.warning(`⚠️ Utilisation CPU élevée: ${systemStatus.cpuUsage}%`, 'CortexOptimized');
        }

        logger.debug('✅ Services Cortex initialisés', 'CortexOptimized');
    }

    /**
     * Récupère les articles à traiter
     * @param {Object} config - Configuration de session
     * @returns {Promise<Array>} Articles à traiter
     */
    async getArticlesToProcess(config) {
        return await cortexDataManager.getArticlesToProcess({
            limit: config.maxArticles,
            onlyUnprocessed: config.onlyUnprocessed,
            orderBy: { created_at: 'DESC' }
        });
    }

    /**
     * Traite les articles par lots avec optimisations
     * @param {Array} articles - Articles à traiter
     * @param {Object} config - Configuration
     * @returns {Promise<Object>} Résultats du traitement
     */
    async processArticlesInBatches(articles, config) {
        const results = {
            processed: 0,
            scraped: 0,
            failed: 0,
            skipped: 0,
            batches: 0,
            errors: []
        };

        // Division en chunks optimaux
        const chunks = this.createOptimalChunks(articles);
        logger.info(`📦 Traitement en ${chunks.length} batches`, 'CortexOptimized');

        for (const [chunkIndex, chunk] of chunks.entries()) {
            if (this.isPaused) {
                logger.info('⏸️ Session Cortex en pause', 'CortexOptimized');
                break;
            }

            const batchId = `batch-${chunkIndex + 1}`;
            logger.info(`🔄 Traitement ${batchId} (${chunk.length} articles)`, 'CortexOptimized');

            try {
                // Monitoring avant batch
                const batchStart = Date.now();
                cortexPerformanceManager.startBatch(batchId);

                // Traitement du batch
                const batchResults = await this.processBatch(chunk, config);

                // Agrégation des résultats
                results.processed += batchResults.processed;
                results.scraped += batchResults.scraped;
                results.failed += batchResults.failed;
                results.skipped += batchResults.skipped;
                results.batches++;

                if (batchResults.errors && batchResults.errors.length > 0) {
                    results.errors.push(...batchResults.errors);
                }

                // Monitoring après batch
                const batchTime = Date.now() - batchStart;
                cortexPerformanceManager.endBatch(batchId, batchResults);

                logger.info(`✅ ${batchId} terminé en ${batchTime}ms: ${batchResults.scraped}/${batchResults.processed} scraped`, 'CortexOptimized');

                // Gestion adaptative des délais
                await this.adaptiveDelay(chunkIndex, chunks.length, batchTime);

                // Vérification des ressources système
                await this.checkSystemResources();

            } catch (error) {
                logger.error(`❌ Erreur batch ${batchId}: ${error.message}`, 'CortexOptimized');
                results.failed += chunk.length;
                results.errors.push({ batch: batchId, error: error.message, urls: chunk.map(a => a.url) });

                cortexPerformanceManager.recordError(error);
            }
        }

        return results;
    }

    /**
     * Traite un lot d'articles
     * @param {Array} articles - Articles du lot
     * @param {Object} config - Configuration
     * @returns {Promise<Object>} Résultats du lot
     */
    async processBatch(articles, config) {
        const batchResults = {
            processed: 0,
            scraped: 0,
            failed: 0,
            skipped: 0,
            errors: []
        };

        // Traitement concurrent avec limitation
        const concurrentLimit = Math.min(
            PERFORMANCE_CONFIG.MAX_CONCURRENT_ARTICLES,
            Math.ceil(articles.length / 2)
        );

        const chunks = this.chunkArray(articles, concurrentLimit);

        for (const chunk of chunks) {
            const promises = chunk.map(async (article) => {
                try {
                    const result = await this.processArticle(article, config);
                    return { success: true, result, article };
                } catch (error) {
                    return { success: false, error: error.message, article };
                }
            });

            const chunkResults = await Promise.allSettled(promises);

            // Traitement des résultats
            for (const promiseResult of chunkResults) {
                if (promiseResult.status === 'fulfilled') {
                    const { success, result, article, error } = promiseResult.value;

                    batchResults.processed++;

                    if (success && result) {
                        if (result.scraped) {
                            batchResults.scraped++;
                        } else {
                            batchResults.skipped++;
                        }
                    } else {
                        batchResults.failed++;
                        batchResults.errors.push({
                            url: article.url,
                            error: error || 'Unknown error'
                        });
                    }
                } else {
                    batchResults.failed++;
                    batchResults.errors.push({
                        url: 'unknown',
                        error: promiseResult.reason?.message || 'Promise rejected'
                    });
                }
            }
        }

        return batchResults;
    }

    /**
     * Traite un article individuel
     * @param {Object} article - Article à traiter
     * @param {Object} config - Configuration
     * @returns {Promise<Object>} Résultat du traitement
     */
    async processArticle(article, config) {
        const articleStart = Date.now();

        try {
            logger.debug(`🔍 Traitement article: ${article.url}`, 'CortexOptimized');

            // Scraping du contenu avec le moteur optimisé
            const scrapedContent = await scrapingEngine.scrapeArticle(article.url, {
                waitForContent: true,
                extractMetadata: true,
                enableCache: config.enableCaching
            });

            if (!scrapedContent) {
                logger.debug(`⚠️ Échec scraping: ${article.url}`, 'CortexOptimized');
                return { scraped: false, reason: 'Scraping failed' };
            }

            // Enrichissement avec les données de l'article original
            const enrichedContent = {
                ...scrapedContent,
                originalTitle: article.titre,
                originalDescription: article.description,
                originalDate: article.datePublication,
                processingTime: Date.now() - articleStart
            };

            // Sauvegarde en base
            const saved = await cortexDataManager.saveProcessedArticle(enrichedContent);

            if (saved) {
                this.stats.totalArticlesScraped++;
                logger.debug(`✅ Article sauvegardé: ${article.url}`, 'CortexOptimized');
                return { scraped: true, saved: true, content: enrichedContent };
            } else {
                logger.debug(`⚠️ Article non sauvegardé: ${article.url}`, 'CortexOptimized');
                return { scraped: true, saved: false, content: enrichedContent };
            }

        } catch (error) {
            const processingTime = Date.now() - articleStart;
            logger.warning(`⚠️ Erreur traitement article ${article.url} (${processingTime}ms): ${error.message}`, 'CortexOptimized');

            this.stats.totalErrors++;
            this.errorHistory.push({
                url: article.url,
                error: error.message,
                timestamp: new Date().toISOString(),
                processingTime
            });

            throw error;
        }
    }

    /**
     * Crée des chunks optimaux selon les ressources disponibles
     * @param {Array} articles - Articles à diviser
     * @returns {Array} Chunks optimisés
     */
    createOptimalChunks(articles) {
        const systemStatus = cortexPerformanceManager.getSystemStatus();

        let chunkSize = PERFORMANCE_CONFIG.MAX_CONCURRENT_ARTICLES;

        // Adaptation selon les ressources système
        if (systemStatus.memoryUsage > 70) {
            chunkSize = Math.max(1, Math.floor(chunkSize * 0.7));
            logger.debug(`📉 Taille chunk réduite pour mémoire: ${chunkSize}`, 'CortexOptimized');
        }

        if (systemStatus.cpuUsage > 70) {
            chunkSize = Math.max(1, Math.floor(chunkSize * 0.8));
            logger.debug(`📉 Taille chunk réduite pour CPU: ${chunkSize}`, 'CortexOptimized');
        }

        return this.chunkArray(articles, chunkSize);
    }

    /**
     * Gère les délais adaptatifs entre les batches
     * @param {number} chunkIndex - Index du chunk actuel
     * @param {number} totalChunks - Nombre total de chunks
     * @param {number} processingTime - Temps de traitement du batch
     */
    async adaptiveDelay(chunkIndex, totalChunks, processingTime) {
        if (chunkIndex >= totalChunks - 1) return;

        let delay = PERFORMANCE_CONFIG.PROCESSING_DELAY;

        // Adaptation selon le temps de traitement
        if (processingTime > 30000) { // Plus de 30 secondes
            delay *= 2;
        } else if (processingTime < 10000) { // Moins de 10 secondes
            delay *= 0.5;
        }

        // Adaptation selon les ressources système
        const systemStatus = cortexPerformanceManager.getSystemStatus();
        if (systemStatus.memoryUsage > 80 || systemStatus.cpuUsage > 80) {
            delay *= 3;
            logger.debug(`⏳ Délai augmenté pour ressources: ${delay}ms`, 'CortexOptimized');
        }

        await new Promise(resolve => setTimeout(resolve, delay));
    }

    /**
     * Vérifie les ressources système et applique les adaptations
     */
    async checkSystemResources() {
        const status = cortexPerformanceManager.getSystemStatus();

        if (status.memoryUsage > 85) {
            logger.warning(`🔥 Mémoire critique: ${status.memoryUsage}%`, 'CortexOptimized');

            // Nettoyage forcé
            if (global.gc) {
                global.gc();
                logger.debug('🧹 Garbage collection forcé', 'CortexOptimized');
            }

            // Pause temporaire
            await new Promise(resolve => setTimeout(resolve, 5000));
        }

        if (status.cpuUsage > 90) {
            logger.warning(`🔥 CPU critique: ${status.cpuUsage}%`, 'CortexOptimized');
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
    }

    /**
     * Complète une session et génère le rapport
     * @param {string} sessionId - ID de la session
     * @param {number} sessionStart - Timestamp de début
     * @param {Object} results - Résultats de la session
     * @returns {Object} Rapport final de session
     */
    async completeSession(sessionId, sessionStart, results) {
        const sessionTime = Date.now() - sessionStart;

        // Finalisation du monitoring
        const monitoringResults = cortexPerformanceManager.endSession(sessionId);

        // Nettoyage des ressources
        await scrapingEngine.cleanup();

        // Mise à jour des statistiques globales
        this.stats.sessionsCompleted++;
        this.stats.totalArticlesProcessed += results.processed || 0;
        this.stats.totalRunTime += sessionTime;
        this.stats.averageSessionTime = this.stats.totalRunTime / this.stats.sessionsCompleted;
        this.stats.lastSessionResults = results;

        // Création du rapport de session
        const sessionReport = {
            sessionId,
            success: true,
            duration: sessionTime,
            results: {
                articlesProcessed: results.processed || 0,
                articlesScraped: results.scraped || 0,
                articlesFailed: results.failed || 0,
                articlesSkipped: results.skipped || 0,
                batchesProcessed: results.batches || 0,
                errors: results.errors || []
            },
            performance: {
                averageTimePerArticle: results.processed > 0 ? sessionTime / results.processed : 0,
                successRate: results.processed > 0 ? (results.scraped / results.processed) * 100 : 0,
                systemResources: cortexPerformanceManager.getSystemStatus(),
                ...monitoringResults
            },
            timestamp: new Date().toISOString()
        };

        // Ajout à l'historique
        this.sessionHistory.push(sessionReport);

        // Limitation de l'historique
        if (this.sessionHistory.length > 10) {
            this.sessionHistory = this.sessionHistory.slice(-10);
        }

        logger.info(`🎉 Session ${sessionId} terminée en ${sessionTime}ms: ${results.scraped}/${results.processed} articles`, 'CortexOptimized');

        return sessionReport;
    }

    /**
     * Gère les erreurs de session
     * @param {string} sessionId - ID de la session
     * @param {Error} error - Erreur rencontrée
     */
    handleSessionError(sessionId, error) {
        this.stats.totalErrors++;

        const errorReport = {
            sessionId,
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        };

        this.errorHistory.push(errorReport);

        // Limitation de l'historique d'erreurs
        if (this.errorHistory.length > 50) {
            this.errorHistory = this.errorHistory.slice(-50);
        }

        cortexPerformanceManager.recordError(error);
    }

    /**
     * Met en pause la session en cours
     */
    pauseSession() {
        if (this.isRunning) {
            this.isPaused = true;
            logger.info('⏸️ Session Cortex mise en pause', 'CortexOptimized');
        }
    }

    /**
     * Reprend la session en pause
     */
    resumeSession() {
        if (this.isRunning && this.isPaused) {
            this.isPaused = false;
            logger.info('▶️ Session Cortex reprise', 'CortexOptimized');
        }
    }

    /**
     * Arrête la session en cours
     */
    async stopSession() {
        if (this.isRunning) {
            logger.info('🛑 Arrêt session Cortex', 'CortexOptimized');
            this.isPaused = false;
            this.isRunning = false;

            await scrapingEngine.cleanup();
            cortexPerformanceManager.forceEndSession();
        }
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
     * Obtient les statistiques complètes
     */
    getFullStats() {
        return {
            global: this.stats,
            performance: cortexPerformanceManager.getStats(),
            dataManager: cortexDataManager.getStats(),
            scrapingEngine: scrapingEngine.getStats(),
            contentProcessor: contentProcessor.getStats(),
            system: cortexPerformanceManager.getSystemStatus(),
            isRunning: this.isRunning,
            isPaused: this.isPaused,
            recentErrors: this.errorHistory.slice(-5),
            recentSessions: this.sessionHistory.slice(-3)
        };
    }

    /**
     * Remet à zéro toutes les statistiques
     */
    async reset() {
        await this.stopSession();

        this.stats = {
            sessionsCompleted: 0,
            totalArticlesProcessed: 0,
            totalArticlesScraped: 0,
            totalErrors: 0,
            averageSessionTime: 0,
            lastSessionResults: null,
            startTime: null,
            totalRunTime: 0
        };

        this.errorHistory = [];
        this.sessionHistory = [];

        // Reset des autres services
        await cortexDataManager.reset();
        await scrapingEngine.reset();
        contentProcessor.reset();
        cortexPerformanceManager.reset();

        logger.info('🔄 CortexOptimized réinitialisé', 'CortexOptimized');
    }
}

// Instance singleton
const cortexOptimized = new CortexOptimized();

export { cortexOptimized };
export default CortexOptimized;
