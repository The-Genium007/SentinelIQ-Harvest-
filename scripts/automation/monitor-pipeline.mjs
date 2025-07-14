#!/usr/bin/env node
/**
 * 🔍 Script de surveillance pour vérifier l'état du pipeline SentinelIQ Harvest
 * Vérifie périodiquement que WireScanner → Cortex → Base fonctionne
 */

import { getSupabaseClient } from '../../database/client.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

console.log('🔍 SURVEILLANCE PIPELINE SentinelIQ Harvest');
console.log('═══════════════════════════════════════════');

async function checkPipelineHealth() {
    const results = {
        timestamp: new Date().toISOString(),
        database: { status: 'unknown', details: {} },
        services: { status: 'unknown', details: {} },
        pipeline: { status: 'unknown', details: {} }
    };

    try {
        console.log('📊 Vérification de la santé de la base de données...');

        // 1. Test de la base de données
        const supabaseClient = await getSupabaseClient();

        const { data: urlsCount } = await supabaseClient
            .from('articlesUrl')
            .select('id', { count: 'exact' })
            .limit(1);

        const { data: articlesCount } = await supabaseClient
            .from('articles')
            .select('id', { count: 'exact' })
            .limit(1);

        const { data: urlsNonTraitees } = await supabaseClient
            .from('articlesUrl')
            .select('id')
            .is('extractedAt', null);

        const { data: articlesRecents } = await supabaseClient
            .from('articles')
            .select('id, extractedAt')
            .gte('extractedAt', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

        results.database = {
            status: 'healthy',
            details: {
                totalUrls: urlsCount?.length || 0,
                totalArticles: articlesCount?.length || 0,
                urlsEnAttente: urlsNonTraitees?.length || 0,
                articlesRecents24h: articlesRecents?.length || 0
            }
        };

        console.log(`✅ Base de données: ${results.database.details.totalUrls} URLs, ${results.database.details.totalArticles} articles`);
        console.log(`📊 En attente: ${results.database.details.urlsEnAttente} URLs, Récents (24h): ${results.database.details.articlesRecents24h}`);

    } catch (error) {
        results.database = {
            status: 'error',
            details: { error: error.message }
        };
        console.log('❌ Erreur base de données:', error.message);
    }

    try {
        console.log('\n🔧 Vérification des services...');

        // 2. Test des services via healthcheck
        const { stdout: healthOutput } = await execAsync('curl -s http://localhost:3000/health || echo "Service non accessible"');

        if (healthOutput.includes('Service non accessible')) {
            results.services = {
                status: 'down',
                details: { healthcheck: 'Service non accessible sur le port 3000' }
            };
            console.log('⚠️ Serveur healthcheck non accessible');
        } else {
            try {
                const healthData = JSON.parse(healthOutput);
                results.services = {
                    status: 'healthy',
                    details: healthData
                };
                console.log('✅ Services actifs:', Object.keys(healthData).join(', '));
            } catch {
                results.services = {
                    status: 'partial',
                    details: { raw: healthOutput.substring(0, 100) }
                };
                console.log('⚠️ Réponse healthcheck inattendue');
            }
        }

    } catch (error) {
        results.services = {
            status: 'error',
            details: { error: error.message }
        };
        console.log('❌ Erreur services:', error.message);
    }

    try {
        console.log('\n🔄 Vérification du pipeline...');

        // 3. Analyse du pipeline
        const urlsEnAttente = results.database.details.urlsEnAttente || 0;
        const articlesRecents = results.database.details.articlesRecents24h || 0;

        let pipelineStatus = 'unknown';
        const pipelineDetails = {};

        if (urlsEnAttente > 1000) {
            pipelineStatus = 'backlog';
            pipelineDetails.issue = 'Beaucoup d\'URLs en attente de traitement';
            pipelineDetails.recommendation = 'Lancer npm run cortex:batch';
        } else if (urlsEnAttente > 100) {
            pipelineStatus = 'busy';
            pipelineDetails.issue = 'URLs en cours de traitement';
        } else if (articlesRecents > 0) {
            pipelineStatus = 'active';
            pipelineDetails.issue = 'Pipeline actif et fonctionnel';
        } else {
            pipelineStatus = 'idle';
            pipelineDetails.issue = 'Pas d\'activité récente';
            pipelineDetails.recommendation = 'Vérifier si WireScanner fonctionne ou lancer npm run wire-scanner:trigger';
        }

        results.pipeline = {
            status: pipelineStatus,
            details: pipelineDetails
        };

        console.log(`📈 Pipeline: ${pipelineStatus.toUpperCase()}`);
        if (pipelineDetails.issue) console.log(`   ${pipelineDetails.issue}`);
        if (pipelineDetails.recommendation) console.log(`💡 Recommandation: ${pipelineDetails.recommendation}`);

    } catch (error) {
        results.pipeline = {
            status: 'error',
            details: { error: error.message }
        };
        console.log('❌ Erreur pipeline:', error.message);
    }

    // 4. Résumé final
    console.log('\n📋 RÉSUMÉ DE SURVEILLANCE');
    console.log('─'.repeat(30));

    const allHealthy = results.database.status === 'healthy' &&
        results.services.status === 'healthy' &&
        ['active', 'busy', 'idle'].includes(results.pipeline.status);

    if (allHealthy) {
        console.log('✅ SYSTÈME EN BONNE SANTÉ');
        console.log('   Tous les composants fonctionnent correctement');
    } else {
        console.log('⚠️ ATTENTION REQUISE');
        if (results.database.status !== 'healthy') console.log('   • Base de données: problème détecté');
        if (results.services.status !== 'healthy') console.log('   • Services: problème détecté');
        if (!['active', 'busy', 'idle'].includes(results.pipeline.status)) console.log('   • Pipeline: problème détecté');
    }

    // Actions automatiques suggérées
    if (results.pipeline.status === 'backlog') {
        console.log('\n🤖 ACTIONS AUTOMATIQUES DISPONIBLES:');
        console.log('   npm run cortex:batch     # Traiter les URLs en attente');
        console.log('   npm run auto-harvest     # Pipeline complet');
    } else if (results.pipeline.status === 'idle') {
        console.log('\n🤖 ACTIONS AUTOMATIQUES DISPONIBLES:');
        console.log('   npm run wire-scanner:trigger  # Collecter de nouvelles URLs');
        console.log('   npm run auto-harvest          # Pipeline complet');
    }

    return results;
}

// Options de ligne de commande
const args = process.argv.slice(2);
const isJsonOutput = args.includes('--json');
const isWatch = args.includes('--watch');

async function runCheck() {
    const results = await checkPipelineHealth();

    if (isJsonOutput) {
        // Sortie JSON pure, sans logs de console
        console.log(JSON.stringify(results, null, 2));
    } else {
        console.log(`🕐 ${new Date().toLocaleString('fr-FR')}\n`);
    }

    return results;
}

if (isWatch) {
    console.log('👀 Mode surveillance activé (vérification toutes les 5 minutes)');
    console.log('   Ctrl+C pour arrêter\n');

    // Première vérification
    runCheck();

    // Vérifications périodiques
    setInterval(async () => {
        console.log('\n' + '═'.repeat(60));
        await runCheck();
    }, 5 * 60 * 1000); // 5 minutes

} else {
    // Vérification unique
    runCheck().then(() => {
        process.exit(0);
    }).catch(error => {
        console.error('❌ Erreur lors de la surveillance:', error.message);
        process.exit(1);
    });
}
