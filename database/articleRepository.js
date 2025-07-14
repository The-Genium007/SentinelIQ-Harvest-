/**
 * 📰 Repository pour la gestion des articles
 * Gère les opérations CRUD pour les tables articles et articlesUrl
 */

import { BaseRepository } from './baseRepository.js';
import { logManager } from '../utils/logManager.js';

/**
 * Repository pour les URLs d'articles (table articlesUrl)
 */
export class ArticleUrlRepository extends BaseRepository {
    constructor() {
        super('articlesUrl');
    }

    /**
     * ✅ Vérifie si un article existe par URL
     * @param {string} url - URL de l'article
     * @returns {Promise<boolean>} True si existe, false sinon
     */
    async existsByUrl(url) {
        try {
            if (!url) {
                return false;
            }

            return await this.exists({ url });

        } catch (error) {
            logManager.error(`Erreur existsByUrl dans articlesUrl: ${error.message}`, 'ArticleUrlRepository');
            return false;
        }
    }

    /**
     * 🔍 Trouve un article par URL
     * @param {string} url - URL de l'article
     * @returns {Promise<Object|null>} Article trouvé ou null
     */
    async findByUrl(url) {
        try {
            if (!url) {
                throw new Error('URL requise');
            }

            const article = await this.findOne({ url });

            logManager.debug(`Recherche article par URL: ${url} - ${article ? 'trouvé' : 'non trouvé'}`, 'ArticleUrlRepository');
            return article;

        } catch (error) {
            logManager.error(`Erreur findByUrl dans articlesUrl: ${error.message}`, 'ArticleUrlRepository');
            throw error;
        }
    }

    /**
     * ➕ Ajoute un nouvel article URL
     * @param {Object} articleData - Données de l'article
     * @param {string} articleData.url - URL de l'article
     * @param {string} articleData.titre - Titre de l'article
     * @param {string} articleData.description - Description de l'article
     * @param {string} articleData.datePublication - Date de publication
     * @param {string} articleData.source - Source de l'article (optionnel - ignoré si colonne inexistante)
     * @returns {Promise<Object>} Article créé
     */
    async addArticle(articleData) {
        try {
            const { url, titre, description, datePublication, source } = articleData;

            if (!url) {
                throw new Error('URL requise');
            }

            if (!titre) {
                throw new Error('Titre requis');
            }

            // Vérification de l'existence
            const exists = await this.existsByUrl(url);
            if (exists) {
                logManager.info(`Article déjà existant, ignoré: ${url}`, 'ArticleUrlRepository');
                return await this.findByUrl(url);
            }

            // Validation de l'URL
            try {
                new URL(url);
            } catch {
                throw new Error(`URL invalide: ${url}`);
            }

            // Données de base (colonnes qui existent certainement)
            const baseData = {
                url,
                titre: titre || '',
                description: description || '',
                datePublication: datePublication || new Date().toISOString(),
                created_at: new Date().toISOString()
            };

            // Ajouter source seulement si fourni (sera ignoré si colonne n'existe pas)
            if (source) {
                baseData.source = source;
            }

            const newArticle = await this.create(baseData);

            logManager.success(`Nouvel article ajouté: ${titre}`, 'ArticleUrlRepository');
            return newArticle;

        } catch (error) {
            // Si l'erreur est due à une colonne inexistante, réessayer sans source
            if (error.message.includes('does not exist') && articleData.source) {
                logManager.warn(`Colonne 'source' inexistante, réessai sans cette colonne`, 'ArticleUrlRepository');
                const { source, ...dataWithoutSource } = articleData;
                return await this.addArticle(dataWithoutSource);
            }

            logManager.error(`Erreur lors de l'ajout de l'article: ${error.message}`, 'ArticleUrlRepository');
            throw error;
        }
    }

    /**
     * 📋 Récupère les articles par source
     * @param {string} source - Source des articles
     * @param {Object} options - Options de requête
     * @returns {Promise<Array>} Liste des articles
     */
    async getBySource(source, options = {}) {
        try {
            const { limit = 100, offset = 0, orderBy = 'datePublication' } = options;

            const articles = await this.findAll({
                filters: { source },
                order: { column: orderBy, ascending: false },
                limit,
                offset
            });

            logManager.debug(`${articles.length} articles récupérés pour la source: ${source}`, 'ArticleUrlRepository');
            return articles;

        } catch (error) {
            logManager.error(`Erreur getBySource: ${error.message}`, 'ArticleUrlRepository');
            throw error;
        }
    }    /**
     * 📊 Statistiques des articles URL
     * @returns {Promise<Object>} Statistiques
     */
    async getStats() {
        try {
            const total = await this.count();

            // Statistiques par source (seulement si la colonne existe)
            let sourceStats = {};
            let sourcesCount = 0;

            try {
                const allArticles = await this.findAll({ select: 'source' });
                sourceStats = allArticles.reduce((acc, article) => {
                    const source = article.source || 'unknown';
                    acc[source] = (acc[source] || 0) + 1;
                    return acc;
                }, {});
                sourcesCount = Object.keys(sourceStats).length;
            } catch (error) {
                if (error.message.includes('does not exist')) {
                    logManager.warn('Colonne source inexistante, statistiques simplifiées', 'ArticleUrlRepository');
                    sourceStats = { note: 'Colonne source non disponible' };
                    sourcesCount = 0;
                } else {
                    throw error;
                }
            }

            const stats = {
                total,
                sources: sourceStats,
                sourcesCount
            };

            logManager.debug(`Statistiques articles URL: ${JSON.stringify(stats)}`, 'ArticleUrlRepository');
            return stats;

        } catch (error) {
            logManager.error(`Erreur lors du calcul des statistiques: ${error.message}`, 'ArticleUrlRepository');
            throw error;
        }
    }
}

/**
 * Repository pour les articles traités (table articles)
 */
export class ArticleRepository extends BaseRepository {
    constructor() {
        super('articles');
    }

    /**
     * ✅ Vérifie si un article existe par URL
     * @param {string} url - URL de l'article
     * @returns {Promise<boolean>} True si existe, false sinon
     */
    async existsByUrl(url) {
        try {
            if (!url) {
                return false;
            }

            return await this.exists({ url: url }); // Utiliser 'url' au lieu de 'urlArticle'

        } catch (error) {
            logManager.error(`Erreur existsByUrl dans articles: ${error.message}`, 'ArticleRepository');
            return false;
        }
    }    /**
     * 🔍 Trouve un article par URL
     * @param {string} url - URL de l'article
     * @returns {Promise<Object|null>} Article trouvé ou null
     */
    async findByUrl(url) {
        try {
            if (!url) {
                throw new Error('URL requise');
            }

            const article = await this.findOne({ url: url }); // Utiliser 'url' au lieu de 'urlArticle'

            logManager.debug(`Recherche article traité par URL: ${url} - ${article ? 'trouvé' : 'non trouvé'}`, 'ArticleRepository');
            return article;

        } catch (error) {
            logManager.error(`Erreur findByUrl dans articles: ${error.message}`, 'ArticleRepository');
            throw error;
        }
    }    /**
     * ➕ Enregistre un article traité
     * @param {Object} articleData - Données de l'article traité
     * @param {string} articleData.urlArticle - URL de l'article (sera mappé vers 'url')
     * @param {string} articleData.title - Titre de l'article
     * @param {string} articleData.content - Contenu de l'article
     * @param {string} articleData.dateRecuperation - Date de récupération (sera ignoré - pas de colonne)
     * @param {string} articleData.datePublication - Date de publication (sera mappé vers 'date')
     * @param {string} articleData.source - Source de l'article (ignoré - pas de colonne)
     * @param {Object} articleData.metadata - Métadonnées additionnelles (ignoré - pas de colonne)
     * @returns {Promise<Object>} Article enregistré
     */
    async saveProcessedArticle(articleData) {
        try {
            const url = articleData.urlArticle || articleData.url;
            const { title, content, datePublication } = articleData;

            if (!url) {
                throw new Error('URL article requise');
            }

            if (!title) {
                throw new Error('Titre requis');
            }

            if (!content) {
                throw new Error('Contenu requis');
            }

            // Vérification de l'existence
            const exists = await this.existsByUrl(url);
            if (exists) {
                logManager.info(`Article traité déjà existant, mise à jour: ${url}`, 'ArticleRepository');

                const existingArticle = await this.findByUrl(url);

                // Données de base pour la mise à jour (colonnes réelles: id, created_at, url, title, content, date)
                const updateData = {
                    title,
                    content
                };

                // Ajouter date de publication si fournie
                if (datePublication) {
                    updateData.publishDate = datePublication;
                }

                return await this.update(existingArticle.id, updateData);
            }

            // Validation de l'URL
            try {
                new URL(url);
            } catch {
                throw new Error(`URL invalide: ${url}`);
            }

            // Données de base (colonnes réelles: id, created_at, url, title, content, publishDate)
            const baseData = {
                url: url,
                title,
                content,
                created_at: new Date().toISOString()
            };

            // Ajouter date de publication si fournie
            if (datePublication) {
                baseData.publishDate = datePublication;
            }

            const newArticle = await this.create(baseData);

            logManager.success(`Article traité enregistré: ${title}`, 'ArticleRepository');
            return newArticle;

        } catch (error) {
            logManager.error(`Erreur lors de l'enregistrement de l'article traité: ${error.message}`, 'ArticleRepository');
            throw error;
        }
    }

    /**
     * 📋 Récupère les articles récents
     * @param {Object} options - Options de requête
     * @param {number} options.limit - Nombre d'articles à récupérer
     * @param {string} options.source - Filtrer par source
     * @param {Date} options.since - Articles depuis cette date
     * @returns {Promise<Array>} Liste des articles récents
     */
    async getRecentArticles(options = {}) {
        try {
            const { limit = 50, source = null, since = null } = options;

            let filters = {};
            if (source) {
                filters.source = source;
            }
            if (since) {
                filters.dateRecuperation = {
                    operator: 'gte',
                    value: since.toISOString()
                };
            }

            const articles = await this.findAll({
                filters,
                order: { column: 'dateRecuperation', ascending: false },
                limit
            });

            logManager.debug(`${articles.length} articles récents récupérés`, 'ArticleRepository');
            return articles;

        } catch (error) {
            logManager.error(`Erreur getRecentArticles: ${error.message}`, 'ArticleRepository');
            throw error;
        }
    }

    /**
     * 🔍 Recherche d'articles par contenu
     * @param {string} searchTerm - Terme de recherche
     * @param {Object} options - Options de recherche
     * @returns {Promise<Array>} Articles correspondants
     */
    async searchArticles(searchTerm, options = {}) {
        try {
            const { limit = 20, searchFields = ['title', 'content'] } = options;

            if (!searchTerm) {
                throw new Error('Terme de recherche requis');
            }

            const filters = {};

            // Recherche dans le titre si spécifié
            if (searchFields.includes('title')) {
                filters.title = {
                    operator: 'ilike',
                    value: `%${searchTerm}%`
                };
            }

            const articles = await this.findAll({
                filters,
                limit,
                order: { column: 'dateRecuperation', ascending: false }
            });

            logManager.debug(`${articles.length} articles trouvés pour "${searchTerm}"`, 'ArticleRepository');
            return articles;

        } catch (error) {
            logManager.error(`Erreur searchArticles: ${error.message}`, 'ArticleRepository');
            throw error;
        }
    }    /**
     * 📊 Statistiques des articles traités
     * @returns {Promise<Object>} Statistiques
     */
    async getStats() {
        try {
            const total = await this.count();

            // Pas de colonne dateRecuperation, utiliser created_at pour les statistiques récentes
            let recent = 0;
            try {
                const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
                recent = await this.count({
                    created_at: {
                        operator: 'gte',
                        value: yesterday.toISOString()
                    }
                });
            } catch (error) {
                logManager.warn('Erreur lors du comptage des articles récents', 'ArticleRepository');
            }

            // Pas de colonne source dans cette table
            const stats = {
                total,
                recent24h: recent,
                sources: { note: 'Colonne source non disponible' },
                sourcesCount: 0
            };

            logManager.debug(`Statistiques articles traités: ${JSON.stringify(stats)}`, 'ArticleRepository');
            return stats;

        } catch (error) {
            logManager.error(`Erreur lors du calcul des statistiques: ${error.message}`, 'ArticleRepository');
            throw error;
        }
    }
}

// Instances singleton
export const articleUrlRepository = new ArticleUrlRepository();
export const articleRepository = new ArticleRepository();
