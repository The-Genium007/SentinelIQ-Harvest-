#!/usr/bin/env node

/**
 * 🔍 Debug du filtrage BaseRepository
 */

import { supabaseClient } from './database/client.js';

console.log('🔍 Debug direct du filtrage\n');

async function debugFiltering() {
    try {
        const client = await supabaseClient.getClient();

        // Test direct simple
        console.log('📋 Test requête directe simple...');
        let query = client.from('ListUrlRss').select('id, url, valid');
        query = query.eq('valid', true);

        const { data, error } = await query;

        if (error) {
            console.log(`❌ Erreur: ${error.message}`);
        } else {
            console.log(`✅ Résultats avec valid=true: ${data.length}`);
        }

        // Test avec false
        console.log('\n📋 Test avec valid=false...');
        let query2 = client.from('ListUrlRss').select('id, url, valid');
        query2 = query2.eq('valid', false);

        const { data: data2, error: error2 } = await query2;

        if (error2) {
            console.log(`❌ Erreur: ${error2.message}`);
        } else {
            console.log(`✅ Résultats avec valid=false: ${data2.length}`);
            data2.forEach(item => {
                console.log(`   ${item.id}: ${item.url} (valid: ${item.valid})`);
            });
        }

        // Test without filter
        console.log('\n📋 Test sans filtre...');
        let query3 = client.from('ListUrlRss').select('valid');

        const { data: data3, error: error3 } = await query3;

        if (error3) {
            console.log(`❌ Erreur: ${error3.message}`);
        } else {
            const trueCount = data3.filter(r => r.valid === true).length;
            const falseCount = data3.filter(r => r.valid === false).length;
            const nullCount = data3.filter(r => r.valid === null).length;

            console.log(`✅ Total: ${data3.length}`);
            console.log(`   true: ${trueCount}`);
            console.log(`   false: ${falseCount}`);
            console.log(`   null: ${nullCount}`);
        }

    } catch (error) {
        console.error('❌ Erreur fatale:', error.message);
    }
}

debugFiltering()
    .then(() => process.exit(0))
    .catch(error => {
        console.error('❌ Erreur:', error);
        process.exit(1);
    });
