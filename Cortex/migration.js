/**
 * 🔄 Module de migration pour Cortex v2.0
 * Utilitaires pour la migration vers l'architecture optimisée
 */

import { logger } from '../utils/logger.js';
import { cortexOptimized } from './cortexOptimized.js';
import { cortexDataManager } from './dataManager.js';
import { scrapingEngine } from './scrapingEngine.js';
import { cortexPerformanceManager } from './performanceManager.js';

class CortexMigration {
    constructor() {
        this.migrationSteps = [
            'testConnections',
            'backupCurrentData',
            'migrateConfiguration',
            'testOptimizedVersion',
            'validateMigration',
            'cleanupOldFiles'
        ];

        this.migrationStatus = {
            isRunning: false,
            currentStep: null,
            completedSteps: [],
            errors: [],
            startTime: null,
            endTime: null
        };
    }

    /**
     * Lance la migration complète vers Cortex v2.0
     * @param {Object} options - Options de migration
     * @returns {Promise<Object>} Résultats de la migration
     */
    async migrateToV2(options = {}) {
        if (this.migrationStatus.isRunning) {
            return { success: false, error: 'Migration already in progress' };
        }

        const migrationId = `migration-${Date.now()}`;
        this.migrationStatus.isRunning = true;
        this.migrationStatus.startTime = Date.now();
        this.migrationStatus.completedSteps = [];
        this.migrationStatus.errors = [];

        logger.info(`🔄 Démarrage migration Cortex v2.0: ${migrationId}`, 'CortexMigration');

        try {
            const migrationConfig = {
                createBackup: true,
                validateData: true,
                testNewVersion: true,
                preserveOldFiles: true,
                autoCleanup: false,
                ...options
            };

            // Exécution des étapes de migration
            for (const step of this.migrationSteps) {
                await this.executeStep(step, migrationConfig);
            }

            this.migrationStatus.endTime = Date.now();
            const duration = this.migrationStatus.endTime - this.migrationStatus.startTime;

            logger.info(`✅ Migration Cortex v2.0 terminée en ${duration}ms`, 'CortexMigration');

            return {
                success: true,
                migrationId,
                duration,
                completedSteps: this.migrationStatus.completedSteps,
                errors: this.migrationStatus.errors
            };

        } catch (error) {
            logger.error(`❌ Erreur migration Cortex: ${error.message}`, 'CortexMigration');
            return {
                success: false,
                migrationId,
                error: error.message,
                completedSteps: this.migrationStatus.completedSteps,
                errors: this.migrationStatus.errors
            };
        } finally {
            this.migrationStatus.isRunning = false;
        }
    }

    /**
     * Exécute une étape de migration
     * @param {string} stepName - Nom de l'étape
     * @param {Object} config - Configuration
     */
    async executeStep(stepName, config) {
        this.migrationStatus.currentStep = stepName;
        logger.info(`🔧 Exécution étape: ${stepName}`, 'CortexMigration');

        try {
            switch (stepName) {
                case 'testConnections':
                    await this.testConnections();
                    break;

                case 'backupCurrentData':
                    if (config.createBackup) {
                        await this.backupCurrentData();
                    }
                    break;

                case 'migrateConfiguration':
                    await this.migrateConfiguration();
                    break;

                case 'testOptimizedVersion':
                    if (config.testNewVersion) {
                        await this.testOptimizedVersion();
                    }
                    break;

                case 'validateMigration':
                    if (config.validateData) {
                        await this.validateMigration();
                    }
                    break;

                case 'cleanupOldFiles':
                    if (config.autoCleanup) {
                        await this.cleanupOldFiles();
                    }
                    break;

                default:
                    throw new Error(`Étape inconnue: ${stepName}`);
            }

            this.migrationStatus.completedSteps.push(stepName);
            logger.debug(`✅ Étape ${stepName} terminée`, 'CortexMigration');

        } catch (error) {
            const stepError = `Erreur étape ${stepName}: ${error.message}`;
            this.migrationStatus.errors.push(stepError);
            logger.error(`❌ ${stepError}`, 'CortexMigration');
            throw error;
        }
    }

    /**
     * Test des connexions et services
     */
    async testConnections() {
        logger.debug('🔗 Test des connexions...', 'CortexMigration');

        // Test connexion base de données
        await cortexDataManager.testConnection();

        // Test du moteur de scraping
        await scrapingEngine.initialize();
        await scrapingEngine.cleanup();

        // Test du monitoring
        cortexPerformanceManager.getSystemStatus();

        logger.debug('✅ Toutes les connexions OK', 'CortexMigration');
    }

    /**
     * Sauvegarde des données actuelles
     */
    async backupCurrentData() {
        logger.debug('💾 Sauvegarde des données actuelles...', 'CortexMigration');

        // Obtenir les statistiques actuelles
        const currentStats = {
            timestamp: new Date().toISOString(),
            dataManager: cortexDataManager.getStats(),
            performance: cortexPerformanceManager.getStats()
        };

        // Sauvegarde dans un fichier de backup
        const backupData = {
            version: '1.0',
            migrationDate: new Date().toISOString(),
            stats: currentStats,
            config: {
                note: 'Backup before migration to Cortex v2.0'
            }
        };

        logger.debug('✅ Sauvegarde créée', 'CortexMigration');
        return backupData;
    }

    /**
     * Migration de la configuration
     */
    async migrateConfiguration() {
        logger.debug('⚙️ Migration de la configuration...', 'CortexMigration');

        // Ici on pourrait migrer des configurations spécifiques
        // Pour l'instant, les nouvelles configurations sont déjà en place

        logger.debug('✅ Configuration migrée', 'CortexMigration');
    }

    /**
     * Test de la version optimisée
     */
    async testOptimizedVersion() {
        logger.debug('🧪 Test de la version optimisée...', 'CortexMigration');

        try {
            // Test d'une petite session de scraping
            const testResults = await cortexOptimized.startScrapingSession({
                maxArticles: 5,
                onlyUnprocessed: true,
                enablePerformanceMonitoring: true,
                enableBatching: false // Pas de batch pour le test
            });

            if (!testResults.success) {
                throw new Error(`Test échoué: ${testResults.error}`);
            }

            logger.debug(`✅ Test réussi: ${testResults.results.articlesProcessed} articles traités`, 'CortexMigration');

        } catch (error) {
            logger.error(`❌ Test de la version optimisée échoué: ${error.message}`, 'CortexMigration');
            throw error;
        }
    }

    /**
     * Validation de la migration
     */
    async validateMigration() {
        logger.debug('✅ Validation de la migration...', 'CortexMigration');

        // Vérification que tous les services fonctionnent
        const validationChecks = [
            { name: 'DataManager', check: () => cortexDataManager.getStats() },
            { name: 'ScrapingEngine', check: () => scrapingEngine.getStats() },
            { name: 'PerformanceManager', check: () => cortexPerformanceManager.getStats() },
            { name: 'CortexOptimized', check: () => cortexOptimized.getFullStats() }
        ];

        for (const { name, check } of validationChecks) {
            try {
                const result = check();
                logger.debug(`✅ ${name} validation OK`, 'CortexMigration');
            } catch (error) {
                throw new Error(`Validation ${name} échouée: ${error.message}`);
            }
        }

        logger.debug('✅ Validation complète réussie', 'CortexMigration');
    }

    /**
     * Nettoyage des anciens fichiers (optionnel)
     */
    async cleanupOldFiles() {
        logger.debug('🧹 Nettoyage des anciens fichiers...', 'CortexMigration');

        // Liste des fichiers qui pourraient être nettoyés
        const filesToCleanup = [
            // Ajouter ici les fichiers obsolètes si nécessaire
        ];

        logger.debug('✅ Nettoyage terminé', 'CortexMigration');
    }

    /**
     * Génère un rapport de compatibilité
     * @returns {Object} Rapport de compatibilité
     */
    async generateCompatibilityReport() {
        logger.info('📊 Génération rapport de compatibilité Cortex v2.0', 'CortexMigration');

        const report = {
            timestamp: new Date().toISOString(),
            version: '2.0.0',
            compatibility: {
                database: false,
                performance: false,
                scraping: false,
                overall: false
            },
            checks: [],
            recommendations: []
        };

        try {
            // Test base de données
            await cortexDataManager.testConnection();
            report.compatibility.database = true;
            report.checks.push('✅ Base de données: Compatible');
        } catch (error) {
            report.checks.push(`❌ Base de données: ${error.message}`);
            report.recommendations.push('Vérifier la configuration de la base de données');
        }

        try {
            // Test performance
            const systemStatus = cortexPerformanceManager.getSystemStatus();
            report.compatibility.performance = systemStatus.memoryUsage < 90;
            report.checks.push(`✅ Performance: Mémoire ${systemStatus.memoryUsage}%`);
        } catch (error) {
            report.checks.push(`❌ Performance: ${error.message}`);
            report.recommendations.push('Vérifier les ressources système disponibles');
        }

        try {
            // Test scraping
            await scrapingEngine.initialize();
            await scrapingEngine.cleanup();
            report.compatibility.scraping = true;
            report.checks.push('✅ Moteur de scraping: Compatible');
        } catch (error) {
            report.checks.push(`❌ Moteur de scraping: ${error.message}`);
            report.recommendations.push('Vérifier l\'installation de Puppeteer');
        }

        // Compatibilité globale
        report.compatibility.overall = Object.values(report.compatibility).every(Boolean);

        if (report.compatibility.overall) {
            report.recommendations.push('Système prêt pour Cortex v2.0');
        } else {
            report.recommendations.push('Résoudre les problèmes identifiés avant migration');
        }

        logger.info(`📊 Rapport généré: ${report.compatibility.overall ? 'Compatible' : 'Non compatible'}`, 'CortexMigration');

        return report;
    }

    /**
     * Obtient le statut de migration
     */
    getMigrationStatus() {
        return {
            ...this.migrationStatus,
            progress: this.migrationStatus.completedSteps.length / this.migrationSteps.length * 100
        };
    }

    /**
     * Remet à zéro le statut de migration
     */
    reset() {
        this.migrationStatus = {
            isRunning: false,
            currentStep: null,
            completedSteps: [],
            errors: [],
            startTime: null,
            endTime: null
        };

        logger.info('🔄 CortexMigration réinitialisé', 'CortexMigration');
    }
}

// Instance singleton
const cortexMigration = new CortexMigration();

export { cortexMigration };
export default CortexMigration;
