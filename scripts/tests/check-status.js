#!/usr/bin/env node

/**
 * Script de diagnostic pour WireScanner
 * Vérifie l'état du système et les fichiers de commande
 */

import { existsSync, readFileSync, statSync } from 'fs'
import { join } from 'path'

const COMMAND_FILE = join(process.cwd(), 'command_trigger.txt')

console.log('🔍 Diagnostic WireScanner\n')

// Vérification du fichier de commande
console.log('📁 Fichier de commande:')
if (existsSync(COMMAND_FILE)) {
    try {
        const content = readFileSync(COMMAND_FILE, 'utf8').trim()
        const stats = statSync(COMMAND_FILE)
        console.log(`   ✅ Fichier présent: ${COMMAND_FILE}`)
        console.log(`   📝 Contenu: "${content}"`)
        console.log(`   🕒 Créé le: ${stats.birthtime.toLocaleString()}`)
        console.log(`   ⚠️  COMMANDE EN ATTENTE - Le scrapping va se déclencher`)
    } catch (error) {
        console.log(`   ❌ Erreur lecture: ${error.message}`)
    }
} else {
    console.log(`   🟢 Aucun fichier de commande (normal)`)
}

console.log('\n📊 Logs récents:')

// Vérification des logs
const logFiles = [
    'logs/system.log',
    'logs/scraping.log',
    'logs/error.log'
]

for (const logFile of logFiles) {
    if (existsSync(logFile)) {
        try {
            const stats = statSync(logFile)
            console.log(`   📄 ${logFile}: ${Math.round(stats.size / 1024)}KB (modifié ${stats.mtime.toLocaleString()})`)
        } catch (error) {
            console.log(`   ❌ ${logFile}: Erreur lecture`)
        }
    } else {
        console.log(`   ⚪ ${logFile}: Non trouvé`)
    }
}

console.log('\n🎯 Actions disponibles:')
console.log('   • Déclencher manuellement: node manual-trigger.js start')
console.log('   • Script rapide: ./trigger-scrapping.sh')
console.log('   • Voir les logs: tail -f logs/system.log')
console.log('   • État détaillé: node manual-trigger.js status')

console.log('\n💡 Le cron vérifie les commandes toutes les 30 secondes')
console.log('   Prochaine vérification automatique dans max 30s')
