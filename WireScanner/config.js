/**
 * 🔧 Configuration et constantes pour WireScanner
 * Centralise tous les paramètres de configuration
 */

export const PERFORMANCE_CONFIG = {
    // Limites de performance
    MAX_CONCURRENT_FEEDS: 5,        // Nombre max de flux traités en parallèle
    MAX_CONCURRENT_ARTICLES: 10,    // Nombre max d'articles traités en parallèle
    BATCH_SIZE: 50,                 // Taille des lots pour les opérations DB
    REQUEST_TIMEOUT: 30000,         // Timeout pour les requêtes HTTP (30s)
    MEMORY_THRESHOLD: 100,          // Seuil mémoire en MB pour pause GC

    // Délais et retry
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY_BASE: 1000,         // Délai de base pour retry (1s)
    BACKOFF_MULTIPLIER: 2,          // Multiplicateur pour backoff exponentiel

    // Cache et optimisations
    FEED_CACHE_TTL: 300000,         // Cache TTL pour les flux (5 min)
    ARTICLE_BATCH_DELAY: 100,       // Délai entre les lots d'articles (ms)
    GC_INTERVAL: 60000,             // Intervalle de garbage collection forcé
};

export const LOGGING_CONFIG = {
    // Niveaux de logging
    LOG_LEVEL: process.env.LOG_LEVEL || 'INFO',

    // Performance logging
    ENABLE_PERFORMANCE_LOGS: process.env.ENABLE_PERF_LOGS === 'true',
    ENABLE_MEMORY_MONITORING: process.env.ENABLE_MEM_MONITOR === 'true',

    // Formats
    LOG_FORMAT: 'timestamp',
    INCLUDE_STACK_TRACE: false,
};

export const DATABASE_CONFIG = {
    // Optimisations DB
    CONNECTION_POOL_SIZE: 5,
    QUERY_TIMEOUT: 10000,           // 10s timeout pour les requêtes
    BATCH_INSERT_SIZE: 100,         // Taille des insertions par lot

    // Cache
    ENABLE_QUERY_CACHE: true,
    CACHE_TTL: 300000,              // 5 minutes
};

export const RSS_CONFIG = {
    // Parsing RSS
    USER_AGENT: 'SentinelIQ-Harvest/1.0 (RSS Crawler)',
    FOLLOW_REDIRECTS: true,
    MAX_REDIRECTS: 5,

    // Filtres
    MIN_ARTICLE_LENGTH: 50,         // Longueur minimum du titre
    MAX_ARTICLE_AGE_DAYS: 30,       // Articles plus anciens ignorés

    // Validation
    VALIDATE_FEED_STRUCTURE: true,
    SKIP_INVALID_ARTICLES: true,
};

export const PATHS = {
    LOG_FILE: 'cron-task.log',
    ENV_FILE: '../key.env',
    TEMP_DIR: './temp',
};

/**
 * Fonction pour obtenir la configuration d'environnement
 * @returns {Object} Configuration complète
 */
export function getConfig() {
    return {
        performance: PERFORMANCE_CONFIG,
        logging: LOGGING_CONFIG,
        database: DATABASE_CONFIG,
        rss: RSS_CONFIG,
        paths: PATHS,

        // Configuration d'environnement
        env: {
            NODE_ENV: process.env.NODE_ENV || 'production',
            DEBUG: process.env.DEBUG === 'true',
            VERBOSE: process.env.VERBOSE === 'true',
        }
    };
}

/**
 * Mise à jour dynamique de la configuration
 * @param {string} section - Section à modifier
 * @param {Object} updates - Mises à jour
 */
export function updateConfig(section, updates) {
    const configs = {
        performance: PERFORMANCE_CONFIG,
        logging: LOGGING_CONFIG,
        database: DATABASE_CONFIG,
        rss: RSS_CONFIG
    };

    if (configs[section]) {
        Object.assign(configs[section], updates);
    }
}
