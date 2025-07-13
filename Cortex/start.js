/**
 * 🚀 Point d'entrée principal Cortex v2.0
 * Module de démarrage avec support des versions optimisée et legacy
 */

import { logger } from '../utils/logger.js';

// Import des modules optimisés (v2.0)
import { cortexOptimized } from './cortexOptimized.js';
import { cortexMigration } from './migration.js';
import { cortexPerformanceManager } from './performanceManager.js';
import { SCRAPING_CONFIG, PERFORMANCE_CONFIG } from './config.js';

// Import des modules legacy pour compatibilité
import { launch as scrapArticles } from './scrapArticles.js';

class CortexStarter {
    constructor() {
        this.version = '2.0.0';
        this.useOptimizedVersion = true; // Par défaut, utiliser la version optimisée
        this.isRunning = false;
    }

    /**
     * Démarre Cortex avec la version appropriée
     * @param {Object} options - Options de démarrage
     * @returns {Promise<Object>} Résultats du scraping
     */
    async start(options = {}) {
        logger.info(`🚀 Démarrage Cortex v${this.version}`, 'CortexStarter');

        if (this.isRunning) {
            logger.warning('⚠️ Cortex déjà en cours d\'exécution', 'CortexStarter');
            return { success: false, error: 'Already running' };
        }

        this.isRunning = true;

        try {
            const startOptions = {
                useOptimized: true,
                maxArticles: 50,
                enableMonitoring: true,
                enableBatching: true,
                ...options
            };

            // Démarrage du monitoring
            if (startOptions.enableMonitoring) {
                cortexPerformanceManager.startGlobalMonitoring();
            }

            let results;

            if (startOptions.useOptimized && this.useOptimizedVersion) {
                logger.info('📊 Utilisation de Cortex optimisé v2.0', 'CortexStarter');
                results = await this.startOptimizedVersion(startOptions);
            } else {
                logger.info('🔧 Utilisation de Cortex legacy', 'CortexStarter');
                results = await this.startLegacyVersion(startOptions);
            }

            return results;

        } catch (error) {
            logger.error(`❌ Erreur démarrage Cortex: ${error.message}`, 'CortexStarter');
            return { success: false, error: error.message };
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * Démarre la version optimisée
     * @param {Object} options - Options
     * @returns {Promise<Object>} Résultats
     */
    async startOptimizedVersion(options) {
        logger.info('🚀 Lancement session Cortex optimisée', 'CortexStarter');

        const sessionOptions = {
            maxArticles: options.maxArticles,
            onlyUnprocessed: true,
            enableBatching: options.enableBatching,
            enableCaching: true,
            enablePerformanceMonitoring: options.enableMonitoring
        };

        const results = await cortexOptimized.startScrapingSession(sessionOptions);

        if (results.success) {
            logger.info(`✅ Session terminée: ${results.results.articlesScraped}/${results.results.articlesProcessed} articles traités`, 'CortexStarter');
        } else {
            logger.error(`❌ Session échouée: ${results.error}`, 'CortexStarter');
        }

        return {
            success: results.success,
            version: '2.0.0-optimized',
            ...results
        };
    }

    /**
     * Démarre la version legacy pour compatibilité
     * @param {Object} options - Options
     * @returns {Promise<Object>} Résultats
     */
    async startLegacyVersion(options) {
        logger.info('🔧 Lancement Cortex legacy', 'CortexStarter');

        try {
            // Appel de l'ancienne fonction avec adaptation
            const legacyResults = await scrapArticles();

            return {
                success: true,
                version: '1.0.0-legacy',
                results: {
                    articlesProcessed: legacyResults.processed || 0,
                    articlesScraped: legacyResults.scraped || 0,
                    legacy: true
                }
            };

        } catch (error) {
            logger.error(`❌ Erreur version legacy: ${error.message}`, 'CortexStarter');
            return {
                success: false,
                version: '1.0.0-legacy',
                error: error.message
            };
        }
    }

    /**
     * Lance la migration vers v2.0
     * @param {Object} options - Options de migration
     * @returns {Promise<Object>} Résultats de migration
     */
    async migrate(options = {}) {
        logger.info('🔄 Lancement migration Cortex v2.0', 'CortexStarter');

        // Génération du rapport de compatibilité
        const compatibilityReport = await cortexMigration.generateCompatibilityReport();

        if (!compatibilityReport.compatibility.overall) {
            logger.warning('⚠️ Système non compatible pour migration', 'CortexStarter');
            return {
                success: false,
                error: 'System not compatible',
                report: compatibilityReport
            };
        }

        // Lancement de la migration
        const migrationResults = await cortexMigration.migrateToV2(options);

        if (migrationResults.success) {
            this.useOptimizedVersion = true;
            logger.info('✅ Migration vers v2.0 terminée', 'CortexStarter');
        } else {
            logger.error('❌ Migration échouée', 'CortexStarter');
        }

        return {
            ...migrationResults,
            compatibilityReport
        };
    }

    /**
     * Obtient le statut de Cortex
     * @returns {Object} Statut complet
     */
    getStatus() {
        const baseStatus = {
            version: this.version,
            isRunning: this.isRunning,
            useOptimizedVersion: this.useOptimizedVersion,
            timestamp: new Date().toISOString()
        };

        if (this.useOptimizedVersion) {
            return {
                ...baseStatus,
                stats: cortexOptimized.getFullStats(),
                migration: cortexMigration.getMigrationStatus()
            };
        } else {
            return {
                ...baseStatus,
                mode: 'legacy',
                notice: 'Utilisez migrate() pour passer à v2.0'
            };
        }
    }

    /**
     * Configure la version à utiliser
     * @param {boolean} useOptimized - Utiliser la version optimisée
     */
    setOptimizedMode(useOptimized = true) {
        this.useOptimizedVersion = useOptimized;
        logger.info(`⚙️ Mode Cortex: ${useOptimized ? 'Optimisé v2.0' : 'Legacy v1.0'}`, 'CortexStarter');
    }

    /**
     * Arrête Cortex
     */
    async stop() {
        if (this.isRunning) {
            logger.info('🛑 Arrêt de Cortex', 'CortexStarter');

            if (this.useOptimizedVersion) {
                await cortexOptimized.stopSession();
            }

            this.isRunning = false;
        }
    }

    /**
     * Remet à zéro Cortex
     */
    async reset() {
        await this.stop();

        if (this.useOptimizedVersion) {
            await cortexOptimized.reset();
        }

        cortexMigration.reset();
        logger.info('🔄 Cortex réinitialisé', 'CortexStarter');
    }
}

// Instance singleton
const cortexStarter = new CortexStarter();

/**
 * Fonction principale pour démarrer Cortex
 * Compatible avec l'ancienne interface
 */
export async function startCortex(options = {}) {
    return await cortexStarter.start(options);
}

/**
 * Interface de migration
 */
export async function migrateCortex(options = {}) {
    return await cortexStarter.migrate(options);
}

/**
 * Obtient le statut de Cortex
 */
export function getCortexStatus() {
    return cortexStarter.getStatus();
}

// Export pour compatibilité
export { cortexStarter };
export default cortexStarter;

// Compatibilité avec l'ancienne interface si nécessaire
if (typeof globalThis !== 'undefined') {
    globalThis.startCortex = startCortex;
    globalThis.migrateCortex = migrateCortex;
}

// 🚀 Point d'entrée automatique si exécuté directement
if (import.meta.url === `file://${process.argv[1]}`) {
    logger.info('🚀 Lancement automatique de Cortex...', 'CortexStarter');

    try {
        await startCortex({
            useOptimized: true,
            enableMonitoring: true,
            maxArticles: 100
        });
    } catch (error) {
        logger.error(`❌ Erreur de démarrage Cortex: ${error.message}`, 'CortexStarter');
        process.exit(1);
    }
}
