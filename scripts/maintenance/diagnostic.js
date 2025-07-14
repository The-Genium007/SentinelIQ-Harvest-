#!/usr/bin/env node
/**
 * 🛠️ Script utilitaire pour diagnostiquer et gérer SentinelIQ Harvest
 */

import { forceReset, stopTask, startTask } from './WireScanner/start.js';
import { logManager, LOG_TYPES, LOG_LEVELS } from './utils/logManager.js';
import fs from 'fs';
import path from 'path';

/**
 * Analyse tous les fichiers de logs
 */
function analyzeLogs() {
    try {
        const summary = logManager.getLogsSummary();

        logManager.info('� Analyse complète des logs:', 'Diagnostic');

        Object.entries(summary).forEach(([type, stats]) => {
            if (stats.total > 0) {
                logManager.info(`� ${type.toUpperCase()}: ${stats.total} entrées`, 'Diagnostic');

                // Afficher les statistiques par niveau
                Object.entries(stats.levels).forEach(([level, count]) => {
                    if (count > 0) {
                        const emoji = {
                            ERROR: '❌',
                            WARN: '⚠️',
                            SUCCESS: '✅',
                            INFO: 'ℹ️',
                            DEBUG: '🔍'
                        }[level] || '📝';

                        logManager.info(`  ${emoji} ${level}: ${count}`, 'Diagnostic');
                    }
                });

                // Signaler les problèmes potentiels
                if (stats.levels.ERROR > 10) {
                    logManager.warn(`⚠️ Beaucoup d'erreurs dans ${type} (${stats.levels.ERROR})`, 'Diagnostic');
                }

                if (stats.fileSize > 5 * 1024 * 1024) { // 5MB
                    logManager.warn(`⚠️ Fichier ${type} volumineux (${Math.round(stats.fileSize / 1024 / 1024)}MB)`, 'Diagnostic');
                }
            }
        });

    } catch (err) {
        logManager.error(`❌ Erreur lors de l'analyse: ${err.message}`, 'Diagnostic');
    }
}

/**
 * Nettoie tous les fichiers de logs
 */
function cleanLogs() {
    try {
        logManager.info('🧹 Nettoyage des logs en cours...', 'Diagnostic');
        logManager.cleanAllLogs();
        logManager.success('✅ Tous les logs ont été nettoyés', 'Diagnostic');
    } catch (err) {
        logManager.error(`❌ Erreur lors du nettoyage: ${err.message}`, 'Diagnostic');
    }
}

/**
 * Affiche les commandes disponibles
 */
function showHelp() {
    console.log(`
🛠️  SentinelIQ Harvest - Utilitaire de diagnostic

Commandes disponibles:
  analyze     - Analyse tous les fichiers de logs
  clean       - Nettoie tous les fichiers de logs
  summary     - Résumé rapide des logs
  reset       - Force la réinitialisation du système
  stop        - Arrête les tâches cron
  start       - Redémarre les tâches cron
  status      - Affiche le statut du système
  help        - Affiche cette aide

Utilisation: node diagnostic.js [commande]
`);
}

/**
 * Affiche un résumé rapide
 */
function showSummary() {
    const summary = logManager.getLogsSummary();

    console.log('\n📊 Résumé des logs:');
    Object.entries(summary).forEach(([type, stats]) => {
        const sizeKB = Math.round(stats.fileSize / 1024);
        const errorCount = stats.levels.ERROR || 0;
        const status = errorCount > 0 ? '❌' : '✅';

        console.log(`${status} ${type.toUpperCase()}: ${stats.total} entrées, ${sizeKB}KB`);
    });
}

/**
 * Affiche le statut du système
 */
function showStatus() {
    logManager.info('📊 Statut du système SentinelIQ Harvest', 'Diagnostic');

    // Vérification des fichiers importants
    const files = [
        'key.env',
        'package.json',
        'WireScanner/start.js',
        'Cortex/start.js',
        'utils/logManager.js',
        'logs'
    ];

    files.forEach(file => {
        const exists = fs.existsSync(file);
        logManager.info(`${exists ? '✅' : '❌'} ${file}`, 'Diagnostic');
    });

    // Vérification du dossier logs
    const logsDir = path.join(process.cwd(), 'logs');
    if (fs.existsSync(logsDir)) {
        const logFiles = fs.readdirSync(logsDir).filter(f => f.endsWith('.log'));
        logManager.info(`📁 Fichiers de logs disponibles: ${logFiles.join(', ')}`, 'Diagnostic');
    }

    showSummary();
}

// Gestion des arguments de ligne de commande
const command = process.argv[2];

switch (command) {
    case 'analyze':
        analyzeLogs();
        break;
    case 'clean':
        cleanLogs();
        break;
    case 'summary':
        showSummary();
        break;
    case 'reset':
        logManager.info('🔄 Réinitialisation forcée du système...', 'Diagnostic');
        forceReset();
        break;
    case 'stop':
        logManager.info('⏸️ Arrêt des tâches...', 'Diagnostic');
        stopTask();
        break;
    case 'start':
        logManager.info('▶️ Démarrage des tâches...', 'Diagnostic');
        startTask();
        break;
    case 'status':
        showStatus();
        break;
    case 'help':
    default:
        showHelp();
        break;
}
