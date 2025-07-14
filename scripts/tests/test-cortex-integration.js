#!/usr/bin/env node

/**
 * 🧪 Test pour diagnostiquer le problème d'intégration Cortex
 */

import { crawlUrl } from './WireScanner/crawlUrl.js';
import { integrateWithCortex } from './WireScanner/cortexIntegration.js';

console.log('🧪 Test du problème d\'intégration Cortex\n');

async function testCortexIntegration() {
    try {
        console.log('1. Test de crawlUrl()...');

        // Mock des résultats de crawling pour test
        const mockResults = {
            success: true,
            articles: 334,
            skipped: 8251,
            errors: 0,
            feedCount: 985
        };

        console.log('2. Résultats mockés:', JSON.stringify(mockResults, null, 2));

        console.log('3. Test integrateWithCortex avec données mockées...');
        const integrationResult = await integrateWithCortex(mockResults);

        console.log('4. Résultat intégration:', integrationResult);

    } catch (error) {
        console.error('❌ Erreur lors du test:', error.message);
        console.error('Stack:', error.stack);
    }
}

testCortexIntegration()
    .then(() => {
        console.log('\n✅ Test terminé');
        process.exit(0);
    })
    .catch(error => {
        console.error('❌ Erreur fatale:', error);
        process.exit(1);
    });
