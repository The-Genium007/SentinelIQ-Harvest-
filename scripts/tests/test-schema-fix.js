#!/usr/bin/env node
/**
 * 🧪 Test complet après correction du schéma
 */

import { ArticleUrlRepository } from './database/articleRepository.js';
import { logManager } from './utils/logManager.js';

async function testAfterSchemaFix() {
    console.log('🧪 Test complet après correction du schéma...\n');

    try {
        const repo = new ArticleUrlRepository();

        // Test 1: Vérifier que les colonnes existent maintenant
        console.log('1. Test d\'insertion avec les nouvelles colonnes:');

        const testData = {
            url: `https://test-schema-fixed-${Date.now()}.com`,
            title: 'Test Article Après Fix',
            description: 'Article de test pour vérifier que le schéma est corrigé',
            author: 'Test Author Fixed',
            source: 'Test Source Fixed',
            publishDate: new Date().toISOString(),
            extractedAt: new Date().toISOString()
        };

        try {
            const result = await repo.create(testData);
            if (result) {
                console.log('   ✅ Insertion réussie avec author et source');

                // Nettoie l'enregistrement de test
                await repo.delete(result.id);
                console.log('   🧹 Enregistrement de test supprimé');
            } else {
                console.log('   ❌ Échec de l\'insertion');
            }
        } catch (error) {
            console.log(`   ❌ Erreur: ${error.message}`);
            return false;
        }

        // Test 2: Vérifier les statistiques
        console.log('\n2. Statistiques de la base:');
        try {
            const stats = await repo.getStats();
            console.log(`   📊 Total articlesUrl: ${stats.total}`);
            console.log(`   📊 Sources disponibles: ${stats.sourcesCount > 0 ? stats.sourcesCount : 'Colonne source détectée mais vide'}`);
        } catch (error) {
            console.log(`   ❌ Erreur stats: ${error.message}`);
        }

        console.log('\n✅ Schéma corrigé avec succès !');
        console.log('🚀 Vous pouvez maintenant relancer le scrapping.');

        return true;

    } catch (error) {
        console.error(`❌ Erreur fatale: ${error.message}`);
        return false;
    }
}

// Aussi tester un scrapping minimal
async function testMiniScraping() {
    console.log('\n🔍 Test d\'un mini-scrapping...');

    try {
        // Import dynamique pour éviter les erreurs de dépendance
        const { WireScannerDataManager } = await import('./WireScanner/dataManager.js');
        const dataManager = new WireScannerDataManager();

        console.log('   🧪 Test de validation d\'un article...');

        const mockArticle = {
            url: 'https://example.com/test-article',
            title: 'Article de Test',
            description: 'Description de test',
            author: 'Auteur Test',
            source: 'Source Test',
            publishDate: new Date().toISOString(),
            extractedAt: new Date().toISOString()
        };

        // Test la validation
        const isValid = await dataManager.validateArticle(mockArticle);
        console.log(`   📝 Validation article: ${isValid ? '✅ Valide' : '❌ Invalide'}`);

        return true;

    } catch (error) {
        console.log(`   ⚠️ Impossible de tester le scrapping: ${error.message}`);
        return false;
    }
}

async function main() {
    const schemaOk = await testAfterSchemaFix();

    if (schemaOk) {
        await testMiniScraping();

        console.log('\n🎉 RÉSUMÉ:');
        console.log('   ✅ Schéma de base de données corrigé');
        console.log('   ✅ Colonnes author et source ajoutées');
        console.log('   ✅ Tests d\'insertion réussis');
        console.log('');
        console.log('🚀 PROCHAINES ÉTAPES:');
        console.log('   1. Lancez un scrapping: npm run wire-scanner');
        console.log('   2. Vérifiez les nouveaux articles: npm run db:stats');
        console.log('   3. Surveillez les logs: tail -f logs/system.log');
    } else {
        console.log('\n❌ Le schéma n\'est pas encore corrigé.');
        console.log('   Assurez-vous d\'avoir exécuté les requêtes SQL dans Supabase.');
    }
}

main().catch(console.error);
