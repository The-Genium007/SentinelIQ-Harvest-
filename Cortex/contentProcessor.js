/**
 * 🔍 Processeur de contenu intelligent pour Cortex
 * Analyse et traite le contenu des articles avec optimisations avancées
 */

import { logger } from '../utils/logger.js';
import { cortexPerformanceManager } from './performanceManager.js';
import { CONTENT_CONFIG, PERFORMANCE_CONFIG } from './config.js';

class ContentProcessor {
    constructor() {
        this.processingStats = {
            articlesProcessed: 0,
            contentExtracted: 0,
            contentFailed: 0,
            averageProcessingTime: 0,
            totalProcessingTime: 0,
            duplicatesFound: 0,
            validationFailures: 0
        };

        this.contentCache = new Map();
        this.selectorCache = new Map();
        this.processingQueue = [];
        this.isProcessing = false;
    }

    /**
     * Traite le contenu d'une page avec optimisations
     * @param {Object} page - Page Puppeteer
     * @param {string} url - URL de la page
     * @param {Object} options - Options de traitement
     * @returns {Promise<Object>} Contenu traité
     */
    async processPageContent(page, url, options = {}) {
        const startTime = Date.now();

        try {
            logger.debug(`🔍 Traitement contenu page: ${url}`, 'ContentProcessor');

            // Vérification du cache
            if (CONTENT_CONFIG.USE_CONTENT_CACHE && this.contentCache.has(url)) {
                logger.debug(`📋 Contenu trouvé en cache: ${url}`, 'ContentProcessor');
                return this.contentCache.get(url);
            }

            // Configuration des options
            const processingOptions = {
                extractMetadata: true,
                cleanContent: true,
                extractImages: false,
                extractLinks: false,
                validateContent: true,
                ...options
            };

            // Attente du chargement complet de la page
            await this.waitForPageLoad(page);

            // Extraction du contenu principal
            const content = await this.extractMainContent(page, url, processingOptions);

            // Validation et nettoyage
            const processedContent = await this.validateAndCleanContent(content, url);

            // Mise en cache si valide
            if (processedContent && CONTENT_CONFIG.USE_CONTENT_CACHE) {
                this.contentCache.set(url, processedContent);

                // Nettoyage du cache si trop volumineux
                if (this.contentCache.size > CONTENT_CONFIG.MAX_CACHE_SIZE) {
                    this.cleanContentCache();
                }
            }

            // Statistiques
            const processingTime = Date.now() - startTime;
            this.updateProcessingStats(processingTime, true);

            logger.debug(`✅ Contenu traité en ${processingTime}ms: ${url}`, 'ContentProcessor');
            return processedContent;

        } catch (error) {
            const processingTime = Date.now() - startTime;
            this.updateProcessingStats(processingTime, false);

            logger.error(`❌ Erreur traitement contenu ${url}: ${error.message}`, 'ContentProcessor');
            return null;
        }
    }

    /**
     * Attends le chargement complet de la page
     * @param {Object} page - Page Puppeteer
     */
    async waitForPageLoad(page) {
        try {
            // Attendre que le DOM soit chargé
            await page.waitForLoadState('domcontentloaded', {
                timeout: PERFORMANCE_CONFIG.PAGE_TIMEOUT
            });

            // Attendre les éléments de contenu principaux
            const selectors = CONTENT_CONFIG.CONTENT_SELECTORS;
            let contentFound = false;

            for (const selector of selectors) {
                try {
                    await page.waitForSelector(selector, {
                        timeout: 2000,
                        state: 'visible'
                    });
                    contentFound = true;
                    break;
                } catch (e) {
                    // Continue avec le sélecteur suivant
                }
            }

            if (!contentFound) {
                logger.warning(`⚠️ Aucun sélecteur de contenu trouvé`, 'ContentProcessor');
            }

            // Délai supplémentaire pour le JavaScript dynamique
            if (CONTENT_CONFIG.WAIT_FOR_DYNAMIC_CONTENT) {
                await page.waitForTimeout(CONTENT_CONFIG.DYNAMIC_CONTENT_DELAY);
            }

        } catch (error) {
            logger.warning(`⚠️ Timeout attente chargement page: ${error.message}`, 'ContentProcessor');
        }
    }

    /**
     * Extrait le contenu principal de la page
     * @param {Object} page - Page Puppeteer
     * @param {string} url - URL de la page
     * @param {Object} options - Options d'extraction
     * @returns {Promise<Object>} Contenu extrait
     */
    async extractMainContent(page, url, options) {
        return await page.evaluate((config, selectors, extractOptions) => {
            const result = {
                url: window.location.href,
                title: '',
                content: '',
                author: '',
                publishDate: '',
                metadata: {},
                extractedAt: new Date().toISOString()
            };

            // Extraction du titre
            result.title = this.extractTitle();

            // Extraction du contenu principal
            result.content = this.extractContent(selectors);

            // Extraction des métadonnées si demandé
            if (extractOptions.extractMetadata) {
                result.author = this.extractAuthor();
                result.publishDate = this.extractDate();
                result.metadata = this.extractMetadata();
            }

            return result;

        }, CONTENT_CONFIG, CONTENT_CONFIG.CONTENT_SELECTORS, options);
    }

    /**
     * Valide et nettoie le contenu extrait
     * @param {Object} content - Contenu à valider
     * @param {string} url - URL source
     * @returns {Object|null} Contenu validé ou null
     */
    async validateAndCleanContent(content, url) {
        if (!content || typeof content !== 'object') {
            this.processingStats.validationFailures++;
            return null;
        }

        // Validation des champs requis
        if (!content.title || content.title.length < CONTENT_CONFIG.MIN_TITLE_LENGTH) {
            logger.debug(`❌ Titre invalide pour ${url}`, 'ContentProcessor');
            this.processingStats.validationFailures++;
            return null;
        }

        if (!content.content || content.content.length < CONTENT_CONFIG.MIN_WORDS_COUNT) {
            logger.debug(`❌ Contenu trop court pour ${url}`, 'ContentProcessor');
            this.processingStats.validationFailures++;
            return null;
        }

        // Nettoyage du contenu
        const cleanedContent = {
            ...content,
            title: this.cleanText(content.title),
            content: this.cleanText(content.content),
            author: this.cleanText(content.author || ''),
            url: url
        };

        // Validation de la longueur après nettoyage
        if (cleanedContent.content.length < CONTENT_CONFIG.MIN_WORDS_COUNT) {
            this.processingStats.validationFailures++;
            return null;
        }

        // Limitation de la taille si nécessaire
        if (cleanedContent.content.length > CONTENT_CONFIG.MAX_WORDS_COUNT) {
            cleanedContent.content = cleanedContent.content.substring(0, CONTENT_CONFIG.MAX_WORDS_COUNT) + '...';
            cleanedContent.metadata.truncated = true;
        }

        // Détection de duplicatas
        if (await this.isDuplicateContent(cleanedContent)) {
            logger.debug(`🔁 Contenu dupliqué détecté: ${url}`, 'ContentProcessor');
            this.processingStats.duplicatesFound++;
            return null;
        }

        this.processingStats.contentExtracted++;
        return cleanedContent;
    }

    /**
     * Nettoie le texte selon la configuration
     * @param {string} text - Texte à nettoyer
     * @returns {string} Texte nettoyé
     */
    cleanText(text) {
        if (!text || typeof text !== 'string') return '';

        let cleaned = text;

        // Suppression des balises HTML
        if (CONTENT_CONFIG.CLEAN_HTML) {
            cleaned = cleaned.replace(/<[^>]*>/g, '');
        }

        // Normalisation des espaces
        if (CONTENT_CONFIG.NORMALIZE_WHITESPACE) {
            cleaned = cleaned.replace(/\s+/g, ' ').trim();
        }

        // Suppression des paragraphes vides
        if (CONTENT_CONFIG.REMOVE_EMPTY_PARAGRAPHS) {
            cleaned = cleaned.replace(/\n\s*\n/g, '\n');
        }

        // Suppression des caractères de contrôle
        cleaned = cleaned.replace(/[\x00-\x1F\x7F]/g, '');

        // Décodage des entités HTML
        cleaned = this.decodeHtmlEntities(cleaned);

        return cleaned;
    }

    /**
     * Décode les entités HTML
     * @param {string} text - Texte avec entités
     * @returns {string} Texte décodé
     */
    decodeHtmlEntities(text) {
        const entities = {
            '&amp;': '&',
            '&lt;': '<',
            '&gt;': '>',
            '&quot;': '"',
            '&#39;': "'",
            '&apos;': "'",
            '&nbsp;': ' '
        };

        return text.replace(/&[#\w]+;/g, (entity) => {
            return entities[entity] || entity;
        });
    }

    /**
     * Vérifie si le contenu est un duplicata
     * @param {Object} content - Contenu à vérifier
     * @returns {Promise<boolean>} true si duplicata
     */
    async isDuplicateContent(content) {
        if (!CONTENT_CONFIG.DETECT_DUPLICATES) return false;

        try {
            // Génération d'une empreinte du contenu
            const contentHash = this.generateContentHash(content.content);

            // Vérification dans le cache local
            for (const [url, cachedContent] of this.contentCache.entries()) {
                if (url !== content.url) {
                    const cachedHash = this.generateContentHash(cachedContent.content);
                    if (contentHash === cachedHash) {
                        return true;
                    }
                }
            }

            return false;

        } catch (error) {
            logger.warning(`⚠️ Erreur détection duplicata: ${error.message}`, 'ContentProcessor');
            return false;
        }
    }

    /**
     * Génère un hash du contenu pour la détection de duplicatas
     * @param {string} content - Contenu à hasher
     * @returns {string} Hash du contenu
     */
    generateContentHash(content) {
        if (!content) return '';

        // Normalisation pour la comparaison
        const normalized = content
            .toLowerCase()
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 1000); // Premiers 1000 caractères

        // Hash simple mais efficace
        let hash = 0;
        for (let i = 0; i < normalized.length; i++) {
            const char = normalized.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Conversion en 32bit
        }

        return hash.toString();
    }

    /**
     * Traite plusieurs pages en lot
     * @param {Array} pageData - Données des pages à traiter
     * @returns {Promise<Array>} Résultats du traitement
     */
    async processBatchContent(pageData) {
        if (!Array.isArray(pageData) || pageData.length === 0) {
            return [];
        }

        logger.info(`🔄 Traitement batch de ${pageData.length} contenus`, 'ContentProcessor');

        const results = [];
        const chunks = this.chunkArray(pageData, PERFORMANCE_CONFIG.CONCURRENT_ARTICLES);

        for (const [chunkIndex, chunk] of chunks.entries()) {
            logger.debug(`📦 Traitement chunk ${chunkIndex + 1}/${chunks.length}`, 'ContentProcessor');

            const chunkPromises = chunk.map(async (data) => {
                try {
                    const content = await this.processPageContent(data.page, data.url, data.options);
                    return { success: true, content, url: data.url };
                } catch (error) {
                    logger.warning(`⚠️ Erreur traitement ${data.url}: ${error.message}`, 'ContentProcessor');
                    return { success: false, error: error.message, url: data.url };
                }
            });

            const chunkResults = await Promise.allSettled(chunkPromises);
            results.push(...chunkResults.map(r => r.status === 'fulfilled' ? r.value : { success: false, error: 'Promise rejected' }));

            // Délai entre les chunks
            if (chunkIndex < chunks.length - 1) {
                await new Promise(resolve => setTimeout(resolve, PERFORMANCE_CONFIG.PROCESSING_DELAY));
            }
        }

        logger.info(`✅ Batch traité: ${results.filter(r => r.success).length}/${results.length} succès`, 'ContentProcessor');
        return results;
    }

    /**
     * Met à jour les statistiques de traitement
     * @param {number} processingTime - Temps de traitement en ms
     * @param {boolean} success - Succès du traitement
     */
    updateProcessingStats(processingTime, success) {
        this.processingStats.articlesProcessed++;
        this.processingStats.totalProcessingTime += processingTime;
        this.processingStats.averageProcessingTime =
            this.processingStats.totalProcessingTime / this.processingStats.articlesProcessed;

        if (!success) {
            this.processingStats.contentFailed++;
        }
    }

    /**
     * Nettoie le cache de contenu
     */
    cleanContentCache() {
        const entries = Array.from(this.contentCache.entries());
        this.contentCache.clear();

        // Garde les plus récents
        entries.slice(-Math.floor(CONTENT_CONFIG.MAX_CACHE_SIZE / 2)).forEach(([key, value]) => {
            this.contentCache.set(key, value);
        });

        logger.debug('🧹 Cache de contenu nettoyé', 'ContentProcessor');
    }

    /**
     * Divise un tableau en chunks
     */
    chunkArray(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }

    /**
     * Obtient les statistiques du processeur
     */
    getStats() {
        return {
            ...this.processingStats,
            cacheSize: this.contentCache.size,
            successRate: this.processingStats.articlesProcessed > 0
                ? (this.processingStats.contentExtracted / this.processingStats.articlesProcessed) * 100
                : 0
        };
    }

    /**
     * Remet à zéro le processeur
     */
    reset() {
        this.processingStats = {
            articlesProcessed: 0,
            contentExtracted: 0,
            contentFailed: 0,
            averageProcessingTime: 0,
            totalProcessingTime: 0,
            duplicatesFound: 0,
            validationFailures: 0
        };

        this.contentCache.clear();
        this.selectorCache.clear();
        this.processingQueue = [];
        this.isProcessing = false;

        logger.info('🔄 ContentProcessor réinitialisé', 'ContentProcessor');
    }
}

// Instance singleton
const contentProcessor = new ContentProcessor();

export { contentProcessor };
export default ContentProcessor;
