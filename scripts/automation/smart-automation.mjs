#!/usr/bin/env node
/**
 * 🤖 Automatisation complète du pipeline SentinelIQ Harvest
 * Lance automatiquement WireScanner → Cortex → Vérification selon les besoins
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

// Déterminer le répertoire de travail correct
const isInAutomationDir = process.cwd().endsWith('scripts/automation');
const rootDir = isInAutomationDir ? path.resolve(process.cwd(), '../..') : process.cwd();
const monitorPath = isInAutomationDir ? 'monitor-simple.mjs' : 'scripts/automation/monitor-simple.mjs';

console.log('🤖 AUTOMATISATION INTELLIGENTE SentinelIQ Harvest');
console.log('═══════════════════════════════════════════════════');

async function smartAutomation() {
    try {
        // 1. Surveillance de l'état actuel
        console.log('🔍 Analyse de l\'état actuel du système...');
        const { stdout: monitorOutput } = await execAsync(`node ${monitorPath}`);
        const systemState = JSON.parse(monitorOutput);

        console.log(`📊 État détecté: ${systemState.pipeline.status.toUpperCase()}`);
        console.log(`📈 URLs en attente: ${systemState.database.details.urlsEnAttente}`);
        console.log(`📰 Articles récents (24h): ${systemState.database.details.articlesRecents24h}`);

        // 2. Décision intelligente sur l'action à prendre
        let actionTaken = false;

        if (systemState.pipeline.status === 'backlog') {
            console.log('\n🚀 DÉCISION: URLs en backlog → Lancement du traitement Cortex');
            console.log('─'.repeat(60));

            await execAsync('npm run harvest:process', {
                cwd: rootDir
            });
            console.log('✅ Traitement Cortex terminé');
            actionTaken = true;

        } else if (systemState.pipeline.status === 'idle') {
            console.log('\n🚀 DÉCISION: Système inactif → Pipeline complet');
            console.log('─'.repeat(60));

            await execAsync('npm run harvest', {
                cwd: rootDir
            });
            console.log('✅ Pipeline complet terminé');
            actionTaken = true;

        } else if (systemState.database.details.urlsEnAttente > 500) {
            console.log('\n🚀 DÉCISION: Beaucoup d\'URLs en attente → Traitement Cortex');
            console.log('─'.repeat(60));

            await execAsync('npm run harvest:process', {
                cwd: rootDir
            });
            console.log('✅ Traitement Cortex terminé');
            actionTaken = true;

        } else if (systemState.database.details.articlesRecents24h === 0) {
            console.log('\n🚀 DÉCISION: Aucun article récent → Collection de nouvelles URLs');
            console.log('─'.repeat(60));

            await execAsync('npm run harvest:collect', {
                cwd: rootDir
            });
            console.log('✅ Déclenchement WireScanner effectué');

            // Attendre un peu et traiter
            console.log('⏳ Attente puis traitement...');
            setTimeout(async () => {
                await execAsync('npm run harvest:process', {
                cwd: rootDir
                });
                console.log('✅ Traitement différé terminé');
            }, 60000); // 1 minute

            actionTaken = true;

        } else {
            console.log('\n💤 DÉCISION: Système optimal → Aucune action nécessaire');
            console.log('─'.repeat(60));
            console.log('✅ Le pipeline fonctionne correctement');
            console.log(`📊 ${systemState.database.details.urlsEnAttente} URLs en attente (normal)`);
            console.log(`📰 ${systemState.database.details.articlesRecents24h} articles traités récemment`);
        }

        // 3. Vérification post-action
        if (actionTaken) {
            console.log('\n📊 Vérification post-action...');
            console.log('─'.repeat(35));

            // Attendre un peu pour la propagation
            await new Promise(resolve => setTimeout(resolve, 3000));

            const { stdout: postMonitorOutput } = await execAsync(`node ${monitorPath}`);
            const postSystemState = JSON.parse(postMonitorOutput);

            console.log(`📈 Nouvel état: ${postSystemState.pipeline.status.toUpperCase()}`);
            console.log(`📊 URLs en attente: ${postSystemState.database.details.urlsEnAttente}`);
            console.log(`📰 Articles totaux: ${postSystemState.database.details.totalArticles}`);

            // Comparaison
            const urlsTraitees = systemState.database.details.urlsEnAttente - postSystemState.database.details.urlsEnAttente;
            const nouveauxArticles = postSystemState.database.details.totalArticles - systemState.database.details.totalArticles;

            if (urlsTraitees > 0 || nouveauxArticles > 0) {
                console.log(`🎉 Succès: ${urlsTraitees} URLs traitées, ${nouveauxArticles} nouveaux articles`);
            } else {
                console.log('⏳ Traitement en cours ou pas de changement immédiat');
            }
        }

        // 4. Recommandations pour la prochaine fois
        console.log('\n🔮 RECOMMANDATIONS POUR LA SUITE');
        console.log('─'.repeat(40));

        const finalState = actionTaken ?
            JSON.parse((await execAsync(`node ${monitorPath}`)).stdout) :
            systemState;

        if (finalState.database.details.urlsEnAttente > 1000) {
            console.log('📅 Prochaine action suggérée: Traitement Cortex dans 1-2 heures');
            console.log('   Commande: npm run harvest:auto');
        } else if (finalState.database.details.urlsEnAttente < 100) {
            console.log('📅 Prochaine action suggérée: Nouvelle collecte dans 6-12 heures');
            console.log('   Commande: npm run harvest:collect');
        } else {
            console.log('📅 Système équilibré, surveillance recommandée dans 4 heures');
            console.log('   Commande: npm run status');
        }

        return {
            success: true,
            actionTaken,
            initialState: systemState.pipeline.status,
            finalState: actionTaken ? JSON.parse((await execAsync(`node ${monitorPath}`)).stdout).pipeline.status : systemState.pipeline.status
        };

    } catch (error) {
        console.error('\n❌ ERREUR LORS DE L\'AUTOMATISATION');
        console.error('═══════════════════════════════════');
        console.error(`🔥 Erreur: ${error.message}`);

        return {
            success: false,
            error: error.message
        };
    }
}

// Lancement de l'automatisation intelligente
smartAutomation().then(result => {
    console.log('\n' + '═'.repeat(60));
    if (result.success) {
        console.log('🎉 AUTOMATISATION INTELLIGENTE TERMINÉE !');
        if (result.actionTaken) {
            console.log(`📈 Transition: ${result.initialState.toUpperCase()} → ${result.finalState.toUpperCase()}`);
        }
        console.log('🤖 Le système est optimisé et fonctionne automatiquement');
        process.exit(0);
    } else {
        console.log('💥 AUTOMATISATION ÉCHOUÉE');
        console.log('❌ Vérifiez les logs et l\'état du système');
        process.exit(1);
    }
}).catch(error => {
    console.error('\n🚨 ERREUR CRITIQUE:', error.message);
    process.exit(1);
});
