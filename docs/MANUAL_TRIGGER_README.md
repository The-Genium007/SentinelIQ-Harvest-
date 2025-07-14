# 🚀 Système de Déclenchement Manuel WireScanner

## Vue d'ensemble

Le système WireScanner dispose maintenant de **deux modes de fonctionnement** :

1. **🕐 Automatique** : Cron quotidien à 3h00 (Europe/Paris)
2. **🎯 Manuel** : Déclenchement à la demande via commandes

## 🔧 Fonctionnement

### Cron Principal

- **Planification** : Tous les jours à 03:00 Europe/Paris
- **Action** : Lance WireScanner + Cortex automatiquement

### Cron de Vérification Manuel

- **Fréquence** : Toutes les 30 secondes
- **Action** : Vérifie s'il y a une commande manuelle en attente
- **Fichier surveillé** : `command_trigger.txt`

## 📝 Commandes Disponibles

### 1. Script Node.js (Complet)

```bash
# Déclencher un scrapping manuel
node manual-trigger.js start

# Vérifier le statut
node manual-trigger.js status

# Aide
node manual-trigger.js help
```

### 2. Script Shell (Rapide)

```bash
# Déclenchement simple
./trigger-scrapping.sh
```

### 3. Commande Direct

```bash
# Créer manuellement le fichier de commande
echo "START_SCRAPPING_NOW" > command_trigger.txt
```

### 4. Diagnostic

```bash
# Vérifier l'état du système
node check-status.js
```

## 🔄 Mécanisme de Fonctionnement

1. **Commande manuelle** créée (fichier `command_trigger.txt`)
2. **Cron de vérification** détecte le fichier (max 30s)
3. **Exécution immédiate** du scrapping
4. **Suppression automatique** du fichier de commande
5. **Logs** de l'exécution dans les fichiers habituels

## 📊 Statut et Monitoring

### Vérification d'état

```bash
# Statut complet
node manual-trigger.js status

# Diagnostic simple
node check-status.js

# Logs en temps réel
tail -f logs/system.log
```

### Informations affichées

- État d'exécution (en cours / arrêté)
- Dernière exécution
- Prochaine exécution programmée
- Commandes en attente

## 🛡️ Protection et Sécurité

### Anti-chevauchement

- **Une seule tâche** à la fois (automatique + manuelle)
- **Timeout** de 30 minutes par tâche
- **Réinitialisation automatique** en cas de blocage

### Gestion d'erreurs

- **3 tentatives** automatiques en cas d'échec
- **Logs détaillés** de toutes les opérations
- **État propre** après chaque exécution

## 🔧 Fonctions de Contrôle

### Dans le code JavaScript

```javascript
import {
  runScrappingNow, // Exécution immédiate synchrone
  scheduleManualRun, // Programmation via fichier de commande
  getStatus, // État actuel du système
  forceReset, // Réinitialisation forcée
  stopTask, // Arrêt des crons
  startTask, // Redémarrage des crons
} from "./WireScanner/start.js";

// Exemple d'utilisation
const status = getStatus();
console.log(status);

// Programmation d'une exécution
const result = scheduleManualRun();
console.log(result.message);
```

## 📁 Fichiers Créés

| Fichier                | Description                                    |
| ---------------------- | ---------------------------------------------- |
| `command_trigger.txt`  | Fichier de commande temporaire (auto-supprimé) |
| `manual-trigger.js`    | Utilitaire principal de commande               |
| `trigger-scrapping.sh` | Script shell rapide                            |
| `check-status.js`      | Diagnostic système                             |

## 🚨 Cas d'Usage

### Déclenchement d'urgence

```bash
./trigger-scrapping.sh
# ou
node manual-trigger.js start
```

### Vérification avant maintenance

```bash
node check-status.js
node manual-trigger.js status
```

### Test de fonctionnement

```bash
# Déclencher et surveiller
node manual-trigger.js start
tail -f logs/system.log
```

## ⚙️ Configuration

### Variables importantes

- **Timeout tâche** : 30 minutes
- **Vérification manuelle** : 30 secondes
- **Tentatives max** : 3 retries
- **Timezone** : Europe/Paris

### Logs de référence

- `logs/system.log` : Logs principaux
- `logs/scraping.log` : Détails scrapping
- `logs/error.log` : Erreurs système

---

💡 **Note** : Le système garantit qu'une seule instance de scrapping s'exécute à la fois, que ce soit via le cron automatique ou le déclenchement manuel.
