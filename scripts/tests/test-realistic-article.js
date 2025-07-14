/**
 * 🧪 Test avec article réaliste pour Cortex
 */

import { cortexDataManager } from './Cortex/dataManager.js';
import { ArticleRepository } from './database/index.js';

async function testWithRealisticArticle() {
    try {
        console.log('🧪 Test avec article réaliste...\n');

        // Article avec contenu suffisant
        const realisticArticle = {
            url: 'https://test-realistic-' + Date.now() + '.example.com',
            title: 'Guide complet pour optimiser les performances des applications web modernes',
            content: `
            L'optimisation des performances des applications web est un sujet crucial dans le développement moderne.
            Avec l'augmentation constante du trafic et des attentes des utilisateurs, les développeurs doivent 
            mettre en place des stratégies efficaces pour garantir une expérience utilisateur optimale.
            
            Les techniques d'optimisation incluent la minification des ressources, la mise en cache intelligente,
            l'optimisation des images, et l'utilisation de CDN pour distribuer le contenu géographiquement.
            
            Il est également important de surveiller les Core Web Vitals et d'utiliser des outils comme Lighthouse
            pour évaluer les performances. La compression gzip, le lazy loading, et la réduction des requêtes HTTP
            sont autant de moyens d'améliorer significativement les temps de chargement.
            
            En conclusion, une approche méthodique et l'utilisation d'outils appropriés permettent d'obtenir
            des performances optimales pour les applications web modernes.`,
            author: 'Expert Web Performance',
            date: new Date().toISOString(),
            extractedAt: new Date().toISOString()
        };

        console.log('📝 Article à sauvegarder:');
        console.log(`   Titre: ${realisticArticle.title}`);
        console.log(`   URL: ${realisticArticle.url}`);
        console.log(`   Contenu: ${realisticArticle.content.length} caractères`);
        console.log('');

        // Test de sauvegarde
        const saveResult = await cortexDataManager.saveProcessedArticle(realisticArticle);
        console.log(`${saveResult ? '✅' : '❌'} Sauvegarde: ${saveResult ? 'SUCCÈS' : 'ÉCHEC'}`);

        if (saveResult) {
            // Vérifier en base
            const articleRepo = new ArticleRepository();
            const savedArticle = await articleRepo.findOne({ url: realisticArticle.url });

            if (savedArticle) {
                console.log('✅ Article retrouvé dans la base !');
                console.log(`   ID: ${savedArticle.id}`);
                console.log(`   Créé: ${savedArticle.created_at}`);

                // Compter le total maintenant
                const totalCount = await articleRepo.count();
                console.log(`📊 Total articles en base maintenant: ${totalCount}`);
            } else {
                console.log('❌ Article NON retrouvé dans la base');
            }
        }

        // Stats
        const stats = cortexDataManager.getStats();
        console.log('\n📊 Statistiques DataManager:');
        console.log(`   Articles insérés: ${stats.articlesInserted}`);
        console.log(`   Échecs validation: ${stats.validationFailures}`);
        console.log(`   Doublons ignorés: ${stats.duplicatesSkipped}`);

    } catch (error) {
        console.error('❌ Erreur:', error.message);
    }
}

testWithRealisticArticle();
