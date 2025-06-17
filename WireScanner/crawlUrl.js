import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '../key.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

import Parser from 'rss-parser';

const parser = new Parser();


export async function crawlUrl() {
    // Récupération des URLs de flux RSS depuis la table ListUrlRss de Supabase
    const { data: feeds, error } = await supabase.from('ListUrlRss').select('url');
    if (error) {
        throw new Error(`Erreur lors de la récupération des flux depuis Supabase : ${error.message}`);
    }
    const sources = feeds.map(f => ({ url: f.url }));

    // Test de connexion à Supabase avant toute opération
    const { error: testError } = await supabase.from('ListUrlRss').select('id').limit(1);
    if (testError) {
        throw new Error(`Test de connexion Supabase échoué : ${testError.message}`);
    }

    // Parcours de chaque source RSS récupérée depuis la base
    for (const source of sources) {
        // Vérification de la validité de l'URL
        if (!/^https?:\/\/[^ "]+$/.test(source.url)) {
            console.warn(`⚠️ URL invalide ignorée : ${source.url}`);
            continue;
        }

        console.log(`📥 Lecture de ${source.url}`);
        try {
            // Parsing du flux RSS
            const feed = await parser.parseURL(source.url);
            // Parcours de chaque article du flux
            for (const item of feed.items) {
                const articleUrl = item.link;
                // Vérifie que l'URL de l'article est valide
                if (articleUrl && /^https?:\/\/[^ "]+$/.test(articleUrl)) {
                    // Vérifie si l’URL existe déjà dans Supabase
                    const { data: existing, error: checkError } = await supabase
                        .from('articlesUrl')
                        .select('url')
                        .eq('url', articleUrl)
                        .maybeSingle();

                    if (checkError) {
                        // Affiche une erreur si la vérification échoue
                        console.error(`❌ Erreur lors de la vérification de l'URL : ${articleUrl}`, checkError.message);
                        continue;
                    }

                    if (!existing) {
                        // Si l'article n'existe pas, on l'insère dans la table articlesUrl
                        const { error: insertError } = await supabase
                            .from('articlesUrl')
                            .insert({ url: articleUrl });

                        if (insertError) {
                            // Affiche une erreur si l'insertion échoue
                            console.error(`❌ Erreur lors de l’insertion de l’article : ${articleUrl}`, insertError.message);
                        } else {
                            // Confirmation d'insertion
                            console.log(`✅ Article inséré : ${articleUrl}`);
                        }
                    } else {
                        // L'article existe déjà dans la base
                        console.log(`🔁 Article déjà présent : ${articleUrl}`);
                    }
                }
            }
        } catch (err) {
            // Affiche un avertissement si le parsing du flux échoue
            console.warn(`❌ Erreur lors du traitement du flux : ${source.url}`, err.message);
        }
    }
}