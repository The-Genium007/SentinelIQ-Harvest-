// cronWithFileLogging.js
import cron from 'node-cron'
import fs from 'fs'
import path from 'path'

// fichier a lancer
import { crawlUrl } from './crawlUrl.js'

// 📁 Configure le fichier de log
const LOG_FILE = path.join(process.cwd(), 'cron-task.log')

// Fonction utilitaire pour logguer dans le fichier + console
function logToFile(msg) {
    const ts = new Date().toISOString()
    const line = `[${ts}] ${msg}\n`
    fs.appendFile(LOG_FILE, line, err => {
        if (err) console.error('Erreur écriture log fichier :', err)
    })
    console.log(line.trim())
}

// ✅ Lance le script
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

// 🔁 Gestion des erreurs et retries
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

// 🚫 Protection contre chevauchement
let running = false

// 🕔 Planification cron
const task = cron.schedule(
    '0 3 * * *', // tous les jours à 03:00
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

// 🔍 Validation de l’expresssion cron
if (!cron.validate('0 3 * * *')) {
    throw new Error('🚫 Expression cron invalide')
}

// 📝 Démarrage
logToFile('🔄 Cron démarré – tous les jours à 03:00 Europe/Paris')

// 📤 Permet de stopper/redémarrer si nécessaire
export function stopTask() { task.stop(), logToFile('⏸️ Cron stoppé') }
export function startTask() { task.start(), logToFile('▶️ Cron relancé') }