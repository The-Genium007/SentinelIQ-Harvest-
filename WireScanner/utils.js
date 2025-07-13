/**
 * 🛠️ Utilitaires réutilisables pour WireScanner
 * Fonctions communes optimisées pour la performance
 */

import { logger } from '../utils/logger.js';

/**
 * Classe d'utilitaires pour la validation
 */
export class ValidationUtils {
    /**
     * Valide une URL HTTP/HTTPS
     * @param {string} url - URL à valider
     * @returns {boolean} true si valide
     */
    static isValidUrl(url) {
        if (!url || typeof url !== 'string') return false;

        try {
            const urlObj = new URL(url);
            return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
        } catch {
            return false;
        }
    }

    /**
     * Valide un email
     * @param {string} email - Email à valider
     * @returns {boolean} true si valide
     */
    static isValidEmail(email) {
        if (!email || typeof email !== 'string') return false;

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Valide une date
     * @param {string|Date} date - Date à valider
     * @returns {boolean} true si valide
     */
    static isValidDate(date) {
        if (!date) return false;

        const dateObj = new Date(date);
        return dateObj instanceof Date && !isNaN(dateObj.getTime());
    }

    /**
     * Valide qu'une chaîne n'est pas vide après nettoyage
     * @param {string} str - Chaîne à valider
     * @param {number} minLength - Longueur minimum
     * @returns {boolean} true si valide
     */
    static isValidString(str, minLength = 1) {
        return str && typeof str === 'string' && str.trim().length >= minLength;
    }
}

/**
 * Classe d'utilitaires pour le nettoyage de données
 */
export class CleaningUtils {
    /**
     * Nettoie une chaîne de caractères
     * @param {string} str - Chaîne à nettoyer
     * @param {Object} options - Options de nettoyage
     * @returns {string} Chaîne nettoyée
     */
    static cleanString(str, options = {}) {
        if (!str || typeof str !== 'string') return '';

        const {
            maxLength = 1000,
            removeHtml = true,
            normalizeWhitespace = true,
            trim = true
        } = options;

        let cleaned = str;

        // Suppression du HTML si demandé
        if (removeHtml) {
            cleaned = cleaned.replace(/<[^>]*>/g, '');
        }

        // Normalisation des espaces
        if (normalizeWhitespace) {
            cleaned = cleaned
                .replace(/\s+/g, ' ')           // Normalise les espaces
                .replace(/[\r\n\t]/g, ' ')      // Supprime les retours à la ligne
                .replace(/&nbsp;/g, ' ')        // Remplace les espaces insécables
                .replace(/&amp;/g, '&')         // Decode les entités HTML basiques
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>');
        }

        // Trim si demandé
        if (trim) {
            cleaned = cleaned.trim();
        }

        // Limitation de longueur
        if (maxLength > 0) {
            cleaned = cleaned.slice(0, maxLength);
        }

        return cleaned;
    }

    /**
     * Nettoie une URL
     * @param {string} url - URL à nettoyer
     * @returns {string} URL nettoyée
     */
    static cleanUrl(url) {
        if (!url || typeof url !== 'string') return '';

        return url.trim().replace(/\s+/g, '');
    }

    /**
     * Nettoie et valide un objet article
     * @param {Object} article - Article à nettoyer
     * @returns {Object} Article nettoyé
     */
    static cleanArticle(article) {
        if (!article || typeof article !== 'object') return null;

        return {
            url: this.cleanUrl(article.url),
            title: this.cleanString(article.title, { maxLength: 500 }),
            description: this.cleanString(article.description, { maxLength: 2000 }),
            author: this.cleanString(article.author, { maxLength: 200 }),
            publishDate: article.publishDate || new Date().toISOString(),
            categories: Array.isArray(article.categories) ? article.categories : [],
            source: this.cleanString(article.source, { maxLength: 200 }),
            extractedAt: new Date().toISOString()
        };
    }
}

/**
 * Classe d'utilitaires pour les performances
 */
export class PerformanceUtils {
    /**
     * Crée un délai adaptatif basé sur la charge système
     * @param {number} baseDelay - Délai de base en ms
     * @param {Object} options - Options
     * @returns {Promise} Promise de délai
     */
    static async adaptiveDelay(baseDelay = 100, options = {}) {
        const { maxDelay = 5000, memoryThreshold = 100 } = options;

        const memUsage = process.memoryUsage();
        const memoryMB = memUsage.heapUsed / 1024 / 1024;

        // Calcul du délai adaptatif
        let adaptiveDelay = baseDelay;

        if (memoryMB > memoryThreshold) {
            adaptiveDelay = Math.min(baseDelay * 2, maxDelay);
        }

        return new Promise(resolve => setTimeout(resolve, adaptiveDelay));
    }

    /**
     * Exécute une fonction avec retry et backoff exponentiel
     * @param {Function} fn - Fonction à exécuter
     * @param {Object} options - Options de retry
     * @returns {Promise} Résultat de la fonction
     */
    static async retryWithBackoff(fn, options = {}) {
        const {
            maxRetries = 3,
            baseDelay = 1000,
            maxDelay = 10000,
            backoffMultiplier = 2
        } = options;

        let lastError;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                return await fn();
            } catch (error) {
                lastError = error;

                if (attempt === maxRetries) {
                    throw lastError;
                }

                const delay = Math.min(
                    baseDelay * Math.pow(backoffMultiplier, attempt),
                    maxDelay
                );

                logger.debug(`🔄 Retry ${attempt + 1}/${maxRetries} après ${delay}ms`, 'PerformanceUtils');
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }

        throw lastError;
    }

    /**
     * Divise un tableau en chunks de taille optimale
     * @param {Array} array - Tableau à diviser
     * @param {number} chunkSize - Taille des chunks
     * @returns {Array} Tableau de chunks
     */
    static chunkArray(array, chunkSize) {
        if (!Array.isArray(array) || chunkSize <= 0) {
            return [array];
        }

        const chunks = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            chunks.push(array.slice(i, i + chunkSize));
        }
        return chunks;
    }

    /**
     * Limite la concurrence d'exécution
     * @param {Array} tasks - Tâches à exécuter
     * @param {number} limit - Limite de concurrence
     * @returns {Promise<Array>} Résultats
     */
    static async limitConcurrency(tasks, limit) {
        const results = [];

        for (let i = 0; i < tasks.length; i += limit) {
            const batch = tasks.slice(i, i + limit);
            const batchResults = await Promise.allSettled(batch);
            results.push(...batchResults);
        }

        return results;
    }
}

/**
 * Classe d'utilitaires pour le formatage
 */
export class FormatUtils {
    /**
     * Formate une durée en format lisible
     * @param {number} ms - Durée en millisecondes
     * @returns {string} Durée formatée
     */
    static formatDuration(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
        if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
        return `${seconds}s`;
    }

    /**
     * Formate une taille en bytes
     * @param {number} bytes - Taille en bytes
     * @returns {string} Taille formatée
     */
    static formatBytes(bytes) {
        const sizes = ['B', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 B';

        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        const formatted = (bytes / Math.pow(1024, i)).toFixed(2);

        return `${formatted} ${sizes[i]}`;
    }

    /**
     * Formate un nombre avec séparateurs
     * @param {number} num - Nombre à formater
     * @returns {string} Nombre formaté
     */
    static formatNumber(num) {
        return new Intl.NumberFormat('fr-FR').format(num);
    }

    /**
     * Formate un timestamp en date lisible
     * @param {string|Date} timestamp - Timestamp à formater
     * @returns {string} Date formatée
     */
    static formatDate(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleString('fr-FR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }
}

/**
 * Classe d'utilitaires pour les objets et structures de données
 */
export class ObjectUtils {
    /**
     * Deep merge de deux objets
     * @param {Object} target - Objet cible
     * @param {Object} source - Objet source
     * @returns {Object} Objet fusionné
     */
    static deepMerge(target, source) {
        if (!source || typeof source !== 'object') return target;
        if (!target || typeof target !== 'object') return source;

        const result = { ...target };

        for (const key in source) {
            if (source.hasOwnProperty(key)) {
                if (typeof source[key] === 'object' && !Array.isArray(source[key])) {
                    result[key] = this.deepMerge(result[key], source[key]);
                } else {
                    result[key] = source[key];
                }
            }
        }

        return result;
    }

    /**
     * Sélectionne uniquement les propriétés spécifiées d'un objet
     * @param {Object} obj - Objet source
     * @param {Array} keys - Clés à sélectionner
     * @returns {Object} Objet filtré
     */
    static pick(obj, keys) {
        if (!obj || typeof obj !== 'object' || !Array.isArray(keys)) {
            return {};
        }

        const result = {};
        keys.forEach(key => {
            if (obj.hasOwnProperty(key)) {
                result[key] = obj[key];
            }
        });

        return result;
    }

    /**
     * Exclut les propriétés spécifiées d'un objet
     * @param {Object} obj - Objet source
     * @param {Array} keys - Clés à exclure
     * @returns {Object} Objet filtré
     */
    static omit(obj, keys) {
        if (!obj || typeof obj !== 'object' || !Array.isArray(keys)) {
            return obj;
        }

        const result = { ...obj };
        keys.forEach(key => {
            delete result[key];
        });

        return result;
    }
}

// Export groupé des utilitaires
export const Utils = {
    Validation: ValidationUtils,
    Cleaning: CleaningUtils,
    Performance: PerformanceUtils,
    Format: FormatUtils,
    Object: ObjectUtils
};

export default Utils;
