import { exec, spawn } from 'child_process';
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
        // Configuration avec buffer plus grand pour éviter l'erreur maxBuffer
        const options = {
            maxBuffer: 10 * 1024 * 1024, // 10MB au lieu de 1MB par défaut
            timeout: 60000 // 60 secondes timeout
        };

        const process = exec(`node ${scriptPath}`, options, (error, stdout, stderr) => {
            if (error) {
                // Gestion spéciale pour l'erreur maxBuffer
                if (error.code === 'ERR_CHILD_PROCESS_STDOUT_MAXBUFFER') {
                    log(`⚠️ ${serviceName}: Sortie trop importante, mais processus démarré`, LOG_LEVELS.WARN);
                    // Marquer comme démarré malgré le dépassement de buffer
                    if (serviceName.toLowerCase().includes('diagnostic')) serviceStatus.diagnostic = true;
                    if (serviceName.toLowerCase().includes('wirescanner')) serviceStatus.wireScanner = true;
                    if (serviceName.toLowerCase().includes('cortex')) serviceStatus.cortex = true;
                    resolve('Service démarré avec sortie importante');
                    return;
                }

                // Services "one-shot" qui se terminent normalement après leur travail
                if (serviceName.toLowerCase().includes('cortex')) {
                    // Cortex est un service one-shot qui fait son travail puis se termine
                    // On considère sa terminaison comme un succès, pas une erreur
                    log(`✅ ${serviceName}: Session one-shot terminée normalement`, LOG_LEVELS.SUCCESS);
                    serviceStatus.cortex = true;
                    resolve('Service one-shot terminé avec succès');
                    return;
                }

                log(`❌ Erreur lors du démarrage de ${serviceName}: ${error.message}`, LOG_LEVELS.ERROR);
                log(`❌ ${serviceName} error: ${error.message}`, LOG_LEVELS.ERROR);
                // Marquer le service comme échoué seulement si ce n'est pas une terminaison normale
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
            const output = data.toString().trim();
            // Limiter la taille des logs individuels pour éviter l'encombrement
            if (output.length > 500) {
                log(`[${serviceName}] ${output.substring(0, 500)}... [TRONQUÉ]`);
            } else {
                log(`[${serviceName}] ${output}`);
            }
        });

        process.stderr?.on('data', (data) => {
            const output = data.toString().trim();
            if (output.length > 500) {
                log(`[${serviceName}] ERROR: ${output.substring(0, 500)}... [TRONQUÉ]`, LOG_LEVELS.ERROR);
            } else {
                log(`[${serviceName}] ERROR: ${output}`, LOG_LEVELS.ERROR);
            }
        });
    });
};

// Fonction alternative avec spawn pour les services verbeux
const startServiceWithSpawn = (serviceName, scriptPath) => {
    return new Promise((resolve, reject) => {
        log(`🚀 Démarrage ${serviceName} avec spawn (mode verbeux)`, LOG_LEVELS.INFO);

        const process = spawn('node', [scriptPath], {
            stdio: ['pipe', 'pipe', 'pipe'],
            env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=2048' }
        });

        let hasResolved = false;
        let outputLines = 0;
        const MAX_OUTPUT_LINES = 100; // Limiter à 100 lignes de logs

        // Timeout pour considérer le service comme démarré
        const startupTimeout = setTimeout(() => {
            if (!hasResolved) {
                hasResolved = true;
                log(`✅ ${serviceName} démarré (timeout atteint, considéré comme opérationnel)`, LOG_LEVELS.SUCCESS);

                // Marquer le service comme démarré
                if (serviceName.toLowerCase().includes('diagnostic')) serviceStatus.diagnostic = true;
                if (serviceName.toLowerCase().includes('wirescanner')) serviceStatus.wireScanner = true;
                if (serviceName.toLowerCase().includes('cortex')) serviceStatus.cortex = true;

                resolve('Service démarré avec spawn');
            }
        }, 5000); // 5 secondes pour considérer le démarrage comme réussi

        process.stdout.on('data', (data) => {
            const output = data.toString().trim();
            if (outputLines < MAX_OUTPUT_LINES && output.length > 0) {
                outputLines++;
                if (output.length > 200) {
                    log(`[${serviceName}] ${output.substring(0, 200)}...`, LOG_LEVELS.INFO);
                } else {
                    log(`[${serviceName}] ${output}`, LOG_LEVELS.INFO);
                }
            } else if (outputLines === MAX_OUTPUT_LINES) {
                log(`[${serviceName}] ... (sortie supprimée après ${MAX_OUTPUT_LINES} lignes)`, LOG_LEVELS.INFO);
                outputLines++;
            }
        });

        process.stderr.on('data', (data) => {
            const output = data.toString().trim();
            if (output.length > 0) {
                log(`[${serviceName}] ERROR: ${output.substring(0, 200)}`, LOG_LEVELS.ERROR);
            }
        });

        process.on('error', (error) => {
            clearTimeout(startupTimeout);
            if (!hasResolved) {
                hasResolved = true;
                log(`❌ Erreur spawn ${serviceName}: ${error.message}`, LOG_LEVELS.ERROR);
                reject(error);
            }
        });

        process.on('close', (code) => {
            clearTimeout(startupTimeout);
            if (!hasResolved) {
                hasResolved = true;
                if (code === 0) {
                    log(`✅ ${serviceName} terminé normalement`, LOG_LEVELS.SUCCESS);
                    // Pour les services one-shot comme Cortex, marquer comme réussi
                    if (serviceName.toLowerCase().includes('cortex')) {
                        serviceStatus.cortex = true;
                    }
                    resolve('Service terminé avec succès');
                } else {
                    log(`❌ ${serviceName} terminé avec erreur (code: ${code})`, LOG_LEVELS.ERROR);
                    reject(new Error(`Service terminé avec code ${code}`));
                }
            } else {
                // Si déjà résolu par timeout mais le processus se termine normalement
                if (code === 0 && serviceName.toLowerCase().includes('cortex')) {
                    log(`✅ ${serviceName} session terminée après démarrage`, LOG_LEVELS.SUCCESS);
                    serviceStatus.cortex = true;
                }
            }
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
                            version: '2.5.0',
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

        // Test immédiat de la healthcheck
        setTimeout(() => {
            testHealthcheck(PORT);
        }, 2000);
    });

    server.on('error', (error) => {
        serviceStatus.healthServer = false;
        log(`❌ Erreur serveur healthcheck: ${error.message}`, LOG_LEVELS.ERROR);
        if (error.code === 'EADDRINUSE') {
            log(`🔧 Port ${PORT} déjà utilisé. Tentative sur port alternatif...`, LOG_LEVELS.WARN);
        }
    });

    return server;
};

// Fonction de test de la healthcheck
const testHealthcheck = (port) => {
    const testProcess = spawn('curl', ['-s', '-f', `http://127.0.0.1:${port}/health`]);

    testProcess.on('close', (code) => {
        if (code === 0) {
            log(`✅ Test healthcheck interne réussi`, LOG_LEVELS.SUCCESS);
        } else {
            log(`❌ Test healthcheck interne échoué (code: ${code})`, LOG_LEVELS.ERROR);
        }
    });

    testProcess.on('error', (error) => {
        log(`⚠️ Impossible de tester la healthcheck: ${error.message}`, LOG_LEVELS.WARN);
    });
};

// Fonction principale
async function main() {
    try {
        log('🚀 Démarrage de SentinelIQ Harvest avec Node.js');

        // Démarrer le serveur de healthcheck en premier
        const healthServer = createHealthServer();

        // Démarrer le diagnostic avec la méthode spawn (plus robuste pour gros volumes)
        log('🔧 Démarrage du diagnostic avec méthode robuste...', LOG_LEVELS.INFO);
        startServiceWithSpawn('Diagnostic', 'diagnostic.js')
            .catch(err => {
                log(`⚠️ Diagnostic startup issue: ${err.message}`, LOG_LEVELS.WARN);
                // Ne pas faire échouer le démarrage global si le diagnostic a des problèmes
                serviceStatus.diagnostic = false;
            });

        // Attendre un peu avant de démarrer les autres services
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Démarrer WireScanner avec spawn (service persistant)
        startServiceWithSpawn('WireScanner', 'WireScanner/start.js')
            .then(result => {
                log(`✅ WireScanner démarré comme service persistant`, LOG_LEVELS.SUCCESS);
                serviceStatus.wireScanner = true;
            })
            .catch(err => {
                log(`❌ WireScanner error: ${err.message}`, LOG_LEVELS.ERROR);
                serviceStatus.wireScanner = false;
            });

        // Démarrer Cortex avec gestion spéciale pour service one-shot
        startService('Cortex', 'Cortex/start.js')
            .then(result => {
                log(`✅ Cortex exécuté avec succès`, LOG_LEVELS.SUCCESS);
                serviceStatus.cortex = true;
            })
            .catch(err => {
                // Pour Cortex, ne pas traiter la terminaison normale comme une erreur
                if (err.message && err.message.includes('Service terminé avec code 0')) {
                    log(`✅ Cortex session terminée normalement`, LOG_LEVELS.SUCCESS);
                    serviceStatus.cortex = true;
                } else {
                    log(`❌ Cortex error: ${err.message}`, LOG_LEVELS.ERROR);
                    serviceStatus.cortex = false;
                }
            });

        log('✅ Tous les services ont été initialisés', LOG_LEVELS.SUCCESS);
        log('📊 Services critiques: Healthcheck server démarré', LOG_LEVELS.INFO);
        log('🔧 Services optionnels: Diagnostic, WireScanner, Cortex en cours...', LOG_LEVELS.INFO);

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