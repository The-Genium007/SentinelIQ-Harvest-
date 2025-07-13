/**
 * 📝 Logger hérité - Redirige vers le nouveau LogManager
 * Maintient la compatibilité avec l'ancien système
 */

import { logManager, LOG_LEVELS, LOG_TYPES } from './logManager.js';

/**
 * Fonction de logging centralisée pour tout le projet SentinelIQ Harvest
 * @param {string} message - Message à logger
 * @param {string} level - Niveau de log (INFO, ERROR, WARNING, SUCCESS) - optionnel
 * @param {string} module - Module d'origine du log (WireScanner, Cortex, etc.) - optionnel
 */
export function log(message, level = 'INFO', module = '') {
    const logLevel = LOG_LEVELS[level] || LOG_LEVELS.INFO;
    logManager.log(LOG_TYPES.SYSTEM, logLevel, message, module);
}

/**
 * Fonctions de logging spécialisées pour différents niveaux
 */
export const logger = {
    info: (message, module = '') => logManager.info(message, module, LOG_TYPES.SYSTEM),
    error: (message, module = '') => logManager.error(message, module, LOG_TYPES.ERROR),
    warning: (message, module = '') => logManager.warn(message, module, LOG_TYPES.SYSTEM),
    success: (message, module = '') => logManager.success(message, module, LOG_TYPES.SYSTEM),
    debug: (message, module = '') => logManager.debug(message, module, LOG_TYPES.DEBUG)
};

/**
 * Fonction pour logger avec émojis (compatibilité avec l'existant)
 */
export function logWithEmoji(message, module = '') {
    logManager.info(message, module, LOG_TYPES.SYSTEM);
}

// Export du logManager pour les nouveaux usages
export { logManager, LOG_LEVELS, LOG_TYPES };

export default logger;
