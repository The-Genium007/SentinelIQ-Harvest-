#!/usr/bin/env node
/**
 * 🔧 Script de correction du schéma de base de données
 * Ajoute les colonnes manquantes dans la table articlesUrl
 */

import { logManager } from './utils/logManager.js';
import { supabaseClient } from './database/client.js';

class DatabaseSchemaFixer {
    constructor() {
        this.client = null;
    }

    async initialize() {
        if (!this.client) {
            this.client = await supabaseClient.getClient();
        }
        return this.client;
    }

    async checkCurrentSchema() {
        logManager.info('🔍 Vérification du schéma actuel', 'SchemaFixer');

        try {
            await this.initialize();

            // Teste une requête simple pour voir la structure
            const { data, error } = await this.client
                .from('articlesUrl')
                .select('*')
                .limit(1);

            if (error) {
                logManager.error(`Erreur lors de la vérification: ${error.message}`, 'SchemaFixer');
                return null;
            }

            if (data && data.length > 0) {
                const columns = Object.keys(data[0]);
                logManager.info(`Colonnes actuelles: ${columns.join(', ')}`, 'SchemaFixer');
                return columns;
            } else {
                logManager.info('Table vide, impossible de détecter les colonnes', 'SchemaFixer');
                return [];
            }
        } catch (error) {
            logManager.error(`Erreur système: ${error.message}`, 'SchemaFixer');
            return null;
        }
    }

    async testColumnExists(tableName, columnName) {
        try {
            await this.initialize();

            // Teste si une colonne existe en essayant de la sélectionner
            const { data, error } = await this.client
                .from(tableName)
                .select(columnName)
                .limit(1);

            if (error && error.message.includes('does not exist')) {
                return false;
            }
            return true;
        } catch (error) {
            return false;
        }
    }

    async fixSchema() {
        logManager.info('🔧 Correction du schéma de base de données', 'SchemaFixer');

        const requiredColumns = ['author', 'source'];
        const missingColumns = [];

        // Vérifie chaque colonne requise
        for (const column of requiredColumns) {
            const exists = await this.testColumnExists('articlesUrl', column);
            if (!exists) {
                missingColumns.push(column);
                logManager.warn(`❌ Colonne manquante: ${column}`, 'SchemaFixer');
            } else {
                logManager.info(`✅ Colonne existante: ${column}`, 'SchemaFixer');
            }
        }

        if (missingColumns.length === 0) {
            logManager.success('✅ Schéma correct, aucune correction nécessaire', 'SchemaFixer');
            return true;
        }

        logManager.info(`📝 Instructions SQL pour corriger le schéma:`, 'SchemaFixer');
        console.log('\n=== REQUÊTES SQL À EXÉCUTER DANS SUPABASE ===\n');

        for (const column of missingColumns) {
            const sql = `ALTER TABLE articlesUrl ADD COLUMN ${column} TEXT;`;
            console.log(sql);
        }

        console.log('\n=== FIN DES REQUÊTES SQL ===\n');

        logManager.info(`Vous devez exécuter ces requêtes dans votre interface Supabase SQL Editor`, 'SchemaFixer');
        logManager.info(`Une fois fait, relancez ce script pour vérifier`, 'SchemaFixer');

        return false;
    } async createTestInsert() {
        logManager.info('🧪 Test d\'insertion avec le nouveau schéma', 'SchemaFixer');

        try {
            await this.initialize();

            const testData = {
                url: `https://test-schema-fix-${Date.now()}.com`,
                title: 'Test Schema Fix',
                description: 'Article de test pour vérifier le schéma',
                author: 'Test Author',
                source: 'Test Source',
                publishDate: new Date().toISOString(),
                extractedAt: new Date().toISOString()
            };

            const { data, error } = await this.client
                .from('articlesUrl')
                .insert(testData)
                .select();

            if (error) {
                logManager.error(`❌ Erreur d'insertion: ${error.message}`, 'SchemaFixer');
                return false;
            }

            logManager.success(`✅ Test d'insertion réussi`, 'SchemaFixer');

            // Nettoie l'enregistrement de test
            if (data && data[0]) {
                await this.client
                    .from('articlesUrl')
                    .delete()
                    .eq('id', data[0].id);
                logManager.info('🧹 Enregistrement de test supprimé', 'SchemaFixer');
            }

            return true;
        } catch (error) {
            logManager.error(`❌ Erreur lors du test: ${error.message}`, 'SchemaFixer');
            return false;
        }
    }

    async run() {
        logManager.info('🚀 Démarrage de la correction du schéma', 'SchemaFixer');

        try {
            // Vérifie le schéma actuel
            const currentColumns = await this.checkCurrentSchema();

            // Corrige le schéma si nécessaire
            const schemaFixed = await this.fixSchema();

            if (schemaFixed) {
                // Teste l'insertion si le schéma est correct
                await this.createTestInsert();
                logManager.success('🎉 Schéma vérifié et fonctionnel', 'SchemaFixer');
            } else {
                logManager.warn('⚠️ Schéma nécessite des corrections manuelles', 'SchemaFixer');
            }

        } catch (error) {
            logManager.error(`💥 Erreur fatale: ${error.message}`, 'SchemaFixer');
            throw error;
        }
    }
}

// Exécution du script
if (import.meta.url === `file://${process.argv[1]}`) {
    const fixer = new DatabaseSchemaFixer();
    fixer.run()
        .then(() => {
            logManager.info('✅ Script terminé', 'SchemaFixer');
            process.exit(0);
        })
        .catch((error) => {
            logManager.error(`❌ Script échoué: ${error.message}`, 'SchemaFixer');
            process.exit(1);
        });
}

export { DatabaseSchemaFixer };
