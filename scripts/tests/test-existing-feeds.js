#!/usr/bin/env node

/**
 * Test de marquage des flux invalides avec des URLs réelles de la base
 */

import { feedProcessor } from './WireScanner/feedProcessor.js';
import { rssRepository } from './database/rssRepository.js';

console.log('🧪 Test avec des flux existants connus pour être en erreur\n');

// URLs tirées des logs d'erreur
const problemUrls = [
    'https://www.maxkohler.com/feed.xml',
    'https://nickolinger.com/rss.xml',
    'https://paulkinchla.com/feed/',
    'https://brionv.com/log/feed/',
    'https://graficos.net/feed.xml'
];

console.log('📋 Test avec ces flux existants:');
problemUrls.forEach((url, index) => {
    console.log(`   ${index + 1}. ${url}`);
});

console.log('\n🔍 Vérification du statut initial:');

// Vérifier statut initial
for (const url of problemUrls) {
    try {
        const feed = await rssRepository.findByUrl(url);
        if (feed) {
            console.log(`   📊 ${url}: ${feed.valid ? 'VALIDE' : 'INVALIDE'}`);
        } else {
            console.log(`   ⚠️ ${url}: Non trouvé`);
        }
    } catch (error) {
        console.log(`   ❌ ${url}: Erreur (${error.message})`);
    }
}

console.log('\n🔄 Test de parsing des flux...\n');

try {
    // Traiter seulement les 2 premiers pour éviter d'être trop verbeux
    const testUrls = problemUrls.slice(0, 2);
    const results = await feedProcessor.processMultipleFeeds(testUrls);

    console.log('📊 Résultats:');
    results.forEach((result, index) => {
        const status = result.success ? '✅ Succès' : '❌ Échec';
        console.log(`   ${index + 1}. ${status}: ${result.url}`);
        if (!result.success) {
            console.log(`      Erreur: ${result.error.substring(0, 100)}...`);
        }
    });

    console.log('\n🔍 Vérification du nouveau statut:');

    // Vérifier le nouveau statut
    for (const url of testUrls) {
        try {
            const feed = await rssRepository.findByUrl(url);
            if (feed) {
                console.log(`   📊 ${url}: ${feed.valid ? 'VALIDE' : 'INVALIDE'}`);
            } else {
                console.log(`   ⚠️ ${url}: Non trouvé`);
            }
        } catch (error) {
            console.log(`   ❌ ${url}: Erreur (${error.message})`);
        }
    }

} catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
}

console.log('\n✅ Test terminé');
