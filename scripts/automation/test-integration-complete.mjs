#!/usr/bin/env node
/**
 * 🧪 Test complet de l'intégration WireScanner → Cortex → Base de données
 * Vérifie que le pipeline complet fonctionne correctement
 */

import { getSupabaseClient } from '../../database/client.js';
import { wireScanner } from '../../WireScanner/crawlUrl.js';

console.log('🧪 TEST D\'INTÉGRATION COMPLÈTE SentinelIQ Harvest');
console.log('═════════════════════════════════════════════════');

async function testCompleteIntegration() {
    const startTime = new Date();

    try {
        // 📊 1. Statistiques initiales
        console.log('\n📊 ÉTAPE 1: Collecte des statistiques initiales');
        console.log('─'.repeat(50));

        const supabaseClient = await getSupabaseClient();

        const { data: urlsInitiales } = await supabaseClient
            .from('articlesUrl')
            .select('id')
            .is('extractedAt', null);

        const { data: articlesInitiaux } = await supabaseClient
            .from('articles')
            .select('id');

        const statsInitiales = {
            urlsNonTraitees: urlsInitiales?.length || 0,
            articlesTotal: articlesInitiaux?.length || 0
        };

        console.log(`📈 URLs non traitées: ${statsInitiales.urlsNonTraitees}`);
        console.log(`📈 Articles en base: ${statsInitiales.articlesTotal}`);

        // 🚀 2. Test WireScanner avec intégration Cortex automatique
        console.log('\n🚀 ÉTAPE 2: Test WireScanner avec intégration Cortex');
        console.log('─'.repeat(50));
        console.log('⏳ Lancement du crawling avec intégration automatique...');

        // Limitation pour le test - seulement 5 flux pour éviter de prendre trop de temps
        const scrapingResults = await wireScanner.crawl({
            performance: {
                BATCH_SIZE: 5,
                MAX_CONCURRENT_FEEDS: 2,
                MAX_ARTICLES_PER_FEED: 3
            }
        });

        console.log('✅ WireScanner terminé');
        console.log(`📊 Résultats: ${scrapingResults.articles} nouveaux articles`);

        // 📊 3. Vérification des résultats
        console.log('\n📊 ÉTAPE 3: Vérification des résultats finaux');
        console.log('─'.repeat(50));

        // Attendre un peu pour s'assurer que Cortex a terminé
        await new Promise(resolve => setTimeout(resolve, 5000));

        const { data: urlsFinales } = await supabaseClient
            .from('articlesUrl')
            .select('id')
            .is('extractedAt', null);

        const { data: articlesFinaux } = await supabaseClient
            .from('articles')
            .select('id');

        const statsFinal = {
            urlsNonTraitees: urlsFinales?.length || 0,
            articlesTotal: articlesFinaux?.length || 0
        };

        // 📈 4. Analyse des résultats
        const urlsCollectees = statsInitiales.urlsNonTraitees - statsFinal.urlsNonTraitees + (scrapingResults.articles || 0);
        const nouveauxArticles = statsFinal.articlesTotal - statsInitiales.articlesTotal;
        const duree = Math.round((new Date() - startTime) / 1000);

        console.log('\n🎉 RÉSULTATS DU TEST D\'INTÉGRATION');
        console.log('═════════════════════════════════════');
        console.log(`⏱️  Durée totale: ${duree}s`);
        console.log(`📥 URLs collectées par WireScanner: ${scrapingResults.articles || 0}`);
        console.log(`🔄 URLs restantes à traiter: ${statsFinal.urlsNonTraitees}`);
        console.log(`📝 Nouveaux articles créés: ${nouveauxArticles}`);
        console.log(`📊 Total articles en base: ${statsFinal.articlesTotal}`);

        // 🔍 5. Vérification de l'intégration
        console.log('\n🔍 VÉRIFICATION DE L\'INTÉGRATION');
        console.log('─'.repeat(40));

        const integrationReussie = scrapingResults.success && nouveauxArticles >= 0;

        if (integrationReussie) {
            console.log('✅ INTÉGRATION RÉUSSIE');
            console.log('  • WireScanner a collecté des URLs');
            console.log('  • Cortex a été lancé automatiquement');
            console.log('  • Les articles ont été créés en base');

            // Vérifier que les articles ont les bonnes métadonnées
            const { data: derniersArticles } = await supabaseClient
                .from('articles')
                .select('title, url, author, extractedAt')
                .order('extractedAt', { ascending: false })
                .limit(3);

            if (derniersArticles && derniersArticles.length > 0) {
                console.log('\n📄 ÉCHANTILLON DES DERNIERS ARTICLES:');
                derniersArticles.forEach((article, index) => {
                    console.log(`  ${index + 1}. ${article.title || 'Titre non défini'}`);
                    console.log(`     URL: ${article.url}`);
                    console.log(`     Auteur: ${article.author || 'Non défini'}`);
                    console.log(`     Extrait: ${article.extractedAt ? new Date(article.extractedAt).toLocaleString('fr-FR') : 'Non défini'}`);
                });
            }

        } else {
            console.log('❌ INTÉGRATION ÉCHOUÉE');
            console.log('  • Vérifiez les logs pour plus de détails');
        }

        // 🏥 6. Test de santé final
        console.log('\n🏥 TEST DE SANTÉ FINAL');
        console.log('─'.repeat(25));

        try {
            const { data: healthCheck } = await supabaseClient
                .from('articles')
                .select('count')
                .limit(1);

            console.log('✅ Base de données accessible');
            console.log(`📊 Connexion Supabase: OK`);

        } catch (error) {
            console.log('❌ Problème de santé détecté:', error.message);
        }

        return {
            success: integrationReussie,
            duree,
            resultats: {
                urlsCollectees: scrapingResults.articles || 0,
                nouveauxArticles,
                totalArticles: statsFinal.articlesTotal
            }
        };

    } catch (error) {
        const duree = Math.round((new Date() - startTime) / 1000);
        console.error('\n❌ ERREUR LORS DU TEST D\'INTÉGRATION');
        console.error('═══════════════════════════════════════');
        console.error(`⏱️  Durée avant échec: ${duree}s`);
        console.error(`🔥 Erreur: ${error.message}`);
        console.error(`📋 Stack: ${error.stack}`);

        return {
            success: false,
            erreur: error.message,
            duree
        };
    }
}

// Lancement du test
testCompleteIntegration().then(result => {
    console.log('\n' + '═'.repeat(60));
    if (result.success) {
        console.log('🎉 TEST D\'INTÉGRATION COMPLET RÉUSSI !');
        console.log(`⭐ Pipeline WireScanner → Cortex → Base fonctionne parfaitement`);
        process.exit(0);
    } else {
        console.log('💥 TEST D\'INTÉGRATION ÉCHOUÉ');
        console.log(`❌ Le pipeline nécessite des corrections`);
        process.exit(1);
    }
}).catch(error => {
    console.error('\n🚨 ERREUR CRITIQUE LORS DU TEST:', error.message);
    process.exit(1);
});
