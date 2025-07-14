#!/usr/bin/env node

/**
 * 🧪 Test direct de rssRepository.getAllFeeds
 */

import { rssRepository } from './database/rssRepository.js';

console.log('🧪 Test direct rssRepository.getAllFeeds\n');

async function testGetAllFeeds() {
    try {
        // Test avec activeOnly = true
        console.log('📋 Test avec activeOnly = true...');
        const validFeeds = await rssRepository.getAllFeeds(true);
        console.log(`   Résultat: ${validFeeds.length} flux`);

        // Vérifier si tous sont valides
        const invalidFeedsFound = validFeeds.filter(feed => feed.valid === false);
        console.log(`   Flux invalides trouvés: ${invalidFeedsFound.length}`);

        if (invalidFeedsFound.length > 0) {
            console.log('   Flux invalides:');
            invalidFeedsFound.forEach(feed => {
                console.log(`      ${feed.url} (valid: ${feed.valid})`);
            });
        }

        // Test avec activeOnly = false
        console.log('\n📋 Test avec activeOnly = false...');
        const allFeeds = await rssRepository.getAllFeeds(false);
        console.log(`   Résultat: ${allFeeds.length} flux`);

        const trulyValid = allFeeds.filter(feed => feed.valid === true);
        const trulyInvalid = allFeeds.filter(feed => feed.valid === false);

        console.log(`   Vraiment valides: ${trulyValid.length}`);
        console.log(`   Vraiment invalides: ${trulyInvalid.length}`);

    } catch (error) {
        console.error('❌ Erreur:', error.message);
        console.error('Stack:', error.stack);
    }
}

testGetAllFeeds()
    .then(() => process.exit(0))
    .catch(error => {
        console.error('❌ Erreur fatale:', error);
        process.exit(1);
    });
