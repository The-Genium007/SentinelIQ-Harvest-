/**
 * 🚀 Intégration WireScanner → Cortex
 * Lance automatiquement le traitement Cortex après le scraping WireScanner
 */

import { spawn } from 'child_process';
import { logManager } from '../utils/logManager.js';

/**
 * Lance le processus Cortex pour traiter les articles collectés
 * @param {Object} options - Options de lancement
 * @param {boolean} options.wait - Attendre la fin du processus Cortex
 * @param {number} options.timeout - Timeout en millisecondes
 * @returns {Promise<boolean>} Succès du lancement
 */
export async function launchCortex(options = {}) {
    const {
        wait = true,
        timeout = 10 * 60 * 1000 // 10 minutes par défaut
    } = options;

    return new Promise((resolve, reject) => {
        logManager.info('🚀 Lancement de Cortex depuis WireScanner', 'WireScanner');

        try {
            // Lancer le processus Cortex avec scrapArticles.js
            const cortexProcess = spawn('node', ['process-articles.mjs'], {
                cwd: process.cwd(),
                stdio: ['ignore', 'pipe', 'pipe'],
                detached: false
            });

            let output = '';
            let errorOutput = '';

            // Capture de la sortie standard
            cortexProcess.stdout.on('data', (data) => {
                const message = data.toString().trim();
                if (message) {
                    output += message + '\n';
                    logManager.scraping('INFO', `[Cortex] ${message}`);
                }
            });

            // Capture des erreurs
            cortexProcess.stderr.on('data', (data) => {
                const message = data.toString().trim();
                if (message) {
                    errorOutput += message + '\n';
                    logManager.scraping('WARN', `[Cortex Error] ${message}`);
                }
            });

            // Gestion de la fin du processus
            cortexProcess.on('close', (code) => {
                if (code === 0) {
                    logManager.success('✅ Cortex terminé avec succès', 'WireScanner');
                    resolve(true);
                } else {
                    const errorMsg = `❌ Cortex terminé avec le code d'erreur ${code}`;
                    logManager.error(errorMsg, 'WireScanner');
                    if (errorOutput) {
                        logManager.error(`Erreurs Cortex: ${errorOutput}`, 'WireScanner');
                    }
                    reject(new Error(errorMsg));
                }
            });

            // Gestion des erreurs de lancement
            cortexProcess.on('error', (error) => {
                const errorMsg = `❌ Erreur lors du lancement de Cortex: ${error.message}`;
                logManager.error(errorMsg, 'WireScanner');
                reject(error);
            });

            // Timeout si configuré et en mode wait
            if (wait && timeout > 0) {
                const timeoutId = setTimeout(() => {
                    logManager.warn(`⏰ Timeout Cortex après ${timeout}ms, arrêt forcé`, 'WireScanner');
                    cortexProcess.kill('SIGTERM');

                    // Si le processus ne se ferme pas proprement après 5 secondes
                    setTimeout(() => {
                        if (!cortexProcess.killed) {
                            cortexProcess.kill('SIGKILL');
                        }
                    }, 5000);

                    reject(new Error('Timeout Cortex'));
                }, timeout);

                // Nettoyer le timeout si le processus se termine normalement
                cortexProcess.on('close', () => {
                    clearTimeout(timeoutId);
                });
            }

            // Si on ne veut pas attendre, résoudre immédiatement
            if (!wait) {
                logManager.info('🔄 Cortex lancé en arrière-plan', 'WireScanner');
                resolve(true);
            }

        } catch (error) {
            const errorMsg = `❌ Erreur critique lors du lancement de Cortex: ${error.message}`;
            logManager.error(errorMsg, 'WireScanner');
            reject(error);
        }
    });
}

/**
 * Lance Cortex avec gestion d'erreurs et retry
 * @param {Object} options - Options de lancement
 * @param {number} options.retries - Nombre de tentatives (défaut: 2)
 * @returns {Promise<boolean>} Succès du lancement
 */
export async function launchCortexWithRetry(options = {}) {
    const { retries = 2, ...launchOptions } = options;

    for (let attempt = 1; attempt <= retries + 1; attempt++) {
        try {
            logManager.info(`🎯 Tentative ${attempt}/${retries + 1} de lancement de Cortex`, 'WireScanner');

            const success = await launchCortex(launchOptions);

            if (success) {
                logManager.success(`✅ Cortex lancé avec succès (tentative ${attempt})`, 'WireScanner');
                return true;
            }

        } catch (error) {
            logManager.error(`❌ Échec tentative ${attempt}: ${error.message}`, 'WireScanner');

            if (attempt === retries + 1) {
                logManager.error('🛑 Toutes les tentatives de lancement de Cortex ont échoué', 'WireScanner');
                throw error;
            }

            if (attempt < retries + 1) {
                const delay = attempt * 2000; // Délai progressif: 2s, 4s, 6s...
                logManager.info(`⏳ Attente de ${delay}ms avant nouvelle tentative`, 'WireScanner');
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    return false;
}

/**
 * Fonction de commodité pour lancer Cortex après WireScanner
 * @param {Object} scrapingResults - Résultats du scraping WireScanner
 * @returns {Promise<boolean>} Succès de l'intégration
 */
export async function integrateWithCortex(scrapingResults = {}) {
    try {
        const {
            articleCount = scrapingResults.articles || 0, // Support pour les deux formats
            articles = 0,
            feedCount = 0,
            errors = []
        } = scrapingResults;

        // Utiliser le bon compteur d'articles
        const actualArticleCount = articleCount || articles || 0;

        logManager.info(`🔗 Intégration WireScanner → Cortex`, 'WireScanner');
        logManager.info(`📊 Résultats: ${actualArticleCount} articles, ${feedCount} flux, ${errors.length} erreurs`, 'WireScanner');

        // Ne lancer Cortex que s'il y a des articles à traiter
        if (actualArticleCount > 0) {
            logManager.info('✅ Articles disponibles, lancement de Cortex', 'WireScanner');
            return await launchCortexWithRetry({
                wait: true,
                timeout: 15 * 60 * 1000, // 15 minutes
                retries: 2
            });
        } else {
            logManager.info('⏭️ Aucun nouvel article, Cortex non nécessaire', 'WireScanner');
            return true;
        }

    } catch (error) {
        logManager.error(`❌ Erreur lors de l'intégration: ${error.message}`, 'WireScanner');
        throw error;
    }
}

/**
 * Fonction pour vérifier si Cortex est disponible
 * @returns {Promise<boolean>} Cortex est disponible
 */
export async function checkCortexAvailability() {
    try {
        const { access } = await import('fs/promises');
        await access('./Cortex/scrapArticles.js');
        logManager.info('✅ Cortex disponible', 'WireScanner');
        return true;
    } catch (error) {
        logManager.error(`❌ Cortex non disponible: ${error.message}`, 'WireScanner');
        return false;
    }
}
