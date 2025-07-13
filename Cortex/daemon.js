/**
 * 🔄 Daemon Cortex - Processus de scraping continu
 * Lance le scraping Cortex en boucle avec des intervalles configurables
 */

import { logger } from '../utils/logger.js';
import { startCortex, getCortexStatus } from './start.js';

class CortexDaemon {
    constructor() {
        this.isRunning = false;
        this.interval = 30 * 60 * 1000; // 30 minutes par défaut
        this.timeoutId = null;
        this.sessionCount = 0;
        this.lastRun = null;
    }

    /**
     * 🚀 Démarre le daemon
     * @param {Object} options - Options de configuration
     */
    async start(options = {}) {
        if (this.isRunning) {
            logger.warning('⚠️ Daemon Cortex déjà en cours', 'CortexDaemon');
            return;
        }

        const config = {
            interval: 30 * 60 * 1000, // 30 minutes
            maxArticles: 100,
            enableMonitoring: true,
            runOnce: false,
            ...options
        };

        this.interval = config.interval;
        this.isRunning = true;

        logger.info(`🚀 Démarrage du daemon Cortex (intervalle: ${config.interval / 1000 / 60}min)`, 'CortexDaemon');

        // Premier run immédiat
        await this.runSession(config);

        // Si runOnce est activé, arrêter après la première session
        if (config.runOnce) {
            logger.info('✅ Session unique terminée', 'CortexDaemon');
            await this.stop();
            return;
        }

        // Planifier les prochaines sessions
        this.scheduleNext(config);

        // Maintenir le processus vivant
        this.keepAlive();
    }

    /**
     * 🔄 Exécute une session de scraping
     * @param {Object} config - Configuration
     */
    async runSession(config) {
        this.sessionCount++;
        this.lastRun = new Date();

        logger.info(`📊 Session #${this.sessionCount} - ${this.lastRun.toLocaleString()}`, 'CortexDaemon');

        try {
            const results = await startCortex({
                useOptimized: true,
                enableMonitoring: config.enableMonitoring,
                maxArticles: config.maxArticles
            });

            if (results.success) {
                const stats = results.results || {};
                logger.info(`✅ Session #${this.sessionCount} réussie: ${stats.articlesScraped || 0}/${stats.articlesProcessed || 0} articles`, 'CortexDaemon');
            } else {
                logger.error(`❌ Session #${this.sessionCount} échouée: ${results.error}`, 'CortexDaemon');
            }

        } catch (error) {
            logger.error(`💥 Erreur session #${this.sessionCount}: ${error.message}`, 'CortexDaemon');
        }
    }

    /**
     * ⏰ Planifie la prochaine session
     * @param {Object} config - Configuration
     */
    scheduleNext(config) {
        if (!this.isRunning) return;

        const nextRun = new Date(Date.now() + this.interval);
        logger.info(`⏰ Prochaine session planifiée: ${nextRun.toLocaleString()}`, 'CortexDaemon');

        this.timeoutId = setTimeout(async () => {
            if (this.isRunning) {
                await this.runSession(config);
                this.scheduleNext(config);
            }
        }, this.interval);
    }

    /**
     * 🔄 Maintient le processus actif
     */
    keepAlive() {
        // Affichage du statut toutes les 5 minutes
        const statusInterval = setInterval(() => {
            if (!this.isRunning) {
                clearInterval(statusInterval);
                return;
            }

            const status = this.getStatus();
            logger.info(`💚 Daemon actif - Sessions: ${status.sessionCount}, Dernière: ${status.lastRun}`, 'CortexDaemon');
        }, 5 * 60 * 1000);

        // Gestion des signaux pour arrêt propre
        process.on('SIGINT', async () => {
            logger.info('🛑 Signal SIGINT reçu, arrêt du daemon...', 'CortexDaemon');
            await this.stop();
            process.exit(0);
        });

        process.on('SIGTERM', async () => {
            logger.info('🛑 Signal SIGTERM reçu, arrêt du daemon...', 'CortexDaemon');
            await this.stop();
            process.exit(0);
        });
    }

    /**
     * 🛑 Arrête le daemon
     */
    async stop() {
        if (!this.isRunning) return;

        logger.info('🛑 Arrêt du daemon Cortex...', 'CortexDaemon');

        this.isRunning = false;

        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }

        logger.info('✅ Daemon Cortex arrêté', 'CortexDaemon');
    }

    /**
     * 📊 Obtient le statut du daemon
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            sessionCount: this.sessionCount,
            interval: this.interval,
            lastRun: this.lastRun ? this.lastRun.toLocaleString() : 'Jamais',
            nextRun: this.timeoutId ? new Date(Date.now() + this.interval).toLocaleString() : 'Non planifié',
            uptime: this.lastRun ? Date.now() - this.lastRun.getTime() : 0
        };
    }
}

// Instance du daemon
const daemon = new CortexDaemon();

// Export des fonctions
export async function startDaemon(options = {}) {
    return await daemon.start(options);
}

export async function stopDaemon() {
    return await daemon.stop();
}

export function getDaemonStatus() {
    return daemon.getStatus();
}

export { daemon };

// 🚀 Démarrage automatique si exécuté directement
if (import.meta.url === `file://${process.argv[1]}`) {
    logger.info('🚀 Lancement du daemon Cortex...', 'CortexDaemon');

    const args = process.argv.slice(2);
    const runOnce = args.includes('--once') || args.includes('-1');
    const interval = args.find(arg => arg.startsWith('--interval='))?.split('=')[1];

    const options = {
        runOnce,
        maxArticles: 100,
        enableMonitoring: true
    };

    if (interval) {
        options.interval = parseInt(interval) * 60 * 1000; // Conversion minutes vers ms
    }

    await startDaemon(options);
}
