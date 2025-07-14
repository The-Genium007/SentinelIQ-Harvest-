# Poli| Version | Supportée          | Statut                                            |
|---------|-------------------|---------------------------------------------------|
| 2.5.x   | :white_check_mark: | Version actuelle (Pipeline optimisé + automatisation intelligente) |
| 2.0.x   | :white_check_mark: | Version stable (Cortex + WireScanner optimisés) |ue de Sécurité

## Versions Supportées

Ce tableau indique les versions de SentinelIQ Harvest qui bénéficient actuellement des mises à jour de sécurité.

| Version | Supportée          | Statut                                            |
| ------- | ------------------ | ------------------------------------------------- |
| 2.0.x   | :white_check_mark: | Version actuelle (Cortex + WireScanner optimisés) |
| 1.x.x   | :x:                | Non supportée - Migration recommandée             |
| < 1.0   | :x:                | Versions développement - Non supportées           |

## Signalement de Vulnérabilités

### 🔒 Comment signaler une vulnérabilité

Si vous découvrez une vulnérabilité de sécurité dans SentinelIQ Harvest, nous vous encourageons à nous la signaler de manière responsable.

#### Canaux de signalement

1. **Email sécurisé** : [Remplacer par votre email de sécurité]
2. **Issues GitHub privées** : Utilisez les "Security Advisories" sur notre repository
3. **Contact direct** : Pour les vulnérabilités critiques uniquement

#### Informations à inclure

Veuillez inclure autant d'informations que possible :

- **Description détaillée** de la vulnérabilité
- **Version affectée** de SentinelIQ Harvest
- **Étapes de reproduction** avec un exemple concret
- **Impact potentiel** et gravité estimée
- **Suggestions de correction** si vous en avez

#### Processus de traitement

| Délai        | Action                                                |
| ------------ | ----------------------------------------------------- |
| **24h**      | Accusé de réception de votre signalement              |
| **72h**      | Évaluation initiale et classification de la gravité   |
| **7 jours**  | Première mise à jour sur le statut de l'investigation |
| **30 jours** | Résolution ou plan de correction détaillé             |

#### Niveaux de gravité

- **🔴 Critique** : Exécution de code à distance, accès admin non autorisé
- **🟠 Élevée** : Escalade de privilèges, accès aux données sensibles
- **🟡 Moyenne** : Injection, XSS, déni de service
- **🟢 Faible** : Divulgation d'informations mineures

## Mesures de Sécurité Implémentées

### 🛡️ Protection des données

- **Chiffrement** : Toutes les communications avec la base de données sont chiffrées (TLS)
- **Variables d'environnement** : Stockage sécurisé des clés API et tokens
- **Logs sécurisés** : Aucune donnée sensible dans les fichiers de logs

### 🔐 Authentification et accès

- **Supabase RLS** : Row Level Security activé sur toutes les tables
- **Tokens JWT** : Authentification basée sur des tokens sécurisés
- **Principe du moindre privilège** : Accès minimal requis pour chaque composant

### 🚧 Protection infrastructure

- **Container sécurisé** : Utilisateur non-root dans Docker
- **Healthcheck** : Monitoring proactif de l'état du système
- **Isolation réseau** : Séparation des services par domaines

### 📊 Monitoring et détection

- **Logs structurés** : Traçabilité complète des opérations
- **Alertes automatiques** : Détection d'anomalies dans les logs
- **Sauvegarde** : Système de backup automatisé des données critiques

## Bonnes Pratiques pour les Utilisateurs

### 🔧 Configuration sécurisée

```bash
# Variables d'environnement obligatoires
SUPABASE_URL=your_secure_url
SUPABASE_ANON_KEY=your_anon_key
NODE_ENV=production

# Ne jamais exposer en clair
DATABASE_URL=postgresql://...
API_KEYS=...
```

### 🐳 Déploiement Docker

- Utilisez toujours des images officielles
- Mettez à jour régulièrement les dépendances
- Activez les healthchecks
- Limitez l'exposition des ports

### 📝 Gestion des logs

- Archivage automatique des logs anciens
- Pas de données sensibles dans les logs
- Rotation des fichiers de logs

## Mise à Jour de Sécurité

Les mises à jour de sécurité sont publiées selon la gravité :

- **Critique/Élevée** : Patch immédiat (< 24h)
- **Moyenne** : Mise à jour dans la semaine
- **Faible** : Incluse dans la prochaine version mineure

## Contact

Pour toute question relative à la sécurité :

- **Email** : [Remplacer par votre email]
- **GitHub** : Issues ou Security Advisories
- **Documentation** : Consultez le fichier `DOCKER_DEPLOY.md` pour les aspects sécurité du déploiement

---

_Dernière mise à jour : 13 juillet 2025_
_Version du document : 2.5_
