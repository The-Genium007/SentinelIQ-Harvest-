/**
 * 🔧 Configuration et constantes pour Cortex
 * Centralise tous les paramètres de configuration pour l'analyse d'articles
 */

export const PERFORMANCE_CONFIG = {
    // Limites de performance pour le scraping
    MAX_CONCURRENT_ARTICLES: 3,        // Nombre max d'articles scrapés en parallèle
    MAX_CONCURRENT_BROWSERS: 2,        // Nombre max de navigateurs Puppeteer simultanés
    BROWSER_POOL_SIZE: 2,              // Taille du pool de navigateurs réutilisables
    PAGE_TIMEOUT: 10000,               // Timeout pour le chargement des pages (10s)
    MEMORY_THRESHOLD: 150,             // Seuil mémoire en MB pour pause GC

    // Délais et retry
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY_BASE: 2000,            // Délai de base pour retry (2s)
    BACKOFF_MULTIPLIER: 1.5,           // Multiplicateur pour backoff exponentiel
    NAVIGATION_DELAY: 500,             // Délai entre les navigations (ms)

    // Cache et optimisations
    ARTICLE_CACHE_TTL: 600000,         // Cache TTL pour les articles (10 min)
    BATCH_SIZE: 20,                    // Taille des lots pour traitement
    PROCESSING_DELAY: 200,             // Délai entre les lots (ms)
    GC_INTERVAL: 120000,               // Intervalle de garbage collection forcé (2 min)
};

export const SCRAPING_CONFIG = {
    // Configuration Puppeteer
    HEADLESS: true,
    DISABLE_IMAGES: true,              // Désactive le chargement des images
    DISABLE_CSS: false,                // Garde le CSS pour la structure
    DISABLE_JAVASCRIPT: false,         // Garde JS minimal pour contenu dynamique
    BLOCK_RESOURCES: ['font', 'image', 'media'], // Types de ressources à bloquer

    // User agent et headers
    USER_AGENT: 'SentinelIQ-Cortex/1.0 (Article Analyzer)',
    VIEWPORT: { width: 1280, height: 720 },

    // Sélecteurs pour extraction
    SELECTORS: {
        article: ['article', 'main', '[role="main"]', '.article-content', '.post-content'],
        title: ['h1', '.article-title', '.post-title', 'title'],
        content: ['.article-body', '.post-body', '.content', 'article p'],
        date: ['time', '.date', '.published', '[datetime]'],
        author: ['.author', '.byline', '[rel="author"]']
    },

    // Validation du contenu
    MIN_CONTENT_LENGTH: 100,           // Longueur minimum du contenu
    MAX_CONTENT_LENGTH: 100000,        // Longueur maximum du contenu
    MIN_TITLE_LENGTH: 10,              // Longueur minimum du titre
    EXCLUDE_DOMAINS: [],               // Domaines à exclure
};

export const LOGGING_CONFIG = {
    // Niveaux de logging
    LOG_LEVEL: process.env.CORTEX_LOG_LEVEL || 'INFO',

    // Performance logging
    ENABLE_PERFORMANCE_LOGS: process.env.ENABLE_CORTEX_PERF_LOGS === 'true',
    ENABLE_MEMORY_MONITORING: process.env.ENABLE_CORTEX_MEM_MONITOR === 'true',
    ENABLE_SCRAPING_LOGS: process.env.ENABLE_SCRAPING_LOGS === 'true',

    // Formats
    LOG_FORMAT: 'timestamp',
    INCLUDE_STACK_TRACE: false,
    LOG_ERRORS_ONLY: false,
};

export const DATABASE_CONFIG = {
    // Optimisations DB pour Cortex
    CONNECTION_POOL_SIZE: 3,
    QUERY_TIMEOUT: 15000,              // 15s timeout pour les requêtes (plus long car contenu volumineux)
    BATCH_INSERT_SIZE: 10,             // Taille des insertions par lot (articles volumineux)

    // Cache
    ENABLE_QUERY_CACHE: true,
    CACHE_TTL: 600000,                 // 10 minutes

    // Validation
    VALIDATE_BEFORE_INSERT: true,
    SKIP_DUPLICATE_URLS: true,
};

export const CONTENT_CONFIG = {
    // Traitement du contenu
    CLEAN_HTML: true,
    NORMALIZE_WHITESPACE: true,
    REMOVE_EMPTY_PARAGRAPHS: true,
    EXTRACT_METADATA: true,

    // Filtres de qualité
    MIN_PARAGRAPH_COUNT: 2,
    MIN_WORDS_COUNT: 10,
    MAX_WORDS_COUNT: 10000,

    // Enrichissement
    EXTRACT_KEYWORDS: false,           // À implémenter plus tard
    ANALYZE_SENTIMENT: false,          // À implémenter plus tard
    DETECT_LANGUAGE: false,            // À implémenter plus tard
};

export const SERVER_CONFIG = {
    // Configuration serveur HTTP
    PORT: process.env.CORTEX_PORT || 3001,
    HOST: process.env.CORTEX_HOST || 'localhost',

    // Sécurité
    ENABLE_AUTH: true,
    AUTH_TOKEN: process.env.WEBHOOK_TOKEN || '',

    // Endpoints
    WEBHOOK_PATH: '/',
    HEALTH_PATH: '/health',
    METRICS_PATH: '/metrics',

    // Limits
    MAX_REQUEST_SIZE: '10mb',
    REQUEST_TIMEOUT: 30000,
};

export const PATHS = {
    LOG_FILE: 'cortex.log',
    ERROR_LOG: 'cortex-error.log',
    METRICS_LOG: 'cortex-metrics.log',
    ENV_FILE: '../key.env',
    TEMP_DIR: './temp/cortex',
};

/**
 * Fonction pour obtenir la configuration d'environnement complète
 * @returns {Object} Configuration complète
 */
export function getConfig() {
    return {
        performance: PERFORMANCE_CONFIG,
        scraping: SCRAPING_CONFIG,
        logging: LOGGING_CONFIG,
        database: DATABASE_CONFIG,
        content: CONTENT_CONFIG,
        server: SERVER_CONFIG,
        paths: PATHS,

        // Configuration d'environnement
        env: {
            NODE_ENV: process.env.NODE_ENV || 'production',
            DEBUG: process.env.DEBUG === 'true',
            VERBOSE: process.env.VERBOSE === 'true',
            CORTEX_MODE: process.env.CORTEX_MODE || 'full', // full, fast, quality
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
        scraping: SCRAPING_CONFIG,
        logging: LOGGING_CONFIG,
        database: DATABASE_CONFIG,
        content: CONTENT_CONFIG,
        server: SERVER_CONFIG
    };

    if (configs[section]) {
        Object.assign(configs[section], updates);
    }
}

/**
 * Configuration optimisée selon le mode
 * @param {string} mode - Mode d'optimisation (fast, quality, balanced)
 */
export function optimizeForMode(mode) {
    switch (mode) {
        case 'fast':
            updateConfig('performance', {
                MAX_CONCURRENT_ARTICLES: 5,
                MAX_CONCURRENT_BROWSERS: 3,
                RETRY_ATTEMPTS: 1,
                PAGE_TIMEOUT: 15000
            });
            updateConfig('scraping', {
                DISABLE_IMAGES: true,
                DISABLE_CSS: true,
                DISABLE_JAVASCRIPT: true
            });
            break;

        case 'quality':
            updateConfig('performance', {
                MAX_CONCURRENT_ARTICLES: 1,
                MAX_CONCURRENT_BROWSERS: 1,
                RETRY_ATTEMPTS: 5,
                PAGE_TIMEOUT: 60000
            });
            updateConfig('scraping', {
                DISABLE_IMAGES: false,
                DISABLE_CSS: false,
                DISABLE_JAVASCRIPT: false
            });
            break;

        case 'balanced':
        default:
            // Configuration par défaut déjà optimisée
            break;
    }
}

/**
 * 🖥️ Configuration multi-plateforme (Debian/macOS)
 * Optimisations spécifiques selon l'OS
 */
export const PLATFORM_CONFIG = {
    // Détection automatique de la plateforme
    CURRENT_PLATFORM: process.platform,
    IS_LINUX: process.platform === 'linux',
    IS_MACOS: process.platform === 'darwin',
    IS_DEBIAN: false, // Sera détecté dynamiquement

    // Configuration Puppeteer par plateforme
    PUPPETEER: {
        // Configuration commune
        COMMON: {
            headless: 'new',
            defaultViewport: { width: 1280, height: 720 },
            ignoreHTTPSErrors: true,
            ignoreDefaultArgs: ['--disable-extensions'],
        },

        // Configuration spécifique macOS
        MACOS: {
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu',
                '--disable-web-security',
                '--disable-features=TranslateUI',
                '--disable-ipc-flooding-protection'
            ],
            executablePath: null, // Utilise l'installation système
        },

        // Configuration spécifique Debian/Linux
        DEBIAN: {
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--single-process', // Important pour Docker/conteneurs
                '--disable-gpu',
                '--disable-web-security',
                '--disable-features=TranslateUI',
                '--disable-ipc-flooding-protection',
                '--disable-extensions-file-access-check',
                '--disable-extensions-http-throttling',
                '--disable-plugins-discovery',
                '--memory-pressure-off'
            ],
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser', // Chemin configurable via env
        }
    },

    // Optimisations mémoire par plateforme
    MEMORY: {
        MACOS: {
            MAX_MEMORY_USAGE: 1024 * 1024 * 1024, // 1GB
            GC_INTERVAL: 300000, // 5 minutes
            BROWSER_POOL_SIZE: 3,
            MAX_CONCURRENT_PAGES: 5
        },
        DEBIAN: {
            MAX_MEMORY_USAGE: 512 * 1024 * 1024, // 512MB (plus conservateur)
            GC_INTERVAL: 120000, // 2 minutes
            BROWSER_POOL_SIZE: 2,
            MAX_CONCURRENT_PAGES: 3
        }
    },

    // Configuration réseau par plateforme
    NETWORK: {
        MACOS: {
            TIMEOUT: 30000,
            RETRY_ATTEMPTS: 3,
            CONCURRENT_REQUESTS: 10
        },
        DEBIAN: {
            TIMEOUT: 45000, // Plus long pour les serveurs
            RETRY_ATTEMPTS: 5,
            CONCURRENT_REQUESTS: 5 // Plus conservateur
        }
    }
};

/**
 * 🔧 Fonction de détection avancée de Debian
 */
export async function detectPlatform() {
    const config = { ...PLATFORM_CONFIG };

    if (config.IS_LINUX) {
        try {
            // Détection spécifique Debian/Alpine
            const fs = await import('fs');
            let osRelease = '';
            try {
                osRelease = fs.readFileSync('/etc/os-release', 'utf8');
            } catch (error) {
                // Fallback pour Alpine ou autres distributions
                osRelease = '';
            }
            
            config.IS_DEBIAN = osRelease.includes('debian') || osRelease.includes('ubuntu');
            config.IS_ALPINE = osRelease.includes('alpine');

            // Vérification de l'exécutable Chromium avec priorité Alpine
            const chromiumPaths = config.IS_ALPINE ? [
                '/usr/bin/chromium-browser', // Alpine Linux
                '/usr/bin/chromium'
            ] : [
                '/usr/bin/chromium-browser',
                '/usr/bin/chromium',
                '/usr/bin/google-chrome',
                '/usr/bin/google-chrome-stable'
            ];

            for (const path of chromiumPaths) {
                if (fs.existsSync(path)) {
                    config.PUPPETEER.DEBIAN.executablePath = path;
                    break;
                }
            }
        } catch (error) {
            // Fallback si la détection échoue
            config.IS_DEBIAN = true;
        }
    }

    return config;
}

/**
 * 🚀 Obtient la configuration Puppeteer optimisée pour la plateforme actuelle
 */
export function getPuppeteerConfig(platformConfig = PLATFORM_CONFIG) {
    const commonConfig = platformConfig.PUPPETEER.COMMON;

    if (platformConfig.IS_MACOS) {
        return {
            ...commonConfig,
            ...platformConfig.PUPPETEER.MACOS
        };
    } else if (platformConfig.IS_LINUX || platformConfig.IS_DEBIAN) {
        return {
            ...commonConfig,
            ...platformConfig.PUPPETEER.DEBIAN
        };
    }

    // Fallback configuration
    return commonConfig;
}

/**
 * ⚡ Obtient la configuration de performance pour la plateforme actuelle
 */
export function getPerformanceConfig(platformConfig = PLATFORM_CONFIG) {
    if (platformConfig.IS_MACOS) {
        return {
            ...PERFORMANCE_CONFIG,
            ...platformConfig.MEMORY.MACOS,
            ...platformConfig.NETWORK.MACOS
        };
    } else if (platformConfig.IS_LINUX || platformConfig.IS_DEBIAN) {
        return {
            ...PERFORMANCE_CONFIG,
            ...platformConfig.MEMORY.DEBIAN,
            ...platformConfig.NETWORK.DEBIAN
        };
    }

    return PERFORMANCE_CONFIG;
}
