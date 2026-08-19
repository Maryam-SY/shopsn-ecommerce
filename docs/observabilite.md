# Stratégie d'observabilité — ShopSN

## 1. Principe

L'observabilité répond à la question : *"si quelque chose casse en production, comment le sait-on, et comment comprend-on pourquoi ?"* Elle repose classiquement sur trois piliers : **logs**, **métriques**, **traces**. Pour une application frontend statique de la taille de ShopSN, l'effort est concentré sur les logs et les métriques d'infrastructure ; le tracing distribué n'est pas pertinent (pas de backend applicatif propre, l'app consomme une API tierce déjà hors de notre contrôle).

## 2. Logs — niveau infrastructure (implémenté)

**Source** : logs d'accès Nginx, exposés nativement par le conteneur Docker.

**Accès en local** :
```bash
docker compose logs -f frontend
```

Chaque ligne suit le format Nginx standard : IP source, timestamp, méthode HTTP, chemin, code de statut, user-agent. Exemple observé lors des tests :
```
172.18.0.1 - - [19/Aug/2026:13:48:26 +0000] "GET /catalog HTTP/1.1" 200 439 ...
```

**Pourquoi c'est déjà exploitable** : ces logs permettent de détecter des pics d'erreurs 4xx/5xx, des chemins inexistants sondés (tentatives d'intrusion), ou une chute soudaine de trafic.

**Limite assumée** : logs non centralisés, non persistés au-delà du cycle de vie du conteneur (`docker compose down` = logs perdus). Acceptable pour une démo locale, insuffisant pour une vraie production.

## 3. Healthcheck — surveillance de disponibilité (implémenté)

Configuré à deux niveaux redondants :

**Dans le `Dockerfile`** :
```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:80/ || exit 1
```

**Dans `docker-compose.yml`** (même logique, exposée à l'orchestrateur) :
```yaml
healthcheck:
  test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:80/"]
  interval: 30s
  timeout: 3s
  retries: 3
```

**Pourquoi** : Docker (et tout orchestrateur type Kubernetes en évolution future) peut détecter automatiquement qu'un conteneur "tourne" mais ne répond plus (deadlock, crash silencieux de Nginx) et le redémarrer — c'est la première ligne de défense pour la disponibilité, avant même qu'une alerte humaine soit nécessaire.

**Vérification** :
```bash
docker inspect --format='{{.State.Health.Status}}' shopsn-frontend
```

## 4. Métriques — proposition d'implémentation (non implémenté, justifié)

Pour aller au-delà du healthcheck binaire (up/down), la stack **Prometheus + Grafana** est la proposition retenue :

- **Prometheus** collecterait les métriques d'exposition Nginx via le module `nginx-prometheus-exporter` (nombre de requêtes/seconde, latence, taux d'erreur par code HTTP).
- **Grafana** afficherait ces métriques sous forme de tableaux de bord (dashboards) : trafic en temps réel, taux d'erreur, temps de réponse moyen.

**Schéma d'intégration proposé** :
```
Nginx (conteneur) → nginx-prometheus-exporter → Prometheus (scrape toutes les 15s) → Grafana (dashboards + alerting)
```

**Pourquoi ce n'est pas implémenté dans la démo actuelle** : la stack Prometheus/Grafana ajoute 2 conteneurs supplémentaires et une complexité de configuration (retention des métriques, dashboards à designer) disproportionnée par rapport à la portée du projet d'examen. Elle est documentée ici comme trajectoire réaliste d'évolution — voir section conclusion du rapport technique.

## 5. Alerting — proposition

Une fois Prometheus en place, des règles d'alerte simples suffiraient à couvrir les scénarios critiques :

| Condition | Seuil proposé | Action |
|---|---|---|
| Taux d'erreur 5xx | > 5% sur 5 min | Alerte Slack/email |
| Conteneur down | Healthcheck failed 3x consécutives | Redémarrage auto + alerte |
| Latence p95 | > 1s sur 5 min | Alerte (dégradation performance) |

## 6. Observabilité côté CI/CD

Le pipeline lui-même est observable via l'onglet **Actions** de GitHub :
- Historique complet de chaque exécution (succès/échec par job)
- Logs détaillés de chaque étape, consultables a posteriori
- Artefacts conservés 7 jours (`dist/` du build) pour investigation en cas de problème

## 7. Récapitulatif

| Pilier | Statut | Outil |
|---|---|---|
| Logs applicatifs | ✅ Implémenté | Logs Docker/Nginx |
| Healthcheck | ✅ Implémenté | Docker HEALTHCHECK |
| Métriques | 📋 Documenté, non implémenté | Prometheus + Grafana (proposé) |
| Alerting | 📋 Documenté, non implémenté | Règles Prometheus (proposées) |
| Observabilité pipeline | ✅ Implémenté | GitHub Actions (natif) |