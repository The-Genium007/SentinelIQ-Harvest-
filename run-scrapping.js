#!/usr/bin/env node

/**
 * Script pour lancer le scrapping WireScanner manuellement
 * Usage: node run-scrapping.js
 */

import { runScrappingNow } from './WireScanner/start.js';
import { logger } from './utils/logger.js';

async function main() {
    try {
        console.log('🚀 Démarrage du scrapping manuel...\n');

        const results = await runScrappingNow();

        console.log('\n✅ Scrapping terminé avec succès !');
        if (results) {
            console.log(`📊 Résultats: ${JSON.stringify(results, null, 2)}`);
        }

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Erreur lors du scrapping manuel:');
        console.error(error.message);
        process.exit(1);
    }
}

// Gestion des signaux pour un arrêt propre
process.on('SIGINT', () => {
    console.log('\n🛑 Arrêt demandé par l\'utilisateur');
    process.exit(1);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Arrêt demandé par le système');
    process.exit(1);
});

// Gestion des erreurs non capturées
process.on('unhandledRejection', (reason, promise) => {
    logger.error(`Erreur non gérée: ${reason}`, 'RunScrapping');
    console.error('❌ Erreur non gérée:', reason);
    process.exit(1);
});

main();
