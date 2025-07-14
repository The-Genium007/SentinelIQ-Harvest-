import { getSupabaseClient } from './database/client.js';

console.log('🔧 Ajout de contrainte unique sur les URLs des articles');

async function addUniqueConstraint() {
    try {
        const supabaseClient = await getSupabaseClient();
        
        console.log('🔍 Vérification des doublons existants...');
        
        // Rechercher les doublons actuels
        const { data: duplicates, error: dupError } = await supabaseClient
            .rpc('find_duplicate_articles', {});
            
        if (dupError) {
            console.log('⚠️ Fonction RPC non disponible, vérification manuelle...');
            
            // Vérification manuelle des doublons
            const { data: articles } = await supabaseClient
                .from('articles')
                .select('id, url, title')
                .order('url');
                
            if (articles) {
                const urlCounts = {};
                let duplicateCount = 0;
                
                articles.forEach(article => {
                    if (urlCounts[article.url]) {
                        duplicateCount++;
                        console.log(`🔄 Doublon détecté: ${article.url} (ID: ${article.id})`);
                    } else {
                        urlCounts[article.url] = 1;
                    }
                });
                
                console.log(`📊 ${duplicateCount} doublons détectés sur ${articles.length} articles`);
            }
        }
        
        console.log('✅ Vérification terminée');
        console.log('💡 Pour ajouter une contrainte unique au niveau base de données:');
        console.log('   ALTER TABLE articles ADD CONSTRAINT articles_url_unique UNIQUE (url);');
        
    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        process.exit(0);
    }
}

addUniqueConstraint();
