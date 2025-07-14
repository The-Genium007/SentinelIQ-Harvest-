/**
 * 🔍 Debug détaillé des batches Cortex
 */

import { cortexDataManager } from './Cortex/dataManager.js';
import { logger } from './utils/logger.js';

async function debugBatchProcess() {
    try {
        console.log('🔍 Debug détaillé des batches Cortex\n');

        // 1. Récupérer les articles
        console.log('1️⃣ Récupération des articles à traiter...');
        const articlesToProcess = await cortexDataManager.getArticlesToProcess({
            limit: 5,
            onlyUnprocessed: true
        });

        console.log(`📋 Articles récupérés: ${articlesToProcess.length}`);
        articlesToProcess.forEach((article, i) => {
            console.log(`   ${i + 1}. ${article.url}`);
        });

        // 2. Test de division en chunks
        console.log('\n2️⃣ Test de division en chunks...');

        function chunkArray(array, size) {
            const chunks = [];
            for (let i = 0; i < array.length; i += size) {
                chunks.push(array.slice(i, i + size));
            }
            return chunks;
        }

        const chunks = chunkArray(articlesToProcess, 3);
        console.log(`📦 Nombre de chunks: ${chunks.length}`);
        chunks.forEach((chunk, i) => {
            console.log(`   Chunk ${i + 1}: ${chunk.length} articles`);
            chunk.forEach((article, j) => {
                console.log(`      ${j + 1}. ${article.url}`);
            });
        });

        // 3. Test de traitement d'un article simple
        if (articlesToProcess.length > 0) {
            console.log('\\n3️⃣ Test de scraping d\'un article...');
            const testArticle = articlesToProcess[0];
            console.log(`🎯 Test avec: ${testArticle.url}`);

            // Import du scrapingEngine pour test direct
            try {
                const { scrapingEngine } = await import('./Cortex/scrapingEngine.js');

                // Initialiser le moteur
                await scrapingEngine.initialize();

                // Tenter de scraper un article
                const scrapResult = await scrapingEngine.scrapArticle(testArticle);
                console.log('✅ Résultat scraping:', JSON.stringify(scrapResult, null, 2));

                // Nettoyer
                await scrapingEngine.cleanup();

            } catch (scrapError) {
                console.log('❌ Erreur scraping:', scrapError.message);
                console.log('   Cette erreur pourrait expliquer pourquoi 0 articles sont traités');
            }
        }

    } catch (error) {
        console.error('❌ Erreur debug:', error.message);
        console.error(error.stack);
    }
}

debugBatchProcess();
