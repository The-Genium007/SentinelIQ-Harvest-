// Fonctions utilitaires pour la gestion des flux RSS
import Parser from 'rss-parser';

// Initialisation du parser RSS
const parser = new Parser();

/**
 * Parse un flux RSS à partir d'une URL donnée.
 * @param {string} url - L'URL du flux RSS à parser
 * @returns {Promise<Object>} Le flux RSS parsé
 */
export async function parseFeed(url) {
    return parser.parseURL(url);
}

// Expression régulière pour valider les URLs HTTP/HTTPS
const URL_REGEX = /^https?:\/\/[^ "']+$/;

/**
 * Vérifie si une URL est valide (HTTP/HTTPS, sans espaces ni guillemets).
 * @param {string} url - L'URL à valider
 * @returns {boolean} true si l'URL est valide, false sinon
 */
export function isValidUrl(url) {
    return URL_REGEX.test(url);
}
