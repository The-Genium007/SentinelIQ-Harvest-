/**
 * 🔍 Script pour explorer le schéma des tables articles et articlesUrl
 */

import { ArticleUrlRepository, ArticleRepository } from '../database/articleRepository.js';

console.log('🔍 Exploration des schémas...');

try {
    // Test table articlesUrl
    console.log('\n=== TABLE articlesUrl ===');
    const articleUrlRepo = new ArticleUrlRepository();
    const urlSample = await articleUrlRepo.findAll({ select: '*', limit: 1 });
    if (urlSample.length > 0) {
        console.log('Colonnes articlesUrl:', Object.keys(urlSample[0]));
    }

    // Test table articles
    console.log('\n=== TABLE articles ===');
    const articleRepo = new ArticleRepository();
    const articleSample = await articleRepo.findAll({ select: '*', limit: 1 });
    if (articleSample.length > 0) {
        console.log('Colonnes articles:', Object.keys(articleSample[0]));
        console.log('Exemple:', JSON.stringify(articleSample[0], null, 2));
    } else {
        console.log('⚠️ Table articles vide');
    }

} catch (error) {
    console.error('❌ Erreur:', error.message);
}
