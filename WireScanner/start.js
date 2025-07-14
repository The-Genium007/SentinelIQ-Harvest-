// Script de planification et d'exécution automatique du crawl RSS avec gestion des logs et des erreurs
import cron from 'node-cron'
import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'fs'
import { join } from 'path'
import { logger } from '../utils/logger.js'

// Import de la fonction principale de crawl optimisée
import { crawlUrl } from './crawlUrl.js'

// Import de l'intégration Cortex (remplace les webhooks)
import { integrateWithCortex, checkCortexAvailability } from './cortexIntegration.js'

// 📁 Fichier de commande pour déclenchement manuel
const COMMAND_FILE = join(process.cwd(), 'command_trigger.txt')
const COMMAND_TRIGGER = 'START_SCRAPPING_NOW'

/**
 * Vérifie s'il y a une commande manuelle en attente
 */
function checkManualCommand() {
    try {
        if (existsSync(COMMAND_FILE)) {
            const command = readFileSync(COMMAND_FILE, 'utf8').trim()
            if (command === COMMAND_TRIGGER) {
                // Supprimer le fichier de commande
                unlinkSync(COMMAND_FILE)
                logger.info('🎯 Commande manuelle détectée, exécution immédiate', 'WireScanner')
                return true
            }
        }
    } catch (error) {
        logger.error(`❌ Erreur lecture fichier commande: ${error.message}`, 'WireScanner')
    }
    return false
}

/**
 * Crée le fichier de commande pour déclenchement manuel
 */
export function triggerManualStart() {
    try {
        writeFileSync(COMMAND_FILE, COMMAND_TRIGGER, 'utf8')
        logger.info('📝 Commande manuelle créée dans command_trigger.txt', 'WireScanner')
        logger.info('⏰ Le scrapping démarrera dans les 30 secondes', 'WireScanner')
        return true
    } catch (error) {
        logger.error(`❌ Erreur création fichier commande: ${error.message}`, 'WireScanner')
        return false
    }
}

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
            // Assurer la compatibilité entre les formats de données
            scrapingResults = {
                ...scrapingResults,
                ...results,
                articleCount: results.articles || results.articleCount || 0,
                feedCount: results.sources || results.feedCount || 0
            };
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

// 🎯 Cron de vérification des commandes manuelles (toutes les 30 secondes)
const manualCommandChecker = cron.schedule(
    '*/30 * * * * *',
    () => {
        // Ne pas vérifier si une tâche est déjà en cours
        if (running) {
            return
        }

        // Vérifier s'il y a une commande manuelle
        if (checkManualCommand()) {
            // Vérification du timeout avant d'exécuter
            resetRunningState()

            if (running) {
                logger.warning('⏭️ Tâche déjà en cours, commande manuelle ignorée', 'WireScanner')
                return
            }

            running = true
            lastRunTime = Date.now()

            logger.info('🚀 Démarrage manuel via commande détectée', 'WireScanner')

            safeExecute().finally(() => {
                running = false
                lastRunTime = null
                logger.info('🏁 Tâche manuelle WireScanner + Cortex terminée', 'WireScanner')
            })
        }
    },
    {
        scheduled: true,
        timezone: 'Europe/Paris'
    }
)

// 🔍 Validation des expressions cron au démarrage
if (!cron.validate('0 3 * * *')) {
    throw new Error('🚫 Expression cron principale invalide')
}

if (!cron.validate('*/30 * * * * *')) {
    throw new Error('🚫 Expression cron vérification manuelle invalide')
}

// 📝 Démarrage des crons
logger.success('🔄 Cron principal démarré – tous les jours à 03:00 Europe/Paris', 'WireScanner')
logger.success('👀 Cron vérification commandes manuelles démarré – toutes les 30s', 'WireScanner')
logger.info('💡 Pour déclencher manuellement: créer le fichier "command_trigger.txt" avec "START_SCRAPPING_NOW"', 'WireScanner')

// 📤 Fonctions pour stopper ou relancer les tâches cron dynamiquement
export function stopTask() {
    task.stop();
    manualCommandChecker.stop();
    running = false;
    lastRunTime = null;
    logger.info('⏸️ Tous les crons stoppés et état réinitialisé', 'WireScanner')
}

export function startTask() {
    task.start();
    manualCommandChecker.start();
    logger.info('▶️ Tous les crons relancés', 'WireScanner')
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

/**
 * Lance le scrapping via le système de commande (alternative plus simple)
 * Utilise le mécanisme de fichier de commande pour déclenchement asynchrone
 */
export function scheduleManualRun() {
    if (running) {
        const message = '⏭️ Tâche déjà en cours, commande programmée sera ignorée'
        logger.warning(message, 'WireScanner')
        return { success: false, message }
    }

    const success = triggerManualStart()
    if (success) {
        return {
            success: true,
            message: '✅ Commande programmée, exécution dans les 30 secondes',
            instruction: 'Le scrapping démarrera automatiquement via le cron de vérification'
        }
    } else {
        return {
            success: false,
            message: '❌ Erreur lors de la programmation de la commande'
        }
    }
}

// 🔧 Fonction utilitaire pour forcer la réinitialisation
export function forceReset() {
    running = false
    lastRunTime = null
    // Nettoyer le fichier de commande si existant
    try {
        if (existsSync(COMMAND_FILE)) {
            unlinkSync(COMMAND_FILE)
            logger.info('🧹 Fichier de commande nettoyé', 'WireScanner')
        }
    } catch (error) {
        logger.error(`❌ Erreur nettoyage fichier commande: ${error.message}`, 'WireScanner')
    }
    logger.info('🔄 État forcé à la réinitialisation', 'WireScanner')
}

// 🔍 Fonction utilitaire pour afficher l'état actuel
export function getStatus() {
    return {
        running,
        lastRunTime: lastRunTime ? new Date(lastRunTime).toISOString() : null,
        nextScheduledRun: '03:00 Europe/Paris (quotidien)',
        manualCommandFile: COMMAND_FILE,
        hasActiveCommand: existsSync(COMMAND_FILE)
    }
}

// 🕒 Vérification périodique de l'état (toutes les 5 minutes)
setInterval(resetRunningState, 5 * 60 * 1000)

// Vérification périodique de la commande manuelle (toutes les 30 secondes)
setInterval(checkManualCommand, 30 * 1000)
