// Script de planification et d'exécution automatique du crawl RSS avec gestion des logs et des erreurs
import cron from 'node-cron'
import fs from 'fs'
import path from 'path'
import http from 'http'


// Import de la fonction principale de crawl
import { crawlUrl } from './crawlUrl.js'

// 📁 Chemin du fichier de log pour l'exécution des tâches
const LOG_FILE = path.join(process.cwd(), 'cron-task.log')

/**
 * Fonction utilitaire pour écrire un message dans le fichier de log et la console.
 * @param {string} msg - Message à logger
 */
function logToFile(msg) {
    const ts = new Date().toISOString()
    const line = `[${ts}] ${msg}\n`
    fs.appendFile(LOG_FILE, line, err => {
        if (err) console.error('Erreur écriture log fichier :', err)
    })
    console.log(line.trim())
}

/**
 * Exécute la tâche principale de crawl et log le résultat.
 */
async function executeTask() {
    logToFile('▶️ Lancement de crawlUrl')
    try {
        await crawlUrl()
        logToFile('✅ crawlUrl terminé avec succès')
    } catch (err) {
        logToFile(`❌ Erreur dans crawlUrl: ${err.message}`)
        throw err
    }
}

/**
 * Exécute la tâche avec gestion des erreurs et retries (jusqu'à 3 tentatives).
 * @param {number} retries - Nombre de tentatives déjà effectuées
 */
async function safeExecute(retries = 0) {
    const MAX = 3
    try {
        await executeTask()
    } catch (err) {
        logToFile(`❌ Erreur (${err.message}). Retry ${retries + 1}/${MAX}`)
        if (retries < MAX - 1) {
            return safeExecute(retries + 1)
        }
        logToFile('🛑 Échec définitif.')
    }
}

// 🚫 Protection contre chevauchement d'exécution
let running = false

// 🕔 Planification cron : tous les jours à 03:00 Europe/Paris
const task = cron.schedule(
    '0 3 * * *',
    () => {
        if (running) {
            logToFile('⏭️ Tâche précédente toujours en cours, saut de cette exécution.')
            return
        }
        running = true
        safeExecute().finally(() => {
            running = false
        })
    },
    {
        scheduled: true,
        timezone: 'Europe/Paris'
    }
)

// 🔍 Validation de l’expression cron au démarrage
if (!cron.validate('0 3 * * *')) {
    throw new Error('🚫 Expression cron invalide')
}

// 📝 Démarrage du cron
logToFile('🔄 Cron démarré – tous les jours à 03:00 Europe/Paris')

// 📤 Fonctions pour stopper ou relancer la tâche cron dynamiquement
export function stopTask() { task.stop(), logToFile('⏸️ Cron stoppé') }
export function startTask() { task.start(), logToFile('▶️ Cron relancé') }

// Serveur HTTP minimal pour le healthcheck Coolify
const PORT = process.env.PORT || 3000
http.createServer((req, res) => {
    if (req.method === 'GET' && req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'text/plain' })
        res.end('OK')
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' })
        res.end('Not found')
    }
}).listen(PORT, () => {
    logToFile(`🌐 Serveur HTTP healthcheck démarré sur le port ${PORT}`)
})