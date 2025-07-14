import { getSupabaseClient } from './database/client.js';

async function checkColumns() {
    try {
        const supabaseClient = await getSupabaseClient();
        
        // Test simple pour voir les colonnes disponibles
        const { data, error } = await supabaseClient
            .from('articlesUrl')
            .select('*')
            .limit(1);
            
        if (error) {
            console.error('Erreur:', error);
            return;
        }
        
        if (data && data.length > 0) {
            console.log('Colonnes disponibles:', Object.keys(data[0]));
            console.log('Exemple de données:', data[0]);
        }
        
    } catch (error) {
        console.error('Erreur générale:', error);
    } finally {
        process.exit(0);
    }
}

checkColumns();
