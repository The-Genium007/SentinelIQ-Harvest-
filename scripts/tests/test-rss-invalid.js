#!/usr/bin/env node

/**
 * Script de test pour la fonctionnalité de marquage des flux invalides
 */

import { feedProcessor } from './WireScanner/feedProcessor.js';
import { rssRepository } from './database/rssRepository.js';

console.log('🧪 Test du système de marquage des flux invalides\n');

// Test avec une URL qui va générer une erreur
const testUrls = [
    'https://url-inexistante-test.com/feed.xml', // Erreur DNS
    'https://httpstat.us/404/feed.xml', // Erreur 404
    'https://httpstat.us/403/feed.xml'  // Erreur 403
];

console.log('📋 Flux de test à traiter:');
testUrls.forEach((url, index) => {
    console.log(`   ${index + 1}. ${url}`);
});

console.log('\n🔄 Démarrage du traitement...\n');

try {
    // Traitement des flux de test
    const results = await feedProcessor.processMultipleFeeds(testUrls);

    console.log('📊 Résultats du traitement:');
    results.forEach((result, index) => {
        const status = result.success ? '✅ Succès' : '❌ Échec';
        console.log(`   ${index + 1}. ${status}: ${result.url}`);
        if (!result.success) {
            console.log(`      Erreur: ${result.error}`);
        }
    });

    console.log('\n📋 Vérification du statut en base de données:');

    // Vérifier les statuts en base
    for (const url of testUrls) {
        try {
            const feed = await rssRepository.findByUrl(url);
            if (feed) {
                console.log(`   🔍 ${url}: ${feed.valid ? 'VALIDE' : 'INVALIDE'}`);
            } else {
                console.log(`   ⚠️ ${url}: Non trouvé en base`);
            }
        } catch (error) {
            console.log(`   ❌ ${url}: Erreur vérification (${error.message})`);
        }
    }

} catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
}

console.log('\n✅ Test terminé');
