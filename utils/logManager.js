/**
 * 📝 Gestionnaire de logs centralisé pour SentinelIQ Harvest
 * Gère la rotation, l'archivage et la structuration des logs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOGS_DIR = path.join(__dirname, '..', 'logs');
const MAX_LOG_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_LOG_FILES = 5;

// Créer le dossier logs s'il n'existe pas
if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
}

/**
 * Types de logs disponibles
 */
export const LOG_TYPES = {
    SYSTEM: 'system',
    CRON: 'cron',
    WEBHOOK: 'webhook',
    SCRAPING: 'scraping',
    ERROR: 'error',
    DEBUG: 'debug'
};

/**
 * Niveaux de log
 */
export const LOG_LEVELS = {
    DEBUG: 'DEBUG',
    INFO: 'INFO',
    WARN: 'WARN',
    ERROR: 'ERROR',
    SUCCESS: 'SUCCESS'
};

/**
 * Classe principale de gestion des logs
 */
export class LogManager {
    constructor() {
        this.logStreams = new Map();
        this.initializeLogFiles();
    }

    /**
     * Initialise les fichiers de logs
     */
    initializeLogFiles() {
        Object.values(LOG_TYPES).forEach(type => {
            const logFile = path.join(LOGS_DIR, `${type}.log`);
            if (!fs.existsSync(logFile)) {
                fs.writeFileSync(logFile, '');
            }
        });
    }

    /**
     * Obtient le chemin d'un fichier de log
     * @param {string} type - Type de log
     * @returns {string} Chemin du fichier
     */
    getLogPath(type) {
        return path.join(LOGS_DIR, `${type}.log`);
    }

    /**
     * Vérifie si un fichier de log doit être rotaté
     * @param {string} logPath - Chemin du fichier de log
     * @returns {boolean}
     */
    shouldRotateLog(logPath) {
        try {
            const stats = fs.statSync(logPath);
            return stats.size > MAX_LOG_SIZE;
        } catch (err) {
            return false;
        }
    }

    /**
     * Effectue la rotation d'un fichier de log
     * @param {string} logPath - Chemin du fichier de log
     */
    rotateLog(logPath) {
        try {
            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
            const dir = path.dirname(logPath);
            const basename = path.basename(logPath, '.log');
            const archivePath = path.join(dir, 'archive', `${basename}_${timestamp}.log`);

            // Créer le dossier archive s'il n'existe pas
            const archiveDir = path.dirname(archivePath);
            if (!fs.existsSync(archiveDir)) {
                fs.mkdirSync(archiveDir, { recursive: true });
            }

            // Déplacer le fichier actuel vers l'archive
            fs.renameSync(logPath, archivePath);

            // Créer un nouveau fichier vide
            fs.writeFileSync(logPath, '');

            // Nettoyer les anciens fichiers d'archive
            this.cleanOldArchives(archiveDir, basename);

            this.log(LOG_TYPES.SYSTEM, LOG_LEVELS.INFO, `📁 Rotation du log ${basename} terminée`);
        } catch (err) {
            console.error(`❌ Erreur lors de la rotation du log: ${err.message}`);
        }
    }

    /**
     * Nettoie les anciens fichiers d'archive
     * @param {string} archiveDir - Dossier d'archive
     * @param {string} basename - Nom de base du fichier
     */
    cleanOldArchives(archiveDir, basename) {
        try {
            const files = fs.readdirSync(archiveDir)
                .filter(file => file.startsWith(basename))
                .map(file => ({
                    name: file,
                    path: path.join(archiveDir, file),
                    mtime: fs.statSync(path.join(archiveDir, file)).mtime
                }))
                .sort((a, b) => b.mtime - a.mtime);

            // Supprimer les fichiers excédentaires
            if (files.length > MAX_LOG_FILES) {
                files.slice(MAX_LOG_FILES).forEach(file => {
                    fs.unlinkSync(file.path);
                });
            }
        } catch (err) {
            console.error(`❌ Erreur lors du nettoyage des archives: ${err.message}`);
        }
    }

    /**
     * Écrit un message dans un fichier de log
     * @param {string} type - Type de log
     * @param {string} level - Niveau de log
     * @param {string} message - Message à logger
     * @param {string} [component] - Composant qui émet le log
     */
    log(type, level, message, component = null) {
        try {
            const logPath = this.getLogPath(type);

            // Vérifier si rotation nécessaire
            if (this.shouldRotateLog(logPath)) {
                this.rotateLog(logPath);
            }

            const timestamp = new Date().toISOString();
            const componentStr = component ? `[${component}]` : '';
            const logEntry = `[${timestamp}] [${level}] ${componentStr} ${message}\n`;

            // Écrire dans le fichier
            fs.appendFileSync(logPath, logEntry);

            // Afficher dans la console avec couleurs
            this.consoleLog(level, timestamp, message, component);

        } catch (err) {
            console.error(`❌ Erreur lors de l'écriture du log: ${err.message}`);
        }
    }

    /**
     * Affiche le log dans la console avec couleurs
     * @param {string} level - Niveau de log
     * @param {string} timestamp - Timestamp
     * @param {string} message - Message
     * @param {string} component - Composant
     */
    consoleLog(level, timestamp, message, component) {
        const colors = {
            DEBUG: '\x1b[90m',   // Gris
            INFO: '\x1b[36m',    // Cyan
            WARN: '\x1b[33m',    // Jaune
            ERROR: '\x1b[31m',   // Rouge
            SUCCESS: '\x1b[32m'  // Vert
        };

        const reset = '\x1b[0m';
        const color = colors[level] || colors.INFO;
        const componentStr = component ? `[${component}]` : '';

        console.log(`${color}[${timestamp}] [${level}] ${componentStr} ${message}${reset}`);
    }

    /**
     * Méthodes de commodité pour chaque niveau
     */
    debug(message, component = null, type = LOG_TYPES.DEBUG) {
        this.log(type, LOG_LEVELS.DEBUG, message, component);
    }

    info(message, component = null, type = LOG_TYPES.SYSTEM) {
        this.log(type, LOG_LEVELS.INFO, message, component);
    }

    warn(message, component = null, type = LOG_TYPES.SYSTEM) {
        this.log(type, LOG_LEVELS.WARN, message, component);
    }

    error(message, component = null, type = LOG_TYPES.ERROR) {
        this.log(type, LOG_LEVELS.ERROR, message, component);
    }

    success(message, component = null, type = LOG_TYPES.SYSTEM) {
        this.log(type, LOG_LEVELS.SUCCESS, message, component);
    }

    /**
     * Méthodes spécialisées par type
     */
    cron(level, message, component = 'CRON') {
        this.log(LOG_TYPES.CRON, level, message, component);
    }

    webhook(level, message, component = 'WEBHOOK') {
        this.log(LOG_TYPES.WEBHOOK, level, message, component);
    }

    scraping(level, message, component = 'SCRAPING') {
        this.log(LOG_TYPES.SCRAPING, level, message, component);
    }

    /**
     * Analyse les logs d'un type donné
     * @param {string} type - Type de log à analyser
     * @returns {Object} Statistiques des logs
     */
    analyzeLog(type) {
        try {
            const logPath = this.getLogPath(type);
            if (!fs.existsSync(logPath)) {
                return { total: 0, levels: {} };
            }

            const content = fs.readFileSync(logPath, 'utf8');
            const lines = content.split('\n').filter(line => line.trim());

            const stats = {
                total: lines.length,
                levels: {},
                lastEntry: null,
                fileSize: fs.statSync(logPath).size
            };

            lines.forEach(line => {
                Object.values(LOG_LEVELS).forEach(level => {
                    if (line.includes(`[${level}]`)) {
                        stats.levels[level] = (stats.levels[level] || 0) + 1;
                    }
                });
            });

            if (lines.length > 0) {
                stats.lastEntry = lines[lines.length - 1];
            }

            return stats;
        } catch (err) {
            console.error(`❌ Erreur lors de l'analyse du log ${type}: ${err.message}`);
            return { total: 0, levels: {} };
        }
    }

    /**
     * Nettoie tous les logs
     */
    cleanAllLogs() {
        try {
            Object.values(LOG_TYPES).forEach(type => {
                const logPath = this.getLogPath(type);
                if (fs.existsSync(logPath)) {
                    // Sauvegarder avant nettoyage
                    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
                    const backupPath = path.join(LOGS_DIR, 'backups', `${type}_${timestamp}.log`);

                    const backupDir = path.dirname(backupPath);
                    if (!fs.existsSync(backupDir)) {
                        fs.mkdirSync(backupDir, { recursive: true });
                    }

                    fs.copyFileSync(logPath, backupPath);
                    fs.writeFileSync(logPath, '');
                }
            });

            this.success('🧹 Tous les logs ont été nettoyés et sauvegardés');
        } catch (err) {
            this.error(`❌ Erreur lors du nettoyage: ${err.message}`);
        }
    }

    /**
     * Obtient un résumé de tous les logs
     * @returns {Object} Résumé des logs
     */
    getLogsSummary() {
        const summary = {};

        Object.values(LOG_TYPES).forEach(type => {
            summary[type] = this.analyzeLog(type);
        });

        return summary;
    }
}

// Instance singleton
export const logManager = new LogManager();

// Export des méthodes de commodité
export const { debug, info, warn, error, success, cron, webhook, scraping } = logManager;
