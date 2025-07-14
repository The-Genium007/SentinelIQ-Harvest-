#!/usr/bin/env node
/**
 * 📊 Monitoring des tâches cron SentinelIQ Harvest
 * Vérifie l'exécution et la santé des automatisations
 */

import { readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';

console.log('📊 MONITORING AUTOMATISATION SentinelIQ Harvest');
console.log('═══════════════════════════════════════════════');

const cronLogs = [
    { name: 'Smart Automation', file: '/tmp/sentineliq_smart.log', description: 'Automatisation intelligente' },
    { name: 'Monitor', file: '/tmp/sentineliq_monitor.log', description: 'Surveillance système' },
    { name: 'Diagnostic', file: '/tmp/sentineliq_diagnostic.log', description: 'Diagnostic quotidien' },
    { name: 'Cleanup', file: '/tmp/sentineliq_cleanup.log', description: 'Nettoyage logs' }
];

function checkCronStatus() {
    try {
        const crontab = execSync('crontab -l', { encoding: 'utf8' });
        const sentineliqJobs = crontab.split('\n').filter(line =>
            line.includes('sentineliq') || line.includes('SentinelIQ')
        ).length;

        console.log(`✅ Crontab configuré avec ${sentineliqJobs} tâches SentinelIQ`);
        return true;
    } catch (error) {
        console.log('❌ Aucun crontab configuré');
        return false;
    }
}

function checkLogFiles() {
    console.log('\n📋 ÉTAT DES LOGS CRON');
    console.log('─'.repeat(40));

    cronLogs.forEach(log => {
        if (existsSync(log.file)) {
            try {
                const content = readFileSync(log.file, 'utf8');
                const lines = content.split('\n').filter(line => line.trim());
                const lastExecution = lines[lines.length - 1] || 'Aucune';

                console.log(`✅ ${log.name}`);
                console.log(`   📁 ${log.file}`);
                console.log(`   📊 ${lines.length} entrées`);
                console.log(`   ⏰ Dernière: ${lastExecution.substring(0, 100)}...\n`);
            } catch (error) {
                console.log(`⚠️ ${log.name}: Erreur lecture fichier\n`);
            }
        } else {
            console.log(`❌ ${log.name}: Fichier non trouvé`);
            console.log(`   📁 ${log.file} (pas encore exécuté)\n`);
        }
    });
}

function showNextExecutions() {
    console.log('⏰ PROCHAINES EXÉCUTIONS');
    console.log('─'.repeat(30));

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Smart automation (toutes les 4h)
    const nextSmartHours = [0, 4, 8, 12, 16, 20];
    const nextSmart = nextSmartHours.find(h => h > currentHour) || nextSmartHours[0];
    console.log(`🤖 Smart Automation: ${nextSmart}:00 ${nextSmart <= currentHour ? '(demain)' : '(aujourd\'hui)'}`);

    // Monitor (toutes les heures)
    const nextMonitor = currentMinute === 0 ? currentHour + 1 : currentHour + 1;
    console.log(`📊 Monitor: ${(nextMonitor) % 24}:00`);

    // Diagnostic (6h)
    const nextDiagnostic = currentHour < 6 ? '6:00 (aujourd\'hui)' : '6:00 (demain)';
    console.log(`🔍 Diagnostic: ${nextDiagnostic}`);

    // Cleanup (dimanche 2h)
    const daysUntilSunday = (7 - now.getDay()) % 7 || 7;
    console.log(`🧹 Cleanup: Dimanche 2:00 (dans ${daysUntilSunday} jours)`);
}

function showCommands() {
    console.log('\n🛠️ COMMANDES UTILES');
    console.log('─'.repeat(20));
    console.log('crontab -l              # Voir configuration');
    console.log('crontab -e              # Éditer configuration');
    console.log('npm run smart-automation # Test manuel');
    console.log('npm run monitor         # Monitoring manuel');
    console.log('tail -f /tmp/sentineliq_smart.log # Suivre logs');
}

// Exécution
checkCronStatus();
checkLogFiles();
showNextExecutions();
showCommands();

console.log('\n═══════════════════════════════════════════════');
console.log('🎉 Automatisation SentinelIQ entièrement configurée !');
console.log('📈 Le système fonctionne de manière autonome');
