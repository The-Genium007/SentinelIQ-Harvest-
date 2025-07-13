/**
 * 📡 Repository pour la gestion des flux RSS
 * Gère les opérations CRUD pour la table ListUrlRss
 */

import { BaseRepository } from './baseRepository.js';
import { logManager } from '../utils/logManager.js';

/**
 * Repository spécialisé pour les flux RSS
 */
export class RssRepository extends BaseRepository {
    constructor() {
        super('ListUrlRss');
    }

    /**
     * 📋 Récupère tous les flux RSS actifs
     * @param {boolean} activeOnly - Ne récupérer que les flux actifs (ignoré - pas de colonne active)
     * @returns {Promise<Array>} Liste des flux RSS
     */
    async getAllFeeds(activeOnly = true) {
        try {
            // Note: la table ListUrlRss n'a que id, created_at et url
            // Il n'y a pas de colonne 'active' dans cette table
            const feeds = await this.findAll({
                select: 'id, url, created_at',
                order: { column: 'created_at', ascending: false }
            });

            logManager.info(`${feeds.length} flux RSS récupérés`, 'RssRepository');
            return feeds.map(feed => ({
                id: feed.id,
                url_rss: feed.url, // Conversion pour compatibilité
                url: feed.url,
                created_at: feed.created_at,
                active: true // Tous considérés comme actifs par défaut
            }));

        } catch (error) {
            logManager.error(`Erreur lors de la récupération des flux RSS: ${error.message}`, 'RssRepository');
            throw error;
        }
    }    /**
     * 🔍 Trouve un flux RSS par URL
     * @param {string} url - URL du flux RSS
     * @returns {Promise<Object|null>} Flux RSS trouvé ou null
     */
    async findByUrl(url) {
        try {
            if (!url) {
                throw new Error('URL requise');
            }

            const feed = await this.findOne({ url: url }); // Utiliser 'url' au lieu de 'url_rss'

            logManager.debug(`Recherche flux RSS par URL: ${url} - ${feed ? 'trouvé' : 'non trouvé'}`, 'RssRepository');

            if (feed) {
                // Conversion pour compatibilité
                return {
                    ...feed,
                    url_rss: feed.url,
                    active: true
                };
            }

            return null;

        } catch (error) {
            logManager.error(`Erreur findByUrl: ${error.message}`, 'RssRepository');
            throw error;
        }
    }

    /**
     * ✅ Vérifie si un flux RSS existe par URL
     * @param {string} url - URL du flux RSS
     * @returns {Promise<boolean>} True si existe, false sinon
     */
    async existsByUrl(url) {
        try {
            if (!url) {
                return false;
            }

            return await this.exists({ url: url }); // Utiliser 'url' au lieu de 'url_rss'

        } catch (error) {
            logManager.error(`Erreur existsByUrl: ${error.message}`, 'RssRepository');
            return false;
        }
    }

    /**
     * ➕ Ajoute un nouveau flux RSS
     * @param {Object} feedData - Données du flux RSS
     * @param {string} feedData.url_rss - URL du flux RSS
     * @param {string} feedData.titre - Titre du flux (ignoré - pas de colonne)
     * @param {string} feedData.description - Description du flux (ignoré - pas de colonne)
     * @param {boolean} feedData.active - Statut actif/inactif (ignoré - pas de colonne)
     * @returns {Promise<Object>} Flux RSS créé
     */
    async addFeed(feedData) {
        try {
            const url = feedData.url_rss || feedData.url;

            if (!url) {
                throw new Error('URL RSS requise');
            }

            // Vérification de l'existence
            const exists = await this.existsByUrl(url);
            if (exists) {
                throw new Error(`Un flux RSS avec cette URL existe déjà: ${url}`);
            }

            // Validation de l'URL
            try {
                new URL(url);
            } catch {
                throw new Error(`URL RSS invalide: ${url}`);
            }

            // La table ListUrlRss n'a que les colonnes: id, url, created_at
            const newFeed = await this.create({
                url: url,
                created_at: new Date().toISOString()
            });

            logManager.success(`Nouveau flux RSS ajouté: ${url}`, 'RssRepository');

            // Retourner avec format de compatibilité
            return {
                ...newFeed,
                url_rss: newFeed.url,
                titre: feedData.titre || '',
                description: feedData.description || '',
                active: true
            };

        } catch (error) {
            logManager.error(`Erreur lors de l'ajout du flux RSS: ${error.message}`, 'RssRepository');
            throw error;
        }
    }

    /**
     * 📝 Met à jour un flux RSS
     * @param {string|number} id - ID du flux RSS
     * @param {Object} updateData - Données à mettre à jour
     * @returns {Promise<Object>} Flux RSS mis à jour
     */
    async updateFeed(id, updateData) {
        try {
            if (!id) {
                throw new Error('ID requis');
            }

            // Vérification de l'existence
            const existingFeed = await this.findById(id);
            if (!existingFeed) {
                throw new Error(`Flux RSS non trouvé avec l'ID: ${id}`);
            }

            // Si l'URL est modifiée, vérifier qu'elle n'existe pas déjà
            if (updateData.url_rss && updateData.url_rss !== existingFeed.url_rss) {
                const urlExists = await this.existsByUrl(updateData.url_rss);
                if (urlExists) {
                    throw new Error(`Un flux RSS avec cette URL existe déjà: ${updateData.url_rss}`);
                }

                // Validation de la nouvelle URL
                try {
                    new URL(updateData.url_rss);
                } catch {
                    throw new Error(`URL RSS invalide: ${updateData.url_rss}`);
                }
            }

            const updatedFeed = await this.update(id, {
                ...updateData,
                updated_at: new Date().toISOString()
            });

            logManager.success(`Flux RSS mis à jour: ${existingFeed.titre}`, 'RssRepository');
            return updatedFeed;

        } catch (error) {
            logManager.error(`Erreur lors de la mise à jour du flux RSS: ${error.message}`, 'RssRepository');
            throw error;
        }
    }

    /**
     * 🔄 Active/désactive un flux RSS
     * @param {string|number} id - ID du flux RSS
     * @param {boolean} active - Nouveau statut
     * @returns {Promise<Object>} Flux RSS mis à jour
     */
    async toggleFeedStatus(id, active) {
        try {
            if (!id) {
                throw new Error('ID requis');
            }

            const feed = await this.updateFeed(id, { active });

            logManager.info(`Flux RSS ${active ? 'activé' : 'désactivé'}: ${feed.titre}`, 'RssRepository');
            return feed;

        } catch (error) {
            logManager.error(`Erreur lors du changement de statut: ${error.message}`, 'RssRepository');
            throw error;
        }
    }

    /**
     * 🗑️ Supprime un flux RSS
     * @param {string|number} id - ID du flux RSS
     * @returns {Promise<boolean>} True si supprimé avec succès
     */
    async deleteFeed(id) {
        try {
            if (!id) {
                throw new Error('ID requis');
            }

            // Vérification de l'existence
            const existingFeed = await this.findById(id, 'titre');
            if (!existingFeed) {
                throw new Error(`Flux RSS non trouvé avec l'ID: ${id}`);
            }

            const success = await this.delete(id);

            if (success) {
                logManager.success(`Flux RSS supprimé: ${existingFeed.titre}`, 'RssRepository');
            }

            return success;

        } catch (error) {
            logManager.error(`Erreur lors de la suppression du flux RSS: ${error.message}`, 'RssRepository');
            throw error;
        }
    }

    /**
     * 📊 Statistiques des flux RSS
     * @returns {Promise<Object>} Statistiques
     */
    async getStats() {
        try {
            const total = await this.count();

            // Pas de colonne 'active' dans cette table, tous sont considérés comme actifs
            const stats = {
                total,
                active: total, // Tous sont considérés comme actifs
                inactive: 0,
                percentage_active: 100
            };

            logManager.debug(`Statistiques flux RSS: ${JSON.stringify(stats)}`, 'RssRepository');
            return stats;

        } catch (error) {
            logManager.error(`Erreur lors du calcul des statistiques: ${error.message}`, 'RssRepository');
            throw error;
        }
    }
}

// Instance singleton
export const rssRepository = new RssRepository();
