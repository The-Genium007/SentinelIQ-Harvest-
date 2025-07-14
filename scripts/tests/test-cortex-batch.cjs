const logger = require('./utils/logger');
const supabaseClient = require('./database/client');
const contentProcessor = require('./Cortex/contentProcessor');

async function testCortexBatch() {
    try {
        logger.info('🔍 Récupération des URLs non traitées...');
        
        // Récupérer quelques URLs non traitées
        const { data: urls, error } = await supabaseClient
            .from('articlesUrl')
            .select('id, url, title, description, pubDate')
            .is('processedAt', null)
            .limit(5);
            
        if (error) {
            logger.error('❌ Erreur récupération URLs:', error);
            return;
        }
        
        if (!urls || urls.length === 0) {
            logger.warn('⚠️ Aucune URL non traitée trouvée');
            return;
        }
        
        logger.info(`📚 ${urls.length} URLs à traiter trouvées`);
        
        for (const url of urls) {
            try {
                logger.info(`🔄 Traitement de: ${url.url}`);
                
                // Traiter l'article
                const article = await contentProcessor.processArticle(url);
                
                if (article) {
                    logger.success(`✅ Article traité: ${article.title?.substring(0, 50)}...`);
                    
                    // Marquer l'URL comme traitée
                    await supabaseClient
                        .from('articlesUrl')
                        .update({ processedAt: new Date().toISOString() })
                        .eq('id', url.id);
                        
                } else {
                    logger.warn(`⚠️ Échec traitement: ${url.url}`);
                }
                
                // Pause entre traitements
                await new Promise(resolve => setTimeout(resolve, 2000));
                
            } catch (error) {
                logger.error(`❌ Erreur traitement ${url.url}:`, error.message);
            }
        }
        
        logger.success('🎉 Test batch terminé');
        
    } catch (error) {
        logger.error('❌ Erreur test batch:', error);
    } finally {
        process.exit(0);
    }
}

testCortexBatch();
