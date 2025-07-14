#!/usr/bin/env node
/**
 * 🔍 Diagnostic complet des deux tables: articlesUrl ET articles
 */

import { supabaseClient } from './database/client.js';

async function checkBothTables() {
    console.log('🔍 Diagnostic complet des tables articlesUrl ET articles...\n');

    try {
        const client = await supabaseClient.getClient();

        // Schéma pour articlesUrl
        const articlesUrlColumns = [
            'url', 'title', 'description', 'author', 'source',
            'publishDate', 'extractedAt', 'categories'
        ];

        // Schéma pour articles (table des articles traités)
        const articlesColumns = [
            'url', 'title', 'content', 'summary', 'author', 'source',
            'publishDate', 'extractedAt', 'processedAt'
        ];

        // Fonction pour tester une table
        async function checkTable(tableName, requiredColumns) {
            console.log(`📋 Table "${tableName}":`);

            const missingColumns = [];
            const existingColumns = [];

            for (const column of requiredColumns) {
                try {
                    const { data, error } = await client
                        .from(tableName)
                        .select(column)
                        .limit(1);

                    if (error && error.message.includes('does not exist')) {
                        missingColumns.push(column);
                        console.log(`   ❌ ${column.padEnd(15)} - MANQUANTE`);
                    } else {
                        existingColumns.push(column);
                        console.log(`   ✅ ${column.padEnd(15)} - PRÉSENTE`);
                    }
                } catch (err) {
                    missingColumns.push(column);
                    console.log(`   ❌ ${column.padEnd(15)} - ERREUR`);
                }
            }

            // Vérifier les colonnes actuelles
            try {
                const { data, error } = await client
                    .from(tableName)
                    .select('*')
                    .limit(1);

                if (data && data.length > 0) {
                    const currentColumns = Object.keys(data[0]);
                    console.log(`   📊 Colonnes actuelles: ${currentColumns.join(', ')}`);
                } else if (!error) {
                    console.log(`   📊 Table vide`);
                } else {
                    console.log(`   📊 Erreur de lecture: ${error.message}`);
                }
            } catch (err) {
                console.log(`   📊 Impossible de lire la structure`);
            }

            return { missingColumns, existingColumns };
        }

        // Test articlesUrl
        console.log('1️⃣ TABLE ARTICLES URL (URLs collectées):');
        const urlResults = await checkTable('articlesUrl', articlesUrlColumns);

        console.log('\n2️⃣ TABLE ARTICLES (Articles traités):');
        const articleResults = await checkTable('articles', articlesColumns);

        // Génération du SQL de correction
        console.log('\n🔧 REQUÊTES SQL À EXÉCUTER DANS SUPABASE:');
        console.log('='.repeat(70));

        let totalMissing = 0;

        // SQL pour articlesUrl
        if (urlResults.missingColumns.length > 0) {
            console.log('\n-- Corrections pour la table articlesUrl:');
            for (const column of urlResults.missingColumns) {
                let columnType = 'TEXT';
                let defaultValue = '';

                if (column === 'publishDate' || column === 'extractedAt') {
                    columnType = 'TIMESTAMPTZ';
                    defaultValue = ' DEFAULT NOW()';
                } else if (column === 'categories') {
                    columnType = 'JSON';
                    defaultValue = ' DEFAULT \'[]\'::json';
                }

                console.log(`ALTER TABLE articlesUrl ADD COLUMN ${column} ${columnType}${defaultValue};`);
                totalMissing++;
            }
        }

        // SQL pour articles
        if (articleResults.missingColumns.length > 0) {
            console.log('\n-- Corrections pour la table articles:');
            for (const column of articleResults.missingColumns) {
                let columnType = 'TEXT';
                let defaultValue = '';

                if (column === 'publishDate' || column === 'extractedAt' || column === 'processedAt') {
                    columnType = 'TIMESTAMPTZ';
                    defaultValue = ' DEFAULT NOW()';
                } else if (column === 'content' || column === 'summary') {
                    columnType = 'TEXT';
                }

                console.log(`ALTER TABLE articles ADD COLUMN ${column} ${columnType}${defaultValue};`);
                totalMissing++;
            }
        }

        console.log('='.repeat(70));

        if (totalMissing === 0) {
            console.log('\n🎉 TOUTES LES TABLES SONT CORRECTES!');
            console.log('   ✅ articlesUrl: schéma complet');
            console.log('   ✅ articles: schéma complet');
            console.log('\n🚀 Vous pouvez maintenant traiter les articles!');
        } else {
            console.log(`\n📝 ${totalMissing} colonne(s) à ajouter au total`);
            console.log(`   ❌ articlesUrl: ${urlResults.missingColumns.length} manquantes`);
            console.log(`   ❌ articles: ${articleResults.missingColumns.length} manquantes`);

            console.log('\n🚀 PROCHAINES ÉTAPES:');
            console.log('   1. Copiez TOUTES les requêtes SQL ci-dessus');
            console.log('   2. Allez dans Supabase SQL Editor');
            console.log('   3. Exécutez TOUTES les requêtes');
            console.log('   4. Relancez: node test-article-processing.js');
        }

    } catch (error) {
        console.error(`❌ Erreur fatale: ${error.message}`);
    }
}

checkBothTables();
