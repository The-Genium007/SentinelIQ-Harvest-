#!/usr/bin/env node

/**
 * 🧪 Test pour vérifier que seuls les flux valides sont scrapés
 */

import { dataManager } from './WireScanner/dataManager.js';
import { rssRepository } from './database/rssRepository.js';
import { logger } from './utils/logger.js';

console.log('🧪 Test de filtrage des flux invalides\n');

async function testValidFeedsOnly() {
    try {
        // 1. Récupération de tous les flux (valides et invalides)
        console.log('📋 1. Récupération de tous les flux (incluant invalides)...');
        const allFeeds = await rssRepository.getAllFeeds(false); // false = tous
        console.log(`   📊 Total flux en base: ${allFeeds.length}`);

        const validFeeds = allFeeds.filter(feed => feed.valid === true);
        const invalidFeeds = allFeeds.filter(feed => feed.valid === false);

        console.log(`   ✅ Flux valides: ${validFeeds.length}`);
        console.log(`   ❌ Flux invalides: ${invalidFeeds.length}`);

        // 2. Test de la méthode dataManager.getAllRssFeeds()
        console.log('\n📋 2. Test de dataManager.getAllRssFeeds()...');
        const feedsForScraping = await dataManager.getAllRssFeeds();
        console.log(`   📊 Flux retournés par dataManager: ${feedsForScraping.length}`);

        // 3. Vérification que tous les flux retournés sont valides
        console.log('\n📋 3. Vérification de la validité des flux...');
        let allReturnedFeedsAreValid = true;

        for (const feed of feedsForScraping) {
            if (feed.valid === false || feed.active === false) {
                console.log(`   ❌ ERREUR: Flux invalide trouvé: ${feed.url}`);
                allReturnedFeedsAreValid = false;
            }
        }

        // 4. Comparaison des nombres
        console.log('\n📋 4. Analyse des résultats...');
        if (feedsForScraping.length === validFeeds.length) {
            console.log('   ✅ Nombre correct: seuls les flux valides sont retournés');
        } else {
            console.log(`   ❌ PROBLÈME: ${feedsForScraping.length} retournés vs ${validFeeds.length} valides`);
            allReturnedFeedsAreValid = false;
        }

        // 5. Vérification qu'aucun flux invalide n'est inclus
        if (invalidFeeds.length > 0) {
            console.log('\n📋 5. Vérification exclusion des flux invalides...');
            for (const invalidFeed of invalidFeeds) {
                const foundInResults = feedsForScraping.find(f => f.url === invalidFeed.url);
                if (foundInResults) {
                    console.log(`   ❌ ERREUR: Flux invalide inclus dans les résultats: ${invalidFeed.url}`);
                    allReturnedFeedsAreValid = false;
                } else {
                    console.log(`   ✅ Flux invalide correctement exclu: ${invalidFeed.url}`);
                }
            }
        }

        // 6. Résultat final
        console.log('\n🏁 RÉSULTAT FINAL:');
        if (allReturnedFeedsAreValid) {
            console.log('   ✅ SUCCÈS: Seuls les flux valides sont récupérés pour le scraping');
            console.log('   ✅ Les flux marqués comme invalides sont correctement exclus');
        } else {
            console.log('   ❌ ÉCHEC: Des flux invalides sont encore récupérés pour le scraping');
        }

        return allReturnedFeedsAreValid;

    } catch (error) {
        console.error('❌ Erreur lors du test:', error.message);
        return false;
    }
}

// Exécution du test
testValidFeedsOnly()
    .then(success => {
        console.log(`\n🧪 Test terminé: ${success ? 'RÉUSSI' : 'ÉCHOUÉ'}`);
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error('❌ Erreur fatale:', error);
        process.exit(1);
    });
