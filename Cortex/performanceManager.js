/**
 * 📊 Gestionnaire de performance et monitoring pour Cortex
 * Optimise l'utilisation CPU/mémoire spécifiquement pour le scraping d'articles
 */

import { logger } from '../utils/logger.js';
import { PERFORMANCE_CONFIG, LOGGING_CONFIG } from './config.js';

class CortexPerformanceManager {
    constructor() {
        this.metrics = {
            startTime: null,
            memoryUsage: [],
            cpuUsage: [],
            processedArticles: 0,
            successfulScrapes: 0,
            failedScrapes: 0,
            cacheHits: 0,
            cacheMisses: 0,
            totalScrapingTime: 0,
            averageScrapingTime: 0,
            browserInstances: 0,
            maxBrowserInstances: 0
        };

        this.articleCache = new Map();
        this.browserPool = [];
        this.activeBrowsers = new Set();
        this.gcInterval = null;
        this.isMonitoring = false;
        this.scrapingTimes = [];
    }

    /**
     * Démarre le monitoring spécialisé pour Cortex
     */
    startMonitoring() {
        this.isMonitoring = true;
        this.metrics.startTime = Date.now();

        if (LOGGING_CONFIG.ENABLE_MEMORY_MONITORING) {
            this.startMemoryMonitoring();
        }

        if (PERFORMANCE_CONFIG.GC_INTERVAL > 0) {
            this.startGarbageCollection();
        }

        logger.info('📊 Monitoring Cortex démarré', 'CortexPerformanceManager');
    }

    /**
     * Démarre le monitoring global (alias pour startMonitoring)
     */
    startGlobalMonitoring() {
        return this.startMonitoring();
    }

    /**
     * Démarre une session de monitoring
     */
    startSession(sessionId) {
        this.metrics.startTime = Date.now();
        this.isMonitoring = true;
        logger.debug(`📊 Session monitoring démarrée: ${sessionId}`, 'CortexPerformanceManager');
    }

    /**
     * Enregistre une erreur dans les métriques
     */
    recordError(error, context = '') {
        this.metrics.failedScrapes++;
        logger.error(`❌ Erreur enregistrée: ${error.message} ${context}`, 'CortexPerformanceManager');
    }

    /**
     * Démarre le suivi d'un batch de scraping
     */
    startBatch(batchId) {
        logger.debug(`📦 Démarrage batch: ${batchId}`, 'CortexPerformanceManager');
    }

    /**
     * Termine un batch de scraping
     */
    endBatch(batchId) {
        logger.debug(`✅ Batch terminé: ${batchId}`, 'CortexPerformanceManager');
    }

    /**
     * Termine une session de monitoring
     */
    endSession(sessionId) {
        const endTime = Date.now();
        const sessionDuration = this.metrics.startTime ? endTime - this.metrics.startTime : 0;
        this.metrics.totalScrapingTime += sessionDuration;

        logger.info(`⏱️ Session ${sessionId} terminée (${sessionDuration}ms)`, 'CortexPerformanceManager');
    }

    /**
     * Arrête le monitoring et retourne les métriques finales
     */
    stopMonitoring() {
        this.isMonitoring = false;

        if (this.gcInterval) {
            clearInterval(this.gcInterval);
            this.gcInterval = null;
        }

        const duration = Date.now() - this.metrics.startTime;
        const finalMetrics = this.getFinalMetrics(duration);

        logger.info('📊 Monitoring Cortex arrêté', 'CortexPerformanceManager');

        if (LOGGING_CONFIG.ENABLE_PERFORMANCE_LOGS) {
            this.logPerformanceReport(finalMetrics);
        }

        return finalMetrics;
    }

    /**
     * Monitoring mémoire spécialisé pour Puppeteer
     */
    startMemoryMonitoring() {
        const interval = setInterval(() => {
            if (!this.isMonitoring) {
                clearInterval(interval);
                return;
            }

            const memUsage = process.memoryUsage();
            this.metrics.memoryUsage.push({
                timestamp: Date.now(),
                rss: memUsage.rss,
                heapUsed: memUsage.heapUsed,
                heapTotal: memUsage.heapTotal,
                external: memUsage.external,
                activeBrowsers: this.activeBrowsers.size
            });

            // Alerte si usage mémoire élevé (Puppeteer consomme beaucoup)
            const memoryMB = memUsage.heapUsed / 1024 / 1024;
            if (memoryMB > PERFORMANCE_CONFIG.MEMORY_THRESHOLD) {
                logger.warning(`⚠️ Usage mémoire élevé Cortex: ${memoryMB.toFixed(2)}MB`, 'CortexPerformanceManager');
                this.triggerMemoryOptimization();
            }

        }, 15000); // Toutes les 15 secondes (plus fréquent pour Puppeteer)
    }

    /**
     * Optimisation mémoire spécifique à Cortex
     */
    async triggerMemoryOptimization() {
        // Fermer les navigateurs inactifs
        if (this.browserPool.length > 1) {
            const browser = this.browserPool.pop();
            if (browser) {
                try {
                    await browser.close();
                    logger.debug('🗑️ Navigateur inactif fermé pour optimisation mémoire', 'CortexPerformanceManager');
                } catch (error) {
                    logger.warning(`⚠️ Erreur fermeture navigateur: ${error.message}`, 'CortexPerformanceManager');
                }
            }
        }

        // Nettoyage du cache si trop volumineux
        if (this.articleCache.size > 50) {
            this.cleanArticleCache();
        }

        // Garbage collection forcé
        this.triggerGarbageCollection();
    }

    /**
     * Garbage collection spécialisé pour Cortex
     */
    startGarbageCollection() {
        this.gcInterval = setInterval(() => {
            if (global.gc) {
                global.gc();
                logger.debug('🗑️ GC forcé Cortex', 'CortexPerformanceManager');
            }
        }, PERFORMANCE_CONFIG.GC_INTERVAL);
    }

    /**
     * Cache intelligent pour les articles scrapés
     */
    getArticleFromCache(url) {
        const cached = this.articleCache.get(url);
        if (cached && (Date.now() - cached.timestamp) < PERFORMANCE_CONFIG.ARTICLE_CACHE_TTL) {
            this.metrics.cacheHits++;
            return cached.data;
        }
        this.metrics.cacheMisses++;
        return null;
    }

    /**
     * Met en cache un article scrapé
     */
    cacheArticle(url, data) {
        this.articleCache.set(url, {
            data,
            timestamp: Date.now(),
            size: JSON.stringify(data).length
        });

        // Nettoyage si cache trop volumineux
        if (this.articleCache.size > 100) {
            this.cleanArticleCache();
        }
    }

    /**
     * Nettoyage intelligent du cache d'articles
     */
    cleanArticleCache() {
        // Supprime les 20% les plus anciens
        const entries = Array.from(this.articleCache.entries());
        const toDelete = Math.floor(entries.length * 0.2);

        entries
            .sort((a, b) => a[1].timestamp - b[1].timestamp)
            .slice(0, toDelete)
            .forEach(([key]) => this.articleCache.delete(key));

        logger.debug(`🧹 Cache articles nettoyé: ${toDelete} entrées supprimées`, 'CortexPerformanceManager');
    }

    /**
     * Enregistre le temps de scraping d'un article
     */
    recordScrapingTime(duration) {
        this.scrapingTimes.push(duration);
        this.metrics.totalScrapingTime += duration;
        this.metrics.averageScrapingTime = this.metrics.totalScrapingTime / this.scrapingTimes.length;
    }

    /**
     * Suivi des instances de navigateur
     */
    trackBrowserInstance(action) {
        if (action === 'create') {
            this.metrics.browserInstances++;
            this.metrics.maxBrowserInstances = Math.max(
                this.metrics.maxBrowserInstances,
                this.metrics.browserInstances
            );
        } else if (action === 'close') {
            this.metrics.browserInstances = Math.max(0, this.metrics.browserInstances - 1);
        }
    }

    /**
     * Délai adaptatif pour le scraping
     */
    async adaptiveScrapingDelay() {
        const memUsage = process.memoryUsage();
        const memoryMB = memUsage.heapUsed / 1024 / 1024;
        const activeBrowserCount = this.activeBrowsers.size;

        // Calcul du délai basé sur la charge
        let delay = PERFORMANCE_CONFIG.NAVIGATION_DELAY;

        if (memoryMB > PERFORMANCE_CONFIG.MEMORY_THRESHOLD * 0.8) {
            delay *= 2; // Double le délai si mémoire élevée
        }

        if (activeBrowserCount >= PERFORMANCE_CONFIG.MAX_CONCURRENT_BROWSERS) {
            delay *= 1.5; // Augmente le délai si beaucoup de navigateurs actifs
        }

        await new Promise(resolve => setTimeout(resolve, delay));
    }

    /**
     * Obtient les métriques finales spécialisées Cortex
     */
    getFinalMetrics(duration) {
        const memUsage = process.memoryUsage();

        return {
            duration: duration,
            durationFormatted: this.formatDuration(duration),
            memory: {
                peak: Math.max(...this.metrics.memoryUsage.map(m => m.heapUsed)) / 1024 / 1024,
                final: memUsage.heapUsed / 1024 / 1024,
                average: this.metrics.memoryUsage.length > 0
                    ? this.metrics.memoryUsage.reduce((sum, m) => sum + m.heapUsed, 0) / this.metrics.memoryUsage.length / 1024 / 1024
                    : 0
            },
            scraping: {
                articlesProcessed: this.metrics.processedArticles,
                successfulScrapes: this.metrics.successfulScrapes,
                failedScrapes: this.metrics.failedScrapes,
                successRate: this.metrics.processedArticles > 0
                    ? (this.metrics.successfulScrapes / this.metrics.processedArticles * 100).toFixed(2)
                    : 0,
                averageScrapingTime: this.metrics.averageScrapingTime.toFixed(2),
                articlesPerSecond: this.metrics.processedArticles / (duration / 1000),
            },
            browser: {
                maxInstances: this.metrics.maxBrowserInstances,
                finalInstances: this.metrics.browserInstances,
                poolSize: this.browserPool.length
            },
            cache: {
                hits: this.metrics.cacheHits,
                misses: this.metrics.cacheMisses,
                hitRate: this.metrics.cacheHits + this.metrics.cacheMisses > 0
                    ? (this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses) * 100).toFixed(2)
                    : 0,
                size: this.articleCache.size
            }
        };
    }

    /**
     * Log spécialisé pour les performances Cortex
     */
    logPerformanceReport(metrics) {
        logger.info('📊 === RAPPORT PERFORMANCE CORTEX ===', 'CortexPerformanceManager');
        logger.info(`⏱️ Durée: ${metrics.durationFormatted}`, 'CortexPerformanceManager');
        logger.info(`🧠 Mémoire - Pic: ${metrics.memory.peak.toFixed(2)}MB, Finale: ${metrics.memory.final.toFixed(2)}MB`, 'CortexPerformanceManager');
        logger.info(`🕷️ Scraping - ${metrics.scraping.articlesProcessed} articles, ${metrics.scraping.successRate}% succès`, 'CortexPerformanceManager');
        logger.info(`⚡ Vitesse - ${metrics.scraping.articlesPerSecond.toFixed(2)} articles/s, ${metrics.scraping.averageScrapingTime}ms/article`, 'CortexPerformanceManager');
        logger.info(`🌐 Navigateurs - Max: ${metrics.browser.maxInstances}, Pool: ${metrics.browser.poolSize}`, 'CortexPerformanceManager');
        logger.info(`💾 Cache - Taux: ${metrics.cache.hitRate}%, Taille: ${metrics.cache.size}`, 'CortexPerformanceManager');

        if (metrics.scraping.failedScrapes > 0) {
            logger.warning(`⚠️ Échecs: ${metrics.scraping.failedScrapes}`, 'CortexPerformanceManager');
        }
    }

    /**
     * Incrémente les compteurs de métriques
     */
    incrementMetric(metric, value = 1) {
        if (this.metrics[metric] !== undefined) {
            this.metrics[metric] += value;
        }
    }

    /**
     * Formate la durée
     */
    formatDuration(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
        if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
        return `${seconds}s`;
    }

    /**
     * Remet à zéro les métriques
     */
    resetMetrics() {
        this.metrics = {
            startTime: null,
            memoryUsage: [],
            cpuUsage: [],
            processedArticles: 0,
            successfulScrapes: 0,
            failedScrapes: 0,
            cacheHits: 0,
            cacheMisses: 0,
            totalScrapingTime: 0,
            averageScrapingTime: 0,
            browserInstances: 0,
            maxBrowserInstances: 0
        };

        this.articleCache.clear();
        this.scrapingTimes = [];
    }

    /**
     * Nettoyage complet des ressources
     */
    async cleanup() {
        // Fermer tous les navigateurs du pool
        for (const browser of this.browserPool) {
            try {
                await browser.close();
            } catch (error) {
                logger.warning(`⚠️ Erreur fermeture navigateur pool: ${error.message}`, 'CortexPerformanceManager');
            }
        }

        this.browserPool = [];
        this.activeBrowsers.clear();
        this.articleCache.clear();

        if (this.gcInterval) {
            clearInterval(this.gcInterval);
            this.gcInterval = null;
        }

        logger.info('🧹 Ressources Cortex nettoyées', 'CortexPerformanceManager');
    }

    /**
     * Force un garbage collection
     */
    triggerGarbageCollection() {
        if (global.gc) {
            global.gc();
            logger.debug('🗑️ GC forcé Cortex (seuil atteint)', 'CortexPerformanceManager');
        }
    }

    /**
     * Obtient les statistiques de performance
     */
    getStats() {
        const now = Date.now();
        const uptime = this.metrics.startTime ? now - this.metrics.startTime : 0;

        return {
            ...this.metrics,
            uptime,
            avgScrapingTime: this.scrapingTimes.length > 0
                ? this.scrapingTimes.reduce((a, b) => a + b, 0) / this.scrapingTimes.length
                : 0,
            activeBrowsersCount: this.activeBrowsers.size,
            cacheSize: this.articleCache.size,
            isMonitoring: this.isMonitoring
        };
    }

    /**
     * Obtient le statut système
     */
    getSystemStatus() {
        const memUsage = process.memoryUsage();
        return {
            memory: {
                rss: memUsage.rss,
                heapUsed: memUsage.heapUsed,
                heapTotal: memUsage.heapTotal,
                external: memUsage.external
            },
            uptime: process.uptime(),
            pid: process.pid,
            platform: process.platform,
            nodeVersion: process.version
        };
    }
}

// Instance singleton
const cortexPerformanceManager = new CortexPerformanceManager();

export { cortexPerformanceManager };
export default CortexPerformanceManager;
