#!/usr/bin/env node

/**
 * 🔍 Diagnostic de la colonne valid dans ListUrlRss
 */

import { supabaseClient } from './database/client.js';

console.log('🔍 Diagnostic de la colonne valid\n');

async function diagnoseValidColumn() {
    try {
        const client = await supabaseClient.getClient();

        // 1. Test direct avec Supabase
        console.log('📋 1. Test requête directe avec filter valid=true...');
        const { data: validData, error: validError } = await client
            .from('ListUrlRss')
            .select('id, url, valid')
            .eq('valid', true)
            .limit(5);

        if (validError) {
            console.log(`   ❌ Erreur requête valid=true: ${validError.message}`);
        } else {
            console.log(`   ✅ Requête valid=true: ${validData.length} résultats`);
            validData.forEach(feed => {
                console.log(`      ${feed.id}: ${feed.url} (valid: ${feed.valid})`);
            });
        }

        // 2. Test avec valid=false
        console.log('\n📋 2. Test requête directe avec filter valid=false...');
        const { data: invalidData, error: invalidError } = await client
            .from('ListUrlRss')
            .select('id, url, valid')
            .eq('valid', false)
            .limit(5);

        if (invalidError) {
            console.log(`   ❌ Erreur requête valid=false: ${invalidError.message}`);
        } else {
            console.log(`   ✅ Requête valid=false: ${invalidData.length} résultats`);
            invalidData.forEach(feed => {
                console.log(`      ${feed.id}: ${feed.url} (valid: ${feed.valid})`);
            });
        }

        // 3. Test avec valid is null
        console.log('\n📋 3. Test requête directe avec valid IS NULL...');
        const { data: nullData, error: nullError } = await client
            .from('ListUrlRss')
            .select('id, url, valid')
            .is('valid', null)
            .limit(5);

        if (nullError) {
            console.log(`   ❌ Erreur requête valid IS NULL: ${nullError.message}`);
        } else {
            console.log(`   ✅ Requête valid IS NULL: ${nullData.length} résultats`);
            nullData.forEach(feed => {
                console.log(`      ${feed.id}: ${feed.url} (valid: ${feed.valid})`);
            });
        }

        // 4. Compter les différentes valeurs
        console.log('\n📋 4. Statistiques de la colonne valid...');
        const { data: allData, error: allError } = await client
            .from('ListUrlRss')
            .select('valid');

        if (allError) {
            console.log(`   ❌ Erreur récupération toutes les valeurs: ${allError.message}`);
        } else {
            const total = allData.length;
            const trueCount = allData.filter(r => r.valid === true).length;
            const falseCount = allData.filter(r => r.valid === false).length;
            const nullCount = allData.filter(r => r.valid === null || r.valid === undefined).length;

            console.log(`   📊 Total: ${total}`);
            console.log(`   ✅ valid = true: ${trueCount}`);
            console.log(`   ❌ valid = false: ${falseCount}`);
            console.log(`   ❓ valid = null: ${nullCount}`);
        }

        // 5. Test nos URLs problématiques
        console.log('\n📋 5. Test des URLs spécifiques...');
        const testUrls = [
            'https://www.maxkohler.com/feed.xml',
            'https://nickolinger.com/rss.xml'
        ];

        for (const url of testUrls) {
            const { data: urlData, error: urlError } = await client
                .from('ListUrlRss')
                .select('id, url, valid')
                .eq('url', url)
                .single();

            if (urlError) {
                console.log(`   ❌ ${url}: Erreur - ${urlError.message}`);
            } else {
                console.log(`   📊 ${url}: valid = ${urlData.valid}`);
            }
        }

    } catch (error) {
        console.error('❌ Erreur fatale:', error.message);
        return false;
    }
}

diagnoseValidColumn()
    .then(() => {
        console.log('\n✅ Diagnostic terminé');
        process.exit(0);
    })
    .catch(error => {
        console.error('❌ Erreur:', error);
        process.exit(1);
    });
