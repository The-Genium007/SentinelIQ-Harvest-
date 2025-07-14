import { cortexPerformanceManager } from './Cortex/performanceManager.js';

console.log('🔍 Test de la correction Cortex...');

try {
    // Test de l'instance
    console.log('✅ PerformanceManager importé:', typeof cortexPerformanceManager);
    
    // Test de la méthode endBatch
    console.log('✅ Méthode endBatch:', typeof cortexPerformanceManager.endBatch);
    
    // Test d'appel avec paramètres
    cortexPerformanceManager.endBatch('test-batch-1');
    console.log('✅ Appel endBatch(batchId) réussi');
    
    cortexPerformanceManager.endBatch('test-batch-2', { scraped: 5, processed: 10 });
    console.log('✅ Appel endBatch(batchId, batchResults) réussi');
    
    console.log('🎉 Correction validée !');
    
} catch (error) {
    console.error('❌ Erreur:', error.message);
}
