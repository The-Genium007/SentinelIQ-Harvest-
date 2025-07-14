import { getSupabaseClient } from '../../database/client.js';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

console.log('🔄 Intégration automatique SentinelIQ Harvest v2.0 - Pipeline complet');

async function autoIntegration() {
    const startTime = new Date();
    let statsInitiales = {};
    let statsFinal = {};

    try {
        // 📊 Statistiques initiales
        console.log('� Collecte des statistiques initiales...');
        const supabaseClient = await getSupabaseClient();

        const { data: urlsInitiales } = await supabaseClient
            .from('articlesUrl')
            .select('id')
            .is('extractedAt', null);

        const { data: articlesInitiaux } = await supabaseClient
            .from('articles')
            .select('id');

        statsInitiales = {
            urlsNonTraitees: urlsInitiales?.length || 0,
            articlesTotal: articlesInitiaux?.length || 0
        };

        console.log(`📈 URLs non traitées: ${statsInitiales.urlsNonTraitees}`);
        console.log(`📈 Articles en base: ${statsInitiales.articlesTotal}`);

        // 📡 Étape 1: Scraping RSS avec WireScanner
        console.log('\n🚀 ÉTAPE 1: Scraping RSS avec WireScanner...');
        console.log('⏳ Collecte des nouvelles URLs d\'articles...');

        await execAsync('npm run harvest:collect', {
            cwd: path.resolve(process.cwd()),
            timeout: 600000, // 10 minutes timeout (pour accommoder les gros crawlings)
            maxBuffer: 10 * 1024 * 1024 // 10MB buffer
        });
        console.log('✅ WireScanner terminé avec succès');

        // Vérification des URLs collectées
        const { data: urlsCollectees } = await supabaseClient
            .from('articlesUrl')
            .select('id')
            .is('extractedAt', null);

        const nouvellesUrls = (urlsCollectees?.length || 0) - statsInitiales.urlsNonTraitees;
        console.log(`📊 Nouvelles URLs collectées: ${nouvellesUrls}`);

        // Attendre la propagation en base
        await new Promise(resolve => setTimeout(resolve, 3000));

        // 🧠 Étape 2: Traitement articles avec Cortex
        console.log('\n🧠 ÉTAPE 2: Traitement des articles avec Cortex...');
        console.log('⏳ Extraction de contenu et création des articles...');

        // Utiliser spawn pour avoir plus de contrôle
        const cortexPromise = new Promise((resolve, reject) => {
            const cortexProcess = spawn('node', ['process-articles.mjs'], {
                cwd: process.cwd(),
                stdio: ['ignore', 'pipe', 'pipe']
            });

            let cortexOutput = '';

            cortexProcess.stdout.on('data', (data) => {
                const message = data.toString();
                cortexOutput += message;
                // Afficher uniquement les messages importants
                if (message.includes('✅') || message.includes('📊') || message.includes('🎉')) {
                    console.log(message.trim());
                }
            });

            cortexProcess.stderr.on('data', (data) => {
                console.warn('⚠️', data.toString().trim());
            });

            cortexProcess.on('close', (code) => {
                if (code === 0) {
                    console.log('✅ Cortex terminé avec succès');
                    resolve(cortexOutput);
                } else {
                    reject(new Error(`Cortex a échoué avec le code ${code}`));
                }
            });

            cortexProcess.on('error', (error) => {
                reject(error);
            });
        });

        await cortexPromise;

        // 📊 Étape 3: Vérification et statistiques finales
        console.log('\n📊 ÉTAPE 3: Vérification des résultats...');

        const { data: urlsFinales } = await supabaseClient
            .from('articlesUrl')
            .select('id')
            .is('extractedAt', null);

        const { data: articlesFinaux } = await supabaseClient
            .from('articles')
            .select('id');

        statsFinal = {
            urlsNonTraitees: urlsFinales?.length || 0,
            articlesTotal: articlesFinaux?.length || 0
        };

        const urlsTraitees = statsInitiales.urlsNonTraitees - statsFinal.urlsNonTraitees;
        const nouveauxArticles = statsFinal.articlesTotal - statsInitiales.articlesTotal;
        const duree = Math.round((new Date() - startTime) / 1000);

        console.log('\n🎉 INTÉGRATION AUTOMATIQUE TERMINÉE !');
        console.log('═══════════════════════════════════════');
        console.log(`⏱️  Durée totale: ${duree}s`);
        console.log(`📥 URLs collectées: ${nouvellesUrls}`);
        console.log(`🔄 URLs traitées: ${urlsTraitees}`);
        console.log(`📝 Nouveaux articles: ${nouveauxArticles}`);
        console.log(`📊 Total articles: ${statsFinal.articlesTotal}`);
        console.log(`📈 URLs restantes: ${statsFinal.urlsNonTraitees}`);
        console.log(`🎯 Taux de traitement: ${urlsTraitees > 0 ? Math.round((nouveauxArticles / urlsTraitees) * 100) : 0}%`);

        // Vérification de la santé de la base
        console.log('\n� Vérification santé de la base...');
        try {
            const { stdout: healthOutput } = await execAsync('npm run db:health', {
                cwd: process.cwd()
            });
            const healthData = JSON.parse(healthOutput);
            console.log(`✅ Base de données: ${healthData.status || 'OK'}`);
        } catch (error) {
            console.log('⚠️ Impossible de vérifier la santé de la base');
        }

        return {
            success: true,
            duree,
            statistiques: {
                urlsCollectees: nouvellesUrls,
                urlsTraitees,
                nouveauxArticles,
                totalArticles: statsFinal.articlesTotal
            }
        };

    } catch (error) {
        const duree = Math.round((new Date() - startTime) / 1000);
        console.error('\n❌ ERREUR LORS DE L\'INTÉGRATION AUTOMATIQUE');
        console.error('═══════════════════════════════════════════════');
        console.error(`⏱️  Durée avant échec: ${duree}s`);
        console.error(`🔥 Erreur: ${error.message}`);

        if (error.stack) {
            console.error('📋 Stack trace:', error.stack);
        }

        return {
            success: false,
            erreur: error.message,
            duree
        };
    }
}

autoIntegration().then(result => {
    if (result.success) {
        console.log('\n✨ PIPELINE COMPLET EXÉCUTÉ AVEC SUCCÈS ✨');
        process.exit(0);
    } else {
        console.log('\n💥 PIPELINE ÉCHOUÉ');
        process.exit(1);
    }
}).catch(error => {
    console.error('\n🚨 ERREUR CRITIQUE:', error.message);
    process.exit(1);
});
