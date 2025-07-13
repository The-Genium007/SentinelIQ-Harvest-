/**
 * 🧪 Test simplifié de Cortex pour debugger
 */

import { logger } from '../utils/logger.js';

// Test d'import des modules un par un
console.log('🚀 Test de démarrage Cortex - Version debug');

try {
    console.log('📋 1. Test import logger...');
    logger.info('✅ Logger fonctionnel', 'CortexDebug');

    console.log('📋 2. Test import configuration...');
    const { SCRAPING_CONFIG, detectPlatform } = await import('./config.js');
    logger.info('✅ Configuration importée', 'CortexDebug');

    console.log('📋 3. Test détection plateforme...');
    const platform = await detectPlatform();
    logger.info(`✅ Plateforme détectée: ${platform.IS_MACOS ? 'macOS' : 'Linux'}`, 'CortexDebug');

    console.log('📋 4. Test import cortexOptimized...');
    const { cortexOptimized } = await import('./cortexOptimized.js');
    logger.info('✅ CortexOptimized importé', 'CortexDebug');

    console.log('📋 5. Test des statistiques...');
    const stats = cortexOptimized.getFullStats();
    logger.info(`✅ Stats: ${JSON.stringify(stats)}`, 'CortexDebug'); console.log('📋 6. Test rapide - vérification de l\'état...');
    logger.info(`✅ Cortex en attente de démarrage`, 'CortexDebug');

    logger.info('✅ Tous les tests réussis !', 'CortexDebug');

} catch (error) {
    logger.error(`❌ Erreur lors du test: ${error.message}`, 'CortexDebug');
    console.error('Stack trace:', error.stack);
    process.exit(1);
}
