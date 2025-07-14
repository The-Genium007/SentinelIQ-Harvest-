# 🔐 Sécurisation des Variables d'Environnement

## 📋 Résumé des Changements

### ✅ **Améliorations de Sécurité Appliquées**

1. **Suppression des clés sensibles de la documentation**
   - Variables Supabase retirées de `COOLIFY_CONFIG.md`
   - Documentation générale avec placeholders sécurisés

2. **Structure d'environnement sécurisée**
   - `.env` : Variables générales (NODE_ENV, PORT, etc.)
   - `key.env` : Clés Supabase (protégé par .gitignore)
   - `.env.example` : Template de configuration

3. **Tests locaux sécurisés**
   - `docker-compose.test.yml` utilise `env_file` au lieu de variables en dur
   - Chargement automatique depuis `.env` et `key.env`

4. **Protection Git**
   - `.gitignore` protège tous les fichiers sensibles
   - Seuls les templates et exemples sont committés

## 🚀 **Configuration pour Coolify**

### Variables à configurer dans l'interface Coolify :

```bash
NODE_ENV=production
PORT=3000
HEALTH_PORT=3000
NODE_OPTIONS=--max-old-space-size=2048

# Variables Supabase (récupérer depuis key.env local)
SUPABASE_URL=https://qguahdafmeforgelbyby.supabase.co
SUPABASE_ANON_KEY=<votre_clé_anon>
SUPABASE_KEY=<votre_clé_service_role>
```

## 🧪 **Tests Locaux**

1. **Vérifier la présence des fichiers :**
   ```bash
   ls -la .env key.env
   ```

2. **Tester avec la nouvelle configuration :**
   ```bash
   ./test-local-supabase.sh
   ```

3. **Vérifier les variables dans le container :**
   ```bash
   docker exec sentineliq-harvest-test env | grep SUPABASE
   ```

## ✅ **Validation**

- ✅ Variables sensibles supprimées de la documentation
- ✅ Configuration locale fonctionnelle via fichiers d'environnement
- ✅ Tests locaux validés avec Supabase
- ✅ Prêt pour déploiement Coolify sécurisé

## 📝 **Instructions de Déploiement**

1. Copiez les variables depuis `key.env` vers l'interface Coolify
2. Configurez les variables générales depuis `.env.example`
3. Déployez avec la configuration sécurisée

**🔒 Les clés sensibles ne sont plus jamais exposées dans le code !**
