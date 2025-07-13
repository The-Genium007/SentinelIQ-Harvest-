/**
 * 📊 Gestionnaire de performance et monitoring pour WireScanner
 * Optimise l'utilisation CPU/mémoire et fournit des métriques
 */

import { logger } from '../utils/logger.js';
import { PERFORMANCE_CONFIG, LOGGING_CONFIG } from './config.js';

class PerformanceManager {
    constructor() {
        this.metrics = {
            startTime: null,
            memoryUsage: [],
            cpuUsage: [],
            processedFeeds: 0,
            processedArticles: 0,
            errors: 0,
            cacheHits: 0,
            cacheMisses: 0
        };

        this.feedCache = new Map();
        this.gcInterval = null;
        this.isMonitoring = false;
    }

    /**
     * Démarre le monitoring des performances
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

        logger.info('📊 Monitoring des performances démarré', 'PerformanceManager');
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

        logger.info('📊 Monitoring arrêté', 'PerformanceManager');

        if (LOGGING_CONFIG.ENABLE_PERFORMANCE_LOGS) {
            this.logPerformanceReport(finalMetrics);
        }

        return finalMetrics;
    }

    /**
     * Monitoring de la mémoire en continu
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
                external: memUsage.external
            });

            // Alerte si usage mémoire élevé
            const memoryMB = memUsage.heapUsed / 1024 / 1024;
            if (memoryMB > PERFORMANCE_CONFIG.MEMORY_THRESHOLD) {
                logger.warning(`⚠️ Usage mémoire élevé: ${memoryMB.toFixed(2)}MB`, 'PerformanceManager');
                this.triggerGarbageCollection();
            }

        }, 10000); // Toutes les 10 secondes
    }

    /**
     * Garbage collection forcé périodique
     */
    startGarbageCollection() {
        this.gcInterval = setInterval(() => {
            if (global.gc) {
                global.gc();
                logger.debug('🗑️ Garbage collection forcé', 'PerformanceManager');
            }
        }, PERFORMANCE_CONFIG.GC_INTERVAL);
    }

    /**
     * Déclenche un garbage collection immédiat
     */
    triggerGarbageCollection() {
        if (global.gc) {
            global.gc();
            logger.debug('🗑️ GC forcé (seuil mémoire atteint)', 'PerformanceManager');
        }
    }

    /**
     * Cache intelligent pour les flux RSS
     */
    getFeedFromCache(url) {
        const cached = this.feedCache.get(url);
        if (cached && (Date.now() - cached.timestamp) < PERFORMANCE_CONFIG.FEED_CACHE_TTL) {
            this.metrics.cacheHits++;
            return cached.data;
        }
        this.metrics.cacheMisses++;
        return null;
    }

    /**
     * Met en cache un flux RSS
     */
    cacheFeed(url, data) {
        this.feedCache.set(url, {
            data,
            timestamp: Date.now()
        });

        // Nettoyage du cache si trop volumineux
        if (this.feedCache.size > 100) {
            const oldestKey = this.feedCache.keys().next().value;
            this.feedCache.delete(oldestKey);
        }
    }

    /**
     * Contrôle de flux pour limiter la concurrence
     */
    async throttle(fn, concurrencyLimit) {
        const semaphore = new Array(concurrencyLimit).fill(Promise.resolve());
        let index = 0;

        return async function (...args) {
            const currentIndex = index;
            index = (index + 1) % concurrencyLimit;

            await semaphore[currentIndex];

            try {
                const result = await fn.apply(this, args);
                semaphore[currentIndex] = Promise.resolve();
                return result;
            } catch (error) {
                semaphore[currentIndex] = Promise.resolve();
                throw error;
            }
        };
    }

    /**
     * Délai optimisé entre les opérations
     */
    async smartDelay(baseDelay = PERFORMANCE_CONFIG.ARTICLE_BATCH_DELAY) {
        const memUsage = process.memoryUsage();
        const memoryMB = memUsage.heapUsed / 1024 / 1024;

        // Augmente le délai si la mémoire est élevée
        const adaptiveDelay = memoryMB > PERFORMANCE_CONFIG.MEMORY_THRESHOLD
            ? baseDelay * 2
            : baseDelay;

        await new Promise(resolve => setTimeout(resolve, adaptiveDelay));
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
     * Obtient les métriques finales
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
            processing: {
                feedsProcessed: this.metrics.processedFeeds,
                articlesProcessed: this.metrics.processedArticles,
                errors: this.metrics.errors,
                feedsPerSecond: this.metrics.processedFeeds / (duration / 1000),
                articlesPerSecond: this.metrics.processedArticles / (duration / 1000)
            },
            cache: {
                hits: this.metrics.cacheHits,
                misses: this.metrics.cacheMisses,
                hitRate: this.metrics.cacheHits + this.metrics.cacheMisses > 0
                    ? (this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses) * 100).toFixed(2)
                    : 0
            }
        };
    }

    /**
     * Formate la durée en format lisible
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
     * Log détaillé des performances
     */
    logPerformanceReport(metrics) {
        logger.info('📊 === RAPPORT DE PERFORMANCE ===', 'PerformanceManager');
        logger.info(`⏱️ Durée: ${metrics.durationFormatted}`, 'PerformanceManager');
        logger.info(`🧠 Mémoire - Pic: ${metrics.memory.peak.toFixed(2)}MB, Finale: ${metrics.memory.final.toFixed(2)}MB`, 'PerformanceManager');
        logger.info(`📈 Processing - Flux: ${metrics.processing.feedsProcessed}, Articles: ${metrics.processing.articlesProcessed}`, 'PerformanceManager');
        logger.info(`🚀 Vitesse - ${metrics.processing.feedsPerSecond.toFixed(2)} flux/s, ${metrics.processing.articlesPerSecond.toFixed(2)} articles/s`, 'PerformanceManager');
        logger.info(`💾 Cache - Taux de réussite: ${metrics.cache.hitRate}%`, 'PerformanceManager');

        if (metrics.processing.errors > 0) {
            logger.warning(`⚠️ Erreurs: ${metrics.processing.errors}`, 'PerformanceManager');
        }
    }

    /**
     * Remet à zéro les métriques
     */
    resetMetrics() {
        this.metrics = {
            startTime: null,
            memoryUsage: [],
            cpuUsage: [],
            processedFeeds: 0,
            processedArticles: 0,
            errors: 0,
            cacheHits: 0,
            cacheMisses: 0
        };
        this.feedCache.clear();
    }
}

// Instance singleton
const performanceManager = new PerformanceManager();

export { performanceManager };
export default PerformanceManager;
