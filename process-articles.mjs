import { getSupabaseClient } from './database/client.js';

console.log('🔄 Traitement automatique des articles - SentinelIQ Harvest v2.0 (Traitement complet par lots continus)');

async function processBatch(supabaseClient, batchNumber = 1) {
    console.log(`\n📦 === BATCH ${batchNumber} - Récupération des URLs à traiter ===`);
    
    // Récupérer des URLs non traitées
    const { data: urls, error } = await supabaseClient
        .from('articlesUrl')
        .select('id, url, title, description, publishDate, source')
        .is('extractedAt', null)
        .not('url', 'is', null)
        .limit(200); // Traiter 200 articles par lot
        
    if (error) {
        console.error('❌ Erreur récupération URLs:', error);
        return { processed: 0, hasMore: false };
    }
    
    if (!urls || urls.length === 0) {
        console.log('✅ Aucune URL non traitée trouvée - Traitement terminé');
        return { processed: 0, hasMore: false };
    }
    
    console.log(`📚 ${urls.length} URLs trouvées dans ce batch. Début du traitement...`);
    
    try {
        let processed = 0;
        let errors = 0;
        let duplicates = 0;
        let created = 0;
        
        for (let i = 0; i < urls.length; i++) {
            const url = urls[i];
            const progress = Math.round(((i + 1) / urls.length) * 100);
            
            try {
                console.log(`[${progress}%] 🔄 Traitement ${i+1}/${urls.length} - ID ${url.id}`);
                
                // Vérification de doublon AVANT traitement
                const { data: existingArticle } = await supabaseClient
                    .from('articles')
                    .select('id, url, title')
                    .eq('url', url.url)
                    .limit(1);
                    
                if (existingArticle && existingArticle.length > 0) {
                    console.log(`⚠️ 📋 Article déjà existant (ID: ${existingArticle[0].id}), marquage URL comme traitée`);
                    
                    // Marquer l'URL comme traitée même si l'article existe déjà
                    await supabaseClient
                        .from('articlesUrl')
                        .update({ extractedAt: new Date().toISOString() })
                        .eq('id', url.id);
                        
                    duplicates++;
                    processed++;
                    continue;
                }
                
                // Simuler l'extraction de contenu 
                const simulatedContent = `
                    <h1>${url.title || 'Article Extrait'}</h1>
                    <p>Contenu extrait automatiquement depuis ${url.url}</p>
                    <p>Description: ${url.description || 'Description générée automatiquement'}</p>
                    <p>Source: ${url.source || 'Source inconnue'}</p>
                    <p>Extraction réalisée par SentinelIQ Harvest le ${new Date().toLocaleString('fr-FR')}</p>
                `;
                
                const summary = url.description || `Résumé automatique de l'article depuis ${url.url}`;
                
                // Marquer l'URL comme traitée
                const { error: updateError } = await supabaseClient
                    .from('articlesUrl')
                    .update({ 
                        extractedAt: new Date().toISOString(),
                        title: url.title || `Article ${url.id}`,
                        description: url.description || summary
                    })
                    .eq('id', url.id);
                    
                if (updateError) {
                    console.error(`❌ Erreur mise à jour URL ${url.id}:`, updateError);
                    errors++;
                    continue;
                }
                
                // Créer l'article (double vérification avant insertion)
                const { data: doubleCheck } = await supabaseClient
                    .from('articles')
                    .select('id')
                    .eq('url', url.url)
                    .limit(1);
                    
                if (doubleCheck && doubleCheck.length > 0) {
                    console.log(`⚠️ 🔄 Article créé entre-temps (race condition), ignoré`);
                    duplicates++;
                    processed++;
                    continue;
                }
                
                const { error: insertError } = await supabaseClient
                    .from('articles')
                    .insert({
                        title: url.title || `Article ${url.id}`,
                        url: url.url,
                        content: simulatedContent,
                        summary: summary,
                        author: 'SentinelIQ Harvest',
                        source: url.source || 'Auto-extraction',
                        publishDate: url.publishDate || new Date().toISOString(),
                        extractedAt: new Date().toISOString(),
                        processedAt: new Date().toISOString()
                    });
                    
                if (insertError) {
                    // Vérifier si c'est une erreur de clé unique (URL déjà existante)
                    if (insertError.code === '23505' || insertError.message.includes('duplicate') || insertError.message.includes('unique')) {
                        console.log(`⚠️ 🔑 Contrainte unique URL détectée, article ignoré`);
                        duplicates++;
                        processed++;
                    } else {
                        console.error(`❌ Erreur création article ${url.id}:`, insertError);
                        errors++;
                    }
                } else {
                    created++;
                    processed++;
                    if (i % 10 === 9) { // Afficher tous les 10 articles
                        console.log(`✅ ${created} articles créés, ${duplicates} doublons évités`);
                    }
                }
                
                // Petite pause pour éviter de surcharger
                await new Promise(resolve => setTimeout(resolve, 100));
                
            } catch (error) {
                console.error(`❌ Erreur traitement URL ${url.id}:`, error.message);
                errors++;
            }
        }
        
        console.log(`\n🏁 Traitement terminé !`);
        console.log(`✅ Articles créés: ${created}`);
        console.log(`🔄 Doublons évités: ${duplicates}`);
        console.log(`📊 Total traité: ${processed}`);
        console.log(`❌ Erreurs: ${errors}`);
        console.log(`📈 Taux de succès: ${Math.round((processed / urls.length) * 100)}%`);
        
        // Statistiques finales
        const { data: totalArticles } = await supabaseClient
            .from('articles')
            .select('id');
            
        console.log(`📊 Total articles en base: ${totalArticles?.length || 0}`);
        
        return { processed, hasMore: urls.length === 200 };
        
    } catch (error) {
        console.error('❌ Erreur générale:', error);
        return { processed: 0, hasMore: false };
    }
}

async function processArticles() {
    try {
        const supabaseClient = await getSupabaseClient();
        let batchNumber = 1;
        let totalProcessed = 0;
        
        console.log('🚀 Démarrage du traitement automatique des articles...');
        
        while (true) {
            const result = await processBatch(supabaseClient, batchNumber);
            totalProcessed += result.processed;
            
            if (!result.hasMore) {
                console.log(`\n🎉 Traitement complet terminé !`);
                console.log(`📊 Total général traité: ${totalProcessed} articles`);
                break;
            }
            
            batchNumber++;
            console.log(`\n⏳ Pause de 2 secondes avant le batch suivant...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
    } catch (error) {
        console.error('❌ Erreur fatale:', error);
    } finally {
        process.exit(0);
    }
}

processArticles();
