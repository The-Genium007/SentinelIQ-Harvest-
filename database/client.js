/**
 * 🗄️ Configuration et client Supabase centralisé
 * Gère la connexion et la configuration de base pour Supabase
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { logManager, LOG_TYPES, LOG_LEVELS } from '../utils/logManager.js';

// Chargement des variables d'environnement
dotenv.config({ path: './key.env' });

/**
 * Configuration Supabase
 */
const SUPABASE_CONFIG = {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_KEY,
    options: {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: false
        },
        realtime: {
            enabled: false // Désactivé par défaut pour les performances
        }
    }
};

/**
 * Validation de la configuration
 */
function validateConfig() {
    if (!SUPABASE_CONFIG.url || !SUPABASE_CONFIG.key) {
        const error = new Error('Variables d\'environnement Supabase manquantes (SUPABASE_URL ou SUPABASE_KEY)');
        logManager.error(error.message, 'SupabaseClient');
        throw error;
    }

    if (!SUPABASE_CONFIG.url.startsWith('https://')) {
        const error = new Error('SUPABASE_URL doit commencer par https://');
        logManager.error(error.message, 'SupabaseClient');
        throw error;
    }
}

/**
 * Client Supabase singleton
 */
class SupabaseClient {
    constructor() {
        this.client = null;
        this.isConnected = false;
        this.lastConnectionTest = null;
        this.connectionTestInterval = 5 * 60 * 1000; // 5 minutes
    }

    /**
     * Initialise le client Supabase
     * @returns {Object} Client Supabase
     */
    async initialize() {
        if (this.client) {
            return this.client;
        }

        try {
            validateConfig();

            this.client = createClient(
                SUPABASE_CONFIG.url,
                SUPABASE_CONFIG.key,
                SUPABASE_CONFIG.options
            );

            logManager.success('Client Supabase initialisé', 'SupabaseClient');
            return this.client;

        } catch (error) {
            logManager.error(`Erreur lors de l'initialisation : ${error.message}`, 'SupabaseClient');
            throw error;
        }
    }

    /**
     * Obtient le client Supabase (avec initialisation automatique)
     * @returns {Object} Client Supabase
     */
    async getClient() {
        if (!this.client) {
            await this.initialize();
        }
        return this.client;
    }

    /**
     * Teste la connexion à Supabase
     * @param {boolean} force - Forcer le test même si récent
     * @returns {Promise<boolean>} Résultat du test
     */
    async testConnection(force = false) {
        const now = Date.now();

        // Test en cache si récent et pas forcé
        if (!force && this.lastConnectionTest &&
            (now - this.lastConnectionTest) < this.connectionTestInterval) {
            return this.isConnected;
        }

        try {
            const client = await this.getClient();
            const { error } = await client.from('ListUrlRss').select('id').limit(1);

            if (error) {
                throw new Error(error.message);
            }

            this.isConnected = true;
            this.lastConnectionTest = now;

            logManager.success('Test de connexion Supabase réussi', 'SupabaseClient');
            return true;

        } catch (error) {
            this.isConnected = false;
            logManager.error(`Test de connexion échoué : ${error.message}`, 'SupabaseClient');
            throw error;
        }
    }

    /**
     * Obtient les informations de santé de la connexion
     * @returns {Object} Informations de santé
     */
    getHealthInfo() {
        return {
            isConnected: this.isConnected,
            lastConnectionTest: this.lastConnectionTest,
            clientInitialized: !!this.client,
            config: {
                hasUrl: !!SUPABASE_CONFIG.url,
                hasKey: !!SUPABASE_CONFIG.key,
                url: SUPABASE_CONFIG.url ? SUPABASE_CONFIG.url.substring(0, 20) + '...' : null
            }
        };
    }

    /**
     * Réinitialise la connexion
     */
    async reset() {
        logManager.info('Réinitialisation du client Supabase', 'SupabaseClient');
        this.client = null;
        this.isConnected = false;
        this.lastConnectionTest = null;
        await this.initialize();
    }
}

// Instance singleton
export const supabaseClient = new SupabaseClient();

// Export du client pour compatibilité
export async function getSupabaseClient() {
    return await supabaseClient.getClient();
}

// Export de la fonction de test pour compatibilité
export async function testSupabaseConnection() {
    return await supabaseClient.testConnection();
}

// Export des informations de configuration
export { SUPABASE_CONFIG };
