/**
 * 🧪 Test complet de session Cortex avec debug détaillé
 */

import { logger } from '../utils/logger.js';

// Test d'une session complète
console.log('🚀 Test de session Cortex complète - Mode debug');

try {
    console.log('📋 Étape 1: Import du module principal...');
    const { startCortex } = await import('./start.js');
    logger.info('✅ Module principal importé', 'CortexFullTest');

    console.log('📋 Étape 2: Lancement d\'une session de test...');
    const startTime = Date.now();

    const results = await startCortex({
        useOptimized: true,
        enableMonitoring: true,
        maxArticles: 5, // Limite à 5 articles pour un test rapide
        enableBatching: false, // Désactiver le batching pour simplifier
        testMode: true
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log('📋 Étape 3: Analyse des résultats...');
    logger.info(`✅ Session terminée en ${duration}ms`, 'CortexFullTest');
    logger.info(`📊 Résultats: ${JSON.stringify(results, null, 2)}`, 'CortexFullTest');

    if (results.success) {
        logger.info('🎉 Test de session Cortex réussi !', 'CortexFullTest');
    } else {
        logger.error(`❌ Session échouée: ${results.error}`, 'CortexFullTest');
    }

} catch (error) {
    logger.error(`💥 Erreur critique lors du test: ${error.message}`, 'CortexFullTest');
    console.error('Stack trace complète:', error.stack);
    process.exit(1);
}
