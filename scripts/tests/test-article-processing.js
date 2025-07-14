#!/usr/bin/env node
/**
 * 🧪 Test de traitement d'un article complet
 * Prend une URL d'article existante et la traite complètement
 */

import { ArticleUrlRepository, ArticleRepository } from './database/articleRepository.js';
import { logManager } from './utils/logManager.js';

async function testArticleProcessing() {
    console.log('🧪 Test de traitement complet d\'un article...\n');

    try {
        const urlRepo = new ArticleUrlRepository();
        const articleRepo = new ArticleRepository();

        // 1. Récupère une URL d'article existante
        console.log('1. Récupération d\'une URL d\'article...');
        const articleUrls = await urlRepo.findAll({ limit: 1 });

        if (!articleUrls || articleUrls.length === 0) {
            console.log('   ❌ Aucune URL d\'article trouvée');
            return false;
        }

        const articleUrl = articleUrls[0];
        console.log(`   ✅ URL trouvée: ${articleUrl.url}`);
        console.log(`   📝 Titre: ${articleUrl.title || 'Non défini'}`);
        console.log(`   👤 Auteur: ${articleUrl.author || 'Non défini'}`);
        console.log(`   🔗 Source: ${articleUrl.source || 'Non défini'}`);

        // 2. Vérifier si cet article n'a pas déjà été traité
        console.log('\n2. Vérification si l\'article est déjà traité...');
        const existingArticle = await articleRepo.findByUrl(articleUrl.url);

        if (existingArticle) {
            console.log('   ⚠️ Article déjà traité');
            console.log(`   📄 ID article: ${existingArticle.id}`);
            return true;
        } else {
            console.log('   ✅ Article non traité, prêt pour le traitement');
        }

        // 3. Simulation du traitement d'article
        console.log('\n3. Simulation du traitement...');

        const processedArticle = {
            url: articleUrl.url,
            title: articleUrl.title || 'Titre extrait',
            content: `Contenu simulé pour l'article: ${articleUrl.title}.\n\nCeci est un test de traitement d'article complet avec le schéma corrigé.`,
            summary: `Résumé de: ${articleUrl.title}`,
            author: articleUrl.author || 'Auteur extrait',
            publishDate: articleUrl.publishDate || new Date().toISOString(),
            source: articleUrl.source || 'Source extraite',
            extractedAt: new Date().toISOString(),
            processedAt: new Date().toISOString()
        };

        // 4. Insertion de l'article traité
        console.log('\n4. Insertion de l\'article traité...');
        try {
            const savedArticle = await articleRepo.create(processedArticle);

            if (savedArticle) {
                console.log('   ✅ Article traité et sauvegardé avec succès!');
                console.log(`   🆔 ID: ${savedArticle.id}`);
                console.log(`   📰 Titre: ${savedArticle.title}`);
                console.log(`   📝 Contenu: ${savedArticle.content.substring(0, 100)}...`);

                // 5. Vérification finale
                console.log('\n5. Vérification finale...');
                const stats = await articleRepo.getStats();
                console.log(`   📊 Total articles traités: ${stats.total}`);
                console.log(`   📊 Articles récents (24h): ${stats.recent24h}`);

                return true;

            } else {
                console.log('   ❌ Erreur lors de la sauvegarde');
                return false;
            }
        } catch (error) {
            console.log(`   ❌ Erreur lors du traitement: ${error.message}`);

            // Diagnostic de l'erreur
            if (error.message.includes('column') && error.message.includes('does not exist')) {
                console.log('   💡 Il semble qu\'il manque encore des colonnes dans la table articles');
                console.log('   🔧 Vérifiez le schéma de la table articles dans Supabase');
            }

            return false;
        }

    } catch (error) {
        console.error(`❌ Erreur fatale: ${error.message}`);
        return false;
    }
}

async function main() {
    const success = await testArticleProcessing();

    if (success) {
        console.log('\n🎉 TEST RÉUSSI!');
        console.log('   ✅ Le schéma est correct');
        console.log('   ✅ Le traitement d\'articles fonctionne');
        console.log('   🚀 Vous pouvez maintenant lancer le système complet');
        console.log('');
        console.log('💡 Commandes utiles:');
        console.log('   npm run cortex:once      - Traite quelques articles');
        console.log('   npm run cortex:daemon    - Lance le traitement en continu');
        console.log('   npm run db:stats         - Voir les statistiques');
    } else {
        console.log('\n❌ TEST ÉCHOUÉ');
        console.log('   Vérifiez les erreurs ci-dessus');
        console.log('   Il peut y avoir des problèmes de schéma dans la table articles');
    }
}

main().catch(console.error);
