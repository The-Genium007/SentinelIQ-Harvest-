#!/usr/bin/env node
/**
 * 🔧 Test direct des colonnes manquantes
 */

import { supabaseClient } from './database/client.js';

async function testColumns() {
    console.log('🔍 Test des colonnes dans articlesUrl...\n');

    try {
        const client = await supabaseClient.getClient();

        // Test pour la colonne author
        console.log('1. Test colonne "author":');
        try {
            const { data, error } = await client
                .from('articlesUrl')
                .select('author')
                .limit(1);

            if (error && error.message.includes('does not exist')) {
                console.log('   ❌ Colonne "author" manquante');
            } else {
                console.log('   ✅ Colonne "author" présente');
            }
        } catch (err) {
            console.log(`   ❌ Erreur: ${err.message}`);
        }

        // Test pour la colonne source
        console.log('\n2. Test colonne "source":');
        try {
            const { data, error } = await client
                .from('articlesUrl')
                .select('source')
                .limit(1);

            if (error && error.message.includes('does not exist')) {
                console.log('   ❌ Colonne "source" manquante');
            } else {
                console.log('   ✅ Colonne "source" présente');
            }
        } catch (err) {
            console.log(`   ❌ Erreur: ${err.message}`);
        }

        // Test insertion complète
        console.log('\n3. Test insertion complète:');
        try {
            const testData = {
                url: `https://test-${Date.now()}.com`,
                title: 'Test Article',
                description: 'Description test',
                author: 'Test Author',
                source: 'Test Source',
                publishDate: new Date().toISOString(),
                extractedAt: new Date().toISOString()
            };

            const { data, error } = await client
                .from('articlesUrl')
                .insert(testData)
                .select();

            if (error) {
                console.log(`   ❌ Erreur d'insertion: ${error.message}`);
                if (error.message.includes('author')) {
                    console.log('   → Colonne "author" manquante dans le schéma');
                }
                if (error.message.includes('source')) {
                    console.log('   → Colonne "source" manquante dans le schéma');
                }
            } else {
                console.log('   ✅ Insertion réussie');
                // Nettoie l'enregistrement de test
                if (data && data[0]) {
                    await client
                        .from('articlesUrl')
                        .delete()
                        .eq('id', data[0].id);
                    console.log('   🧹 Enregistrement de test supprimé');
                }
            }
        } catch (err) {
            console.log(`   ❌ Erreur: ${err.message}`);
        }

        console.log('\n🔧 Si des colonnes sont manquantes, exécutez dans Supabase SQL Editor:');
        console.log('ALTER TABLE articlesUrl ADD COLUMN author TEXT;');
        console.log('ALTER TABLE articlesUrl ADD COLUMN source TEXT;');

    } catch (error) {
        console.error(`❌ Erreur fatale: ${error.message}`);
    }
}

testColumns();
