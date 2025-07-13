import { exec } from 'child_process';
import { createServer } from 'http';
import { logManager, LOG_TYPES, LOG_LEVELS } from './utils/logManager.js';

// Configuration du logger
const log = (message, level = LOG_LEVELS.INFO, component = 'SYSTEM') => {
    logManager.log(LOG_TYPES.SYSTEM, level, message, component);
};

// État des services pour le healthcheck
const serviceStatus = {
    diagnostic: false,
    wireScanner: false,
    cortex: false,
    healthServer: false,
    startTime: new Date().toISOString()
};

// Fonction pour démarrer un service
const startService = (serviceName, scriptPath) => {
    return new Promise((resolve, reject) => {
        const process = exec(`node ${scriptPath}`, (error, stdout, stderr) => {
            if (error) {
                log(`❌ Erreur lors du démarrage de ${serviceName}: ${error.message}`, LOG_LEVELS.ERROR);
                // Marquer le service comme échoué
                if (serviceName.toLowerCase().includes('diagnostic')) serviceStatus.diagnostic = false;
                if (serviceName.toLowerCase().includes('wirescanner')) serviceStatus.wireScanner = false;
                if (serviceName.toLowerCase().includes('cortex')) serviceStatus.cortex = false;
                reject(error);
                return;
            }
            if (stderr) {
                log(`⚠️ Avertissement ${serviceName}: ${stderr}`, LOG_LEVELS.WARN);
            }
            log(`✅ ${serviceName} démarré avec succès`, LOG_LEVELS.SUCCESS);

            // Marquer le service comme démarré
            if (serviceName.toLowerCase().includes('diagnostic')) serviceStatus.diagnostic = true;
            if (serviceName.toLowerCase().includes('wirescanner')) serviceStatus.wireScanner = true;
            if (serviceName.toLowerCase().includes('cortex')) serviceStatus.cortex = true;

            resolve(stdout);
        });

        process.stdout?.on('data', (data) => {
            log(`[${serviceName}] ${data.toString().trim()}`);
        });

        process.stderr?.on('data', (data) => {
            log(`[${serviceName}] ERROR: ${data.toString().trim()}`, LOG_LEVELS.ERROR);
        });
    });
};

// Serveur de healthcheck pour Coolify
const createHealthServer = () => {
    const PORT = process.env.HEALTH_PORT || 3000;

    const server = createServer((req, res) => {
        // Configuration CORS et headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', 'application/json');

        const url = req.url;
        const method = req.method;

        try {
            if (method === 'GET') {
                if (url === '/health' || url === '/') {
                    // Endpoint principal de healthcheck
                    const uptime = process.uptime();
                    const memoryUsage = process.memoryUsage();

                    const healthData = {
                        status: 'healthy',
                        timestamp: new Date().toISOString(),
                        uptime: `${Math.floor(uptime / 60)}m ${Math.floor(uptime % 60)}s`,
                        uptimeSeconds: Math.floor(uptime),
                        services: serviceStatus,
                        system: {
                            nodeVersion: process.version,
                            platform: process.platform,
                            arch: process.arch,
                            memory: {
                                used: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
                                total: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
                                external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`
                            }
                        },
                        application: {
                            name: 'SentinelIQ Harvest',
                            version: '2.0.0',
                            environment: process.env.NODE_ENV || 'production'
                        }
                    };

                    // Détermine le statut global
                    const allServicesRunning = serviceStatus.diagnostic &&
                        serviceStatus.wireScanner &&
                        serviceStatus.cortex &&
                        serviceStatus.healthServer;

                    if (!allServicesRunning) {
                        healthData.status = 'degraded';
                        res.statusCode = 200; // Toujours 200 pour Coolify, mais status degraded
                    } else {
                        res.statusCode = 200;
                    }

                    res.end(JSON.stringify(healthData, null, 2));

                } else if (url === '/ready') {
                    // Endpoint de readiness check
                    const isReady = serviceStatus.wireScanner && serviceStatus.cortex;

                    res.statusCode = isReady ? 200 : 503;
                    res.end(JSON.stringify({
                        ready: isReady,
                        services: {
                            wireScanner: serviceStatus.wireScanner,
                            cortex: serviceStatus.cortex
                        },
                        timestamp: new Date().toISOString()
                    }, null, 2));

                } else if (url === '/metrics') {
                    // Endpoint de métriques basiques
                    const uptime = process.uptime();
                    const memoryUsage = process.memoryUsage();

                    res.statusCode = 200;
                    res.end(JSON.stringify({
                        uptime_seconds: Math.floor(uptime),
                        memory_heap_used_bytes: memoryUsage.heapUsed,
                        memory_heap_total_bytes: memoryUsage.heapTotal,
                        memory_external_bytes: memoryUsage.external,
                        services_running: Object.values(serviceStatus).filter(Boolean).length - 1, // -1 pour startTime
                        timestamp: new Date().toISOString()
                    }, null, 2));

                } else {
                    // 404 pour les autres routes
                    res.statusCode = 404;
                    res.end(JSON.stringify({
                        error: 'Not Found',
                        message: 'Available endpoints: /health, /ready, /metrics',
                        timestamp: new Date().toISOString()
                    }, null, 2));
                }
            } else {
                // Méthodes non supportées
                res.statusCode = 405;
                res.end(JSON.stringify({
                    error: 'Method Not Allowed',
                    message: 'Only GET method is supported',
                    timestamp: new Date().toISOString()
                }, null, 2));
            }
        } catch (error) {
            // Gestion des erreurs internes
            res.statusCode = 500;
            res.end(JSON.stringify({
                error: 'Internal Server Error',
                message: error.message,
                timestamp: new Date().toISOString()
            }, null, 2));

            log(`❌ Erreur serveur health: ${error.message}`, LOG_LEVELS.ERROR);
        }
    });

    server.listen(PORT, '0.0.0.0', () => {
        serviceStatus.healthServer = true;
        log(`🌐 Serveur healthcheck démarré sur http://0.0.0.0:${PORT}`, LOG_LEVELS.SUCCESS);
        log(`📊 Endpoints disponibles:`, LOG_LEVELS.INFO);
        log(`   • GET /health  - État général du système`, LOG_LEVELS.INFO);
        log(`   • GET /ready   - Vérification de disponibilité`, LOG_LEVELS.INFO);
        log(`   • GET /metrics - Métriques système`, LOG_LEVELS.INFO);
    });

    server.on('error', (error) => {
        serviceStatus.healthServer = false;
        log(`❌ Erreur serveur healthcheck: ${error.message}`, LOG_LEVELS.ERROR);
    });

    return server;
};

// Fonction principale
async function main() {
    try {
        log('🚀 Démarrage de SentinelIQ Harvest avec Node.js');

        // Démarrer le serveur de healthcheck en premier
        const healthServer = createHealthServer();

        // Démarrer le diagnostic
        await startService('Diagnostic', 'diagnostic.js');

        // Démarrer WireScanner
        startService('WireScanner', 'WireScanner/start.js')
            .catch(err => log(`❌ WireScanner error: ${err.message}`, LOG_LEVELS.ERROR));

        // Démarrer Cortex
        startService('Cortex', 'Cortex/start.js')
            .catch(err => log(`❌ Cortex error: ${err.message}`, LOG_LEVELS.ERROR));

        log('✅ Tous les services ont été initialisés', LOG_LEVELS.SUCCESS);

        // Stocker la référence du serveur pour l'arrêt propre
        process.healthServer = healthServer;

    } catch (error) {
        log(`❌ Erreur fatale: ${error.message}`, LOG_LEVELS.ERROR);
        process.exit(1);
    }
}

// Gestion des signaux pour arrêt propre
process.on('SIGINT', () => {
    log('🛑 Arrêt du système demandé (SIGINT)');
    // Fermer le serveur healthcheck proprement
    if (process.healthServer) {
        process.healthServer.close(() => {
            log('🌐 Serveur healthcheck fermé', LOG_LEVELS.INFO);
        });
    }
    process.exit(0);
});

process.on('SIGTERM', () => {
    log('🛑 Arrêt du système demandé (SIGTERM)');
    // Fermer le serveur healthcheck proprement
    if (process.healthServer) {
        process.healthServer.close(() => {
            log('🌐 Serveur healthcheck fermé', LOG_LEVELS.INFO);
        });
    }
    process.exit(0);
});

// Démarrage
main();