// Script de planification et d'exécution automatique du crawl RSS avec gestion des logs et des erreurs
import cron from 'node-cron'
import { logger } from '../utils/logger.js'

// Import de la fonction principale de crawl optimisée
import { crawlUrl } from './crawlUrl.js'

// Import de l'intégration Cortex (remplace les webhooks)
import { integrateWithCortex, checkCortexAvailability } from './cortexIntegration.js'

/**
 * Exécute la tâche principale de crawl et lance Cortex si nécessaire
 */
async function executeTask() {
    logger.info('▶️ Lancement de crawlUrl', 'WireScanner')

    let scrapingResults = {
        articleCount: 0,
        feedCount: 0,
        errors: []
    };

    try {
        // Vérifier la disponibilité de Cortex avant de commencer
        const cortexAvailable = await checkCortexAvailability();
        if (!cortexAvailable) {
            logger.warning('⚠️ Cortex non disponible, continuer sans intégration', 'WireScanner');
        }

        // Exécuter le crawling
        const results = await crawlUrl();

        // Mise à jour des résultats si crawlUrl retourne des données
        if (results && typeof results === 'object') {
            scrapingResults = { ...scrapingResults, ...results };
        }

        logger.success('✅ crawlUrl terminé avec succès', 'WireScanner')

        // Lancer Cortex automatiquement après le scraping (remplace les webhooks)
        if (cortexAvailable) {
            logger.info('🔗 Lancement automatique de Cortex...', 'WireScanner');
            try {
                await integrateWithCortex(scrapingResults);
                logger.success('✅ Intégration Cortex terminée avec succès', 'WireScanner');
            } catch (cortexError) {
                logger.error(`❌ Erreur lors de l'intégration Cortex: ${cortexError.message}`, 'WireScanner');
                // Ne pas faire échouer la tâche WireScanner si Cortex échoue
            }
        }

        return scrapingResults;

    } catch (err) {
        scrapingResults.errors.push(err.message);
        logger.error(`❌ Erreur dans crawlUrl: ${err.message}`, 'WireScanner')
        throw err
    }
}

/**
 * Exécute la tâche avec gestion des erreurs et retries (jusqu'à 3 tentatives).
 * @param {number} retries - Nombre de tentatives déjà effectuées
 */
async function safeExecute(retries = 0) {
    const MAX = 3
    try {
        await executeTask()
    } catch (err) {
        logger.warning(`❌ Erreur (${err.message}). Retry ${retries + 1}/${MAX}`, 'WireScanner')
        if (retries < MAX - 1) {
            return safeExecute(retries + 1)
        }
        logger.error('🛑 Échec définitif.', 'WireScanner')
    }
}

// 🚫 Protection contre chevauchement d'exécution
let running = false
let lastRunTime = null
const TASK_TIMEOUT = 30 * 60 * 1000 // 30 minutes timeout

// 🔄 Fonction pour réinitialiser l'état en cas de blocage
function resetRunningState() {
    if (running && lastRunTime && (Date.now() - lastRunTime > TASK_TIMEOUT)) {
        logger.warning('⚠️ Réinitialisation forcée de l\'état running après timeout', 'WireScanner')
        running = false
        lastRunTime = null
    }
}

// 🕔 Planification cron : tous les jours à 03:00 Europe/Paris
const task = cron.schedule(
    '0 3 * * *',
    () => {
        // Vérification du timeout avant d'exécuter
        resetRunningState()

        if (running) {
            logger.warning('⏭️ Tâche précédente toujours en cours, saut de cette exécution.', 'WireScanner')
            return
        }

        running = true
        lastRunTime = Date.now()

        safeExecute().finally(() => {
            running = false
            lastRunTime = null
            logger.info('🏁 Tâche WireScanner + Cortex terminée, état réinitialisé', 'WireScanner')
        })
    },
    {
        scheduled: true,
        timezone: 'Europe/Paris'
    }
)

// 🔍 Validation de l'expression cron au démarrage
if (!cron.validate('0 3 * * *')) {
    throw new Error('🚫 Expression cron invalide')
}

// 📝 Démarrage du cron
logger.success('🔄 Cron démarré – tous les jours à 03:00 Europe/Paris', 'WireScanner')

// 📤 Fonctions pour stopper ou relancer la tâche cron dynamiquement
export function stopTask() {
    task.stop();
    running = false;
    lastRunTime = null;
    logger.info('⏸️ Cron stoppé et état réinitialisé', 'WireScanner')
}

export function startTask() {
    task.start();
    logger.info('▶️ Cron relancé', 'WireScanner')
}

/**
 * Lance le scrapping manuellement (en dehors du cron)
 * Idéal pour tester ou exécuter à la demande
 */
export async function runScrappingNow() {
    // Vérification du timeout avant d'exécuter
    resetRunningState()

    if (running) {
        const message = '⏭️ Tâche déjà en cours, impossible de lancer manuellement'
        logger.warning(message, 'WireScanner')
        throw new Error(message)
    }

    running = true
    lastRunTime = Date.now()

    logger.info('🚀 Lancement manuel du scrapping...', 'WireScanner')

    try {
        const results = await safeExecute()
        logger.success('✅ Scrapping manuel terminé avec succès', 'WireScanner')
        return results
    } catch (error) {
        logger.error(`❌ Erreur lors du scrapping manuel: ${error.message}`, 'WireScanner')
        throw error
    } finally {
        running = false
        lastRunTime = null
        logger.info('🏁 Scrapping manuel terminé, état réinitialisé', 'WireScanner')
    }
}

// 🔧 Fonction utilitaire pour forcer la réinitialisation
export function forceReset() {
    running = false
    lastRunTime = null
    logger.info('🔄 État forcé à la réinitialisation', 'WireScanner')
}

// 🕒 Vérification périodique de l'état (toutes les 5 minutes)
setInterval(resetRunningState, 5 * 60 * 1000)
