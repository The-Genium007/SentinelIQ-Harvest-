/**
 * 🎯 Couche d'abstraction pour les opérations de base de données
 * Fournit des méthodes génériques et réutilisables pour toutes les tables
 */

import { supabaseClient } from './client.js';
import { logManager } from '../utils/logManager.js';

/**
 * Classe de base pour les opérations de données
 */
export class BaseRepository {
    constructor(tableName) {
        this.tableName = tableName;
        this.client = null;
    }

    /**
     * Initialise le repository avec le client Supabase
     */
    async initialize() {
        if (!this.client) {
            this.client = await supabaseClient.getClient();
        }
        return this.client;
    }

    /**
     * Obtient le client (avec initialisation automatique)
     */
    async getClient() {
        if (!this.client) {
            await this.initialize();
        }
        return this.client;
    }

    /**
     * 📋 Récupère tous les enregistrements d'une table
     * @param {Object} options - Options de requête
     * @param {string} options.select - Colonnes à sélectionner (défaut: '*')
     * @param {Object} options.filters - Filtres à appliquer
     * @param {Object} options.order - Tri à appliquer
     * @param {number} options.limit - Limite d'enregistrements
     * @param {number} options.offset - Décalage pour pagination
     * @returns {Promise<Array>} Liste des enregistrements
     */
    async findAll(options = {}) {
        const {
            select = '*',
            filters = {},
            order = null,
            limit = null,
            offset = null
        } = options;

        try {
            const client = await this.getClient();
            let query = client.from(this.tableName).select(select);

            // Application des filtres
            for (const [column, value] of Object.entries(filters)) {
                if (value !== undefined && value !== null) {
                    if (typeof value === 'object' && value.operator) {
                        // Filtres avancés avec opérateurs
                        switch (value.operator) {
                            case 'like':
                                query = query.like(column, value.value);
                                break;
                            case 'ilike':
                                query = query.ilike(column, value.value);
                                break;
                            case 'in':
                                query = query.in(column, value.value);
                                break;
                            case 'gte':
                                query = query.gte(column, value.value);
                                break;
                            case 'lte':
                                query = query.lte(column, value.value);
                                break;
                            case 'gt':
                                query = query.gt(column, value.value);
                                break;
                            case 'lt':
                                query = query.lt(column, value.value);
                                break;
                            case 'neq':
                                query = query.neq(column, value.value);
                                break;
                            default:
                                query = query.eq(column, value.value);
                        }
                    } else {
                        // Filtre simple (égalité)
                        query = query.eq(column, value);
                    }
                }
            }

            // Application du tri
            if (order) {
                if (typeof order === 'string') {
                    query = query.order(order);
                } else if (typeof order === 'object') {
                    const { column, ascending = true } = order;
                    query = query.order(column, { ascending });
                }
            }

            // Application de la limite et du décalage
            if (limit) {
                query = query.limit(limit);
            }
            if (offset) {
                query = query.range(offset, offset + (limit || 1000) - 1);
            }

            const { data, error } = await query;

            if (error) {
                throw new Error(`Erreur lors de la récupération de ${this.tableName}: ${error.message}`);
            }

            logManager.info(`${data?.length || 0} enregistrements récupérés de ${this.tableName}`, 'BaseRepository');
            return data || [];

        } catch (error) {
            logManager.error(`Erreur findAll ${this.tableName}: ${error.message}`, 'BaseRepository');
            throw error;
        }
    }

    /**
     * 🔍 Trouve un enregistrement par ID
     * @param {string|number} id - ID de l'enregistrement
     * @param {string} select - Colonnes à sélectionner
     * @returns {Promise<Object|null>} Enregistrement trouvé ou null
     */
    async findById(id, select = '*') {
        try {
            const client = await this.getClient();
            const { data, error } = await client
                .from(this.tableName)
                .select(select)
                .eq('id', id)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 = pas trouvé
                throw new Error(`Erreur lors de la recherche par ID: ${error.message}`);
            }

            logManager.debug(`Recherche par ID ${id} dans ${this.tableName}: ${data ? 'trouvé' : 'non trouvé'}`, 'BaseRepository');
            return data;

        } catch (error) {
            logManager.error(`Erreur findById ${this.tableName}: ${error.message}`, 'BaseRepository');
            throw error;
        }
    }

    /**
     * 🔎 Trouve un enregistrement selon des critères
     * @param {Object} criteria - Critères de recherche
     * @param {string} select - Colonnes à sélectionner
     * @returns {Promise<Object|null>} Premier enregistrement trouvé ou null
     */
    async findOne(criteria, select = '*') {
        try {
            const results = await this.findAll({
                select,
                filters: criteria,
                limit: 1
            });

            return results.length > 0 ? results[0] : null;

        } catch (error) {
            logManager.error(`Erreur findOne ${this.tableName}: ${error.message}`, 'BaseRepository');
            throw error;
        }
    }

    /**
     * ✅ Vérifie l'existence d'un enregistrement
     * @param {Object} criteria - Critères de recherche
     * @returns {Promise<boolean>} True si existe, false sinon
     */
    async exists(criteria) {
        try {
            const result = await this.findOne(criteria, 'id');
            return !!result;

        } catch (error) {
            logManager.error(`Erreur exists ${this.tableName}: ${error.message}`, 'BaseRepository');
            throw error;
        }
    }

    /**
     * 📊 Compte les enregistrements
     * @param {Object} filters - Filtres à appliquer
     * @returns {Promise<number>} Nombre d'enregistrements
     */
    async count(filters = {}) {
        try {
            const client = await this.getClient();
            let query = client.from(this.tableName).select('*', { count: 'exact', head: true });

            // Application des filtres
            for (const [column, value] of Object.entries(filters)) {
                if (value !== undefined && value !== null) {
                    if (typeof value === 'object' && value.operator) {
                        // Filtres avancés avec opérateurs
                        switch (value.operator) {
                            case 'like':
                                query = query.like(column, value.value);
                                break;
                            case 'ilike':
                                query = query.ilike(column, value.value);
                                break;
                            case 'in':
                                query = query.in(column, value.value);
                                break;
                            case 'gte':
                                query = query.gte(column, value.value);
                                break;
                            case 'lte':
                                query = query.lte(column, value.value);
                                break;
                            case 'gt':
                                query = query.gt(column, value.value);
                                break;
                            case 'lt':
                                query = query.lt(column, value.value);
                                break;
                            case 'neq':
                                query = query.neq(column, value.value);
                                break;
                            default:
                                query = query.eq(column, value.value);
                        }
                    } else {
                        // Filtre simple (égalité)
                        query = query.eq(column, value);
                    }
                }
            }

            const { count, error } = await query;

            if (error) {
                // Si l'erreur concerne une colonne qui n'existe pas, ignorer et compter sans filtre
                if (error.message.includes('does not exist') && Object.keys(filters).length > 0) {
                    logManager.warn(`Colonne inexistante détectée, comptage sans filtres pour ${this.tableName}`, 'BaseRepository');
                    return await this.count(); // Récursion sans filtres
                }
                throw new Error(`Erreur lors du comptage: ${error.message}`);
            }

            logManager.debug(`Comptage ${this.tableName}: ${count} enregistrements`, 'BaseRepository');
            return count || 0;

        } catch (error) {
            logManager.error(`Erreur count ${this.tableName}: ${error.message}`, 'BaseRepository');
            throw error;
        }
    }

    /**
     * ➕ Crée un nouvel enregistrement
     * @param {Object} data - Données à insérer
     * @param {string} select - Colonnes à retourner
     * @returns {Promise<Object>} Enregistrement créé
     */
    async create(data, select = '*') {
        try {
            const client = await this.getClient();
            const { data: result, error } = await client
                .from(this.tableName)
                .insert(data)
                .select(select)
                .single();

            if (error) {
                throw new Error(`Erreur lors de l'insertion: ${error.message}`);
            }

            logManager.success(`Nouvel enregistrement créé dans ${this.tableName}`, 'BaseRepository');
            return result;

        } catch (error) {
            logManager.error(`Erreur create ${this.tableName}: ${error.message}`, 'BaseRepository');
            throw error;
        }
    }

    /**
     * 📝 Met à jour un enregistrement
     * @param {string|number} id - ID de l'enregistrement
     * @param {Object} data - Nouvelles données
     * @param {string} select - Colonnes à retourner
     * @returns {Promise<Object>} Enregistrement mis à jour
     */
    async update(id, data, select = '*') {
        try {
            const client = await this.getClient();
            const { data: result, error } = await client
                .from(this.tableName)
                .update(data)
                .eq('id', id)
                .select(select)
                .single();

            if (error) {
                throw new Error(`Erreur lors de la mise à jour: ${error.message}`);
            }

            logManager.success(`Enregistrement ${id} mis à jour dans ${this.tableName}`, 'BaseRepository');
            return result;

        } catch (error) {
            logManager.error(`Erreur update ${this.tableName}: ${error.message}`, 'BaseRepository');
            throw error;
        }
    }

    /**
     * 🗑️ Supprime un enregistrement
     * @param {string|number} id - ID de l'enregistrement
     * @returns {Promise<boolean>} True si supprimé avec succès
     */
    async delete(id) {
        try {
            const client = await this.getClient();
            const { error } = await client
                .from(this.tableName)
                .delete()
                .eq('id', id);

            if (error) {
                throw new Error(`Erreur lors de la suppression: ${error.message}`);
            }

            logManager.success(`Enregistrement ${id} supprimé de ${this.tableName}`, 'BaseRepository');
            return true;

        } catch (error) {
            logManager.error(`Erreur delete ${this.tableName}: ${error.message}`, 'BaseRepository');
            throw error;
        }
    }

    /**
     * 🔄 Upsert (insert ou update)
     * @param {Object} data - Données à insérer/mettre à jour
     * @param {Object} options - Options d'upsert
     * @param {string} options.onConflict - Colonnes de conflit
     * @param {string} options.select - Colonnes à retourner
     * @returns {Promise<Object>} Enregistrement créé/mis à jour
     */
    async upsert(data, options = {}) {
        const { onConflict = 'id', select = '*' } = options;

        try {
            const client = await this.getClient();
            const { data: result, error } = await client
                .from(this.tableName)
                .upsert(data, { onConflict })
                .select(select)
                .single();

            if (error) {
                throw new Error(`Erreur lors de l'upsert: ${error.message}`);
            }

            logManager.success(`Enregistrement upsert dans ${this.tableName}`, 'BaseRepository');
            return result;

        } catch (error) {
            logManager.error(`Erreur upsert ${this.tableName}: ${error.message}`, 'BaseRepository');
            throw error;
        }
    }
}
