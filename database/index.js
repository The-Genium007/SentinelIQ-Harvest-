/**
 * 🗄️ Point d'entrée principal pour la couche de données
 * Exports centralisés et utilitaires pour la base de données
 */

// Exports des clients et configuration
export {
    supabaseClient,
    getSupabaseClient,
    testSupabaseConnection,
    SUPABASE_CONFIG
} from './client.js';

// Export de la classe de base
export { BaseRepository } from './baseRepository.js';

// Exports des repositories spécialisés
export {
    RssRepository,
    rssRepository
} from './rssRepository.js';

export {
    ArticleUrlRepository,
    ArticleRepository,
    articleUrlRepository,
    articleRepository
} from './articleRepository.js';

// Imports pour les fonctions utilitaires
import { supabaseClient } from './client.js';
import { rssRepository } from './rssRepository.js';
import { articleUrlRepository, articleRepository } from './articleRepository.js';
import { logManager } from '../utils/logManager.js';

/**
 * 🔧 Utilitaires et fonctions d'aide pour la base de données
 */
export class DatabaseUtils {
    /**
     * 🏥 Vérifie la santé de toutes les connexions
     * @returns {Promise<Object>} Rapport de santé complet
     */
    static async healthCheck() {
        try {
            const startTime = Date.now();

            // Test de connexion
            const connectionTest = await supabaseClient.testConnection();

            // Statistiques des repositories
            const [rssStats, articleUrlStats, articleStats] = await Promise.all([
                rssRepository.getStats().catch(err => ({ error: err.message })),
                articleUrlRepository.getStats().catch(err => ({ error: err.message })),
                articleRepository.getStats().catch(err => ({ error: err.message }))
            ]);

            const responseTime = Date.now() - startTime;

            const healthReport = {
                timestamp: new Date().toISOString(),
                status: connectionTest ? 'healthy' : 'unhealthy',
                responseTime: responseTime,
                connection: {
                    isConnected: connectionTest,
                    ...supabaseClient.getHealthInfo()
                },
                repositories: {
                    rss: rssStats,
                    articleUrl: articleUrlStats,
                    article: articleStats
                }
            };

            logManager.info(`Health check terminé: ${healthReport.status} (${responseTime}ms)`, 'DatabaseUtils');
            return healthReport;

        } catch (error) {
            logManager.error(`Erreur lors du health check: ${error.message}`, 'DatabaseUtils');
            return {
                timestamp: new Date().toISOString(),
                status: 'error',
                error: error.message,
                connection: supabaseClient.getHealthInfo()
            };
        }
    }

    /**
     * 🔄 Initialise tous les repositories
     * @returns {Promise<boolean>} Succès de l'initialisation
     */
    static async initializeAll() {
        try {
            logManager.info('Initialisation de tous les repositories...', 'DatabaseUtils');

            await Promise.all([
                rssRepository.initialize(),
                articleUrlRepository.initialize(),
                articleRepository.initialize()
            ]);

            logManager.success('Tous les repositories initialisés avec succès', 'DatabaseUtils');
            return true;

        } catch (error) {
            logManager.error(`Erreur lors de l'initialisation: ${error.message}`, 'DatabaseUtils');
            throw error;
        }
    }

    /**
     * 📊 Rapport complet des statistiques
     * @returns {Promise<Object>} Statistiques globales
     */
    static async getGlobalStats() {
        try {
            const [rssStats, articleUrlStats, articleStats] = await Promise.all([
                rssRepository.getStats(),
                articleUrlRepository.getStats(),
                articleRepository.getStats()
            ]);

            const globalStats = {
                timestamp: new Date().toISOString(),
                rssFeeds: rssStats,
                articleUrls: articleUrlStats,
                processedArticles: articleStats,
                summary: {
                    totalRssFeeds: rssStats.total,
                    activeRssFeeds: rssStats.active,
                    totalArticleUrls: articleUrlStats.total,
                    totalProcessedArticles: articleStats.total,
                    recentProcessedArticles: articleStats.recent24h
                }
            };

            logManager.debug('Statistiques globales calculées', 'DatabaseUtils');
            return globalStats;

        } catch (error) {
            logManager.error(`Erreur lors du calcul des statistiques globales: ${error.message}`, 'DatabaseUtils');
            throw error;
        }
    }

    /**
     * 🧹 Fonctions de maintenance
     */
    static async maintenance() {
        try {
            logManager.info('Début de la maintenance de la base de données...', 'DatabaseUtils');

            // Test de connexion
            await supabaseClient.testConnection(true); // Force le test

            // Rafraîchissement des clients
            await this.initializeAll();

            logManager.success('Maintenance terminée avec succès', 'DatabaseUtils');
            return true;

        } catch (error) {
            logManager.error(`Erreur lors de la maintenance: ${error.message}`, 'DatabaseUtils');
            throw error;
        }
    }
}

/**
 * 🚀 Fonctions de compatibilité pour l'ancien code
 * Permet une migration en douceur depuis les anciens supabaseUtils
 */

/**
 * Compatibilité: Récupère les flux RSS (WireScanner)
 * @deprecated Utiliser rssRepository.getAllFeeds() à la place
 */
export async function getRssFeeds() {
    logManager.warn('Utilisation de getRssFeeds() dépréciée. Utiliser rssRepository.getAllFeeds()', 'DatabaseUtils');
    return await rssRepository.getAllFeeds();
}

/**
 * Compatibilité: Test de connexion Supabase
 * @deprecated Utiliser testSupabaseConnection() depuis client.js
 */
export async function testSupabase() {
    logManager.warn('Utilisation de testSupabase() dépréciée. Utiliser testSupabaseConnection()', 'DatabaseUtils');
    return await supabaseClient.testConnection();
}

/**
 * Compatibilité: Vérifie l'existence d'un article (WireScanner)
 * @deprecated Utiliser articleUrlRepository.existsByUrl()
 */
export async function articleExists(url) {
    logManager.warn('Utilisation de articleExists() dépréciée. Utiliser articleUrlRepository.existsByUrl()', 'DatabaseUtils');
    return await articleUrlRepository.existsByUrl(url);
}

/**
 * Compatibilité: Insère un article (WireScanner)
 * @deprecated Utiliser articleUrlRepository.addArticle()
 */
export async function insertArticle(articleData) {
    logManager.warn('Utilisation de insertArticle() dépréciée. Utiliser articleUrlRepository.addArticle()', 'DatabaseUtils');
    return await articleUrlRepository.addArticle(articleData);
}

/**
 * Compatibilité: Récupère un article URL (Cortex)
 * @deprecated Utiliser articleUrlRepository.findByUrl()
 */
export async function getUrlArticle(url) {
    logManager.warn('Utilisation de getUrlArticle() dépréciée. Utiliser articleUrlRepository.findByUrl()', 'DatabaseUtils');
    return await articleUrlRepository.findByUrl(url);
}

/**
 * Compatibilité: Enregistre un article traité (Cortex)
 * @deprecated Utiliser articleRepository.saveProcessedArticle()
 */
export async function enregistrerArticle(articleData) {
    logManager.warn('Utilisation de enregistrerArticle() dépréciée. Utiliser articleRepository.saveProcessedArticle()', 'DatabaseUtils');
    return await articleRepository.saveProcessedArticle(articleData);
}

// Note: Les fonctions de compatibilité sont déjà exportées individuellement ci-dessus
