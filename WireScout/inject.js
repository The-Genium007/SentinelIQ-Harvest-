import fs from 'fs/promises';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Chargement des variables d'environnement depuis le fichier key.env
dotenv.config({ path: './key.env' });

// Initialisation du client Supabase avec les clés d'accès
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Vérification de la connexion à la base Supabase
const { error: pingError } = await supabase.from('ListUrlRss').select('id').limit(1);
if (pingError) {
    console.error('❌ Connexion à Supabase échouée :', pingError.message);
    process.exit(1);
}

// Chargement des URLs à injecter depuis le fichier feedsList.json
const { links: urls } = JSON.parse(await fs.readFile('feedsList.json', 'utf-8'));

// Préparation des objets à insérer dans la base
const articles = urls.map(url => ({ url }));

// Insertion des URLs par lots de 100 pour éviter les limites d'API
for (let i = 0; i < articles.length; i += 100) {
    const chunk = articles.slice(i, i + 100);

    // Vérification des URLs déjà présentes dans la base pour éviter les doublons
    const { data: existingUrlsData, error: existingUrlsError } = await supabase
        .from('ListUrlRss')
        .select('url')
        .in('url', chunk.map(item => item.url));

    if (existingUrlsError) {
        // Affiche une erreur si la vérification échoue
        console.error('❌ Erreur lors de la vérification des doublons :', existingUrlsError.message);
        continue;
    }

    // Filtre les URLs déjà présentes pour ne garder que les nouvelles
    const existingUrls = new Set(existingUrlsData.map(item => item.url));
    const uniqueChunk = chunk.filter(item => !existingUrls.has(item.url));

    if (uniqueChunk.length === 0) {
        // Si tout le lot existe déjà, on passe au suivant
        console.log('⏭️ Tous les URLs de ce lot existent déjà. Aucun à insérer.');
        continue;
    }

    // Insertion des nouvelles URLs dans la table ListUrlRss
    const { error } = await supabase.from('ListUrlRss').insert(uniqueChunk);
    if (error) {
        // Affiche une erreur si l'insertion échoue
        console.error('❌ Erreur à l’insertion :', error.message);
    } else {
        // Confirmation d'insertion
        console.log(`✅ ${uniqueChunk.length} URL(s) insérées`);
    }
}