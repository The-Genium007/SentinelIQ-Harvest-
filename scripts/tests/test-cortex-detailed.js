/**
 * 🧪 Test détaillé du processus Cortex
 * Vérification du flux complet de sauvegarde des articles
 */

import { logger } from './utils/logger.js';
import { cortexDataManager } from './Cortex/dataManager.js';
import { ArticleRepository, ArticleUrlRepository } from './database/index.js';

console.log('🧪 Test détaillé du processus Cortex\n');

async function testCortexDataFlow() {
    try {
        // 1. Vérifier les URLs disponibles
        console.log('1️⃣ Vérification des URLs disponibles...');
        const articlesToProcess = await cortexDataManager.getArticlesToProcess({
            limit: 5,
            onlyUnprocessed: true
        });

        console.log(`   ✅ ${articlesToProcess.length} URLs à traiter récupérées`);

        if (articlesToProcess.length === 0) {
            console.log('   ⚠️ Aucune URL à traiter - toutes déjà traitées ?');
            return;
        }

        // Afficher les URLs
        console.log('   📋 URLs à traiter:');
        articlesToProcess.slice(0, 3).forEach((article, i) => {
            console.log(`      ${i + 1}. ${article.url}`);
        });

        // 2. Test de sauvegarde avec un article fictif
        console.log('\n2️⃣ Test de sauvegarde d\'un article fictif...');

        const testArticle = {
            url: 'https://test-cortex-' + Date.now() + '.example.com',
            title: 'Test Article Cortex - ' + new Date().toISOString(),
            content: 'Contenu de test pour vérifier la sauvegarde Cortex. Article créé le ' + new Date().toLocaleDateString('fr-FR'),
            author: 'Test Cortex',
            date: new Date().toISOString(),
            extractedAt: new Date().toISOString()
        };

        const saveResult = await cortexDataManager.saveProcessedArticle(testArticle);
        console.log(`   ${saveResult ? '✅' : '❌'} Sauvegarde test: ${saveResult ? 'SUCCÈS' : 'ÉCHEC'}`);

        // 3. Vérifier la sauvegarde
        if (saveResult) {
            console.log('\n3️⃣ Vérification de la sauvegarde...');
            const articleRepo = new ArticleRepository();
            const savedArticle = await articleRepo.findOne({ url: testArticle.url });

            if (savedArticle) {
                console.log('   ✅ Article retrouvé dans la base !');
                console.log(`   📝 Titre: ${savedArticle.title}`);
                console.log(`   🕒 Créé: ${savedArticle.created_at}`);
            } else {
                console.log('   ❌ Article NON retrouvé dans la base !');
            }
        }

        // 4. Statistiques finales
        console.log('\n4️⃣ Statistiques finales...');
        const stats = cortexDataManager.getStats();
        console.log('   📊 Stats DataManager:', JSON.stringify(stats, null, 2));

        const totalArticles = await new ArticleRepository().count();
        console.log(`   📰 Total articles en base: ${totalArticles}`);

    } catch (error) {
        console.error('❌ Erreur test:', error.message);
        console.error(error.stack);
    }
}

// Exécution du test
testCortexDataFlow();
