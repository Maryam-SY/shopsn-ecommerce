# Stratégie de sécurité — ShopSN

## 1. Principe général : shift-left security

La sécurité est intégrée dès le pipeline CI/CD plutôt que vérifiée uniquement après déploiement. Chaque scan bloque la progression du pipeline s'il détecte un problème critique — le code non conforme n'atteint jamais la production.

```
Code source → Lint (qualité) → npm audit (deps) → Gitleaks (secrets) → Build Docker → Trivy (image) → Déploiement
```

## 2. Qualité de code — ESLint

**Outil** : `@angular-eslint/schematics`
**Déclenchement** : job `lint` du pipeline, à chaque push et pull request.

**Pourquoi** : le code de mauvaise qualité (injection par constructeur au lieu de `inject()`, variables non typées, patterns dépréciés) est une porte d'entrée indirecte pour des bugs de sécurité. ESLint impose les règles recommandées par l'équipe Angular elle-même (`prefer-inject`, etc.).

**Commande locale** :
```bash
ng lint
```

## 3. Audit des dépendances — npm audit

**Outil** : `npm audit` (intégré à npm, aucune installation supplémentaire)
**Déclenchement** : job `security-deps` du pipeline.
**Seuil configuré** : `--audit-level=high` — le pipeline échoue si une vulnérabilité de niveau HIGH ou CRITICAL est détectée dans les dépendances (directes ou transitives).

**Pourquoi** : une application e-commerce dépend de centaines de packages tiers (494 packages dans ce projet). Chacun est une surface d'attaque potentielle. `npm audit` compare les versions installées à la base de données de vulnérabilités connues (npm advisory database).

**Commande locale** :
```bash
npm audit --audit-level=high
```

**Limite assumée** : `npm audit` ne détecte que les vulnérabilités déjà répertoriées publiquement — il ne remplace pas une revue de code ni un test d'intrusion.

## 4. Détection de secrets — Gitleaks

**Outil** : `gitleaks/gitleaks-action@v2`
**Déclenchement** : job `security-secrets` du pipeline, scanne l'historique complet du dépôt (`fetch-depth: 0`).

**Pourquoi** : la fuite de secrets (clés API, tokens, mots de passe) committés par erreur est l'une des causes les plus fréquentes de compromission en entreprise. Gitleaks scanne chaque commit à la recherche de motifs correspondant à des clés/tokens connus (AWS, GitHub, JWT, etc.).

**Mesure complémentaire** : le `.gitignore` du projet exclut explicitement `.env`, `.env.*`, `*.pem`, `*.key`, `secrets/` pour empêcher qu'un secret soit committé en premier lieu — Gitleaks agit en filet de sécurité si cette première barrière est contournée.

**Constat pour ce projet** : ShopSN ne manipule aujourd'hui aucun secret (l'API Fake Store API est publique, sans authentification par clé). Le job est néanmoins conservé et actif pour anticiper une évolution du projet (ex. connexion à une vraie base de données, clé API tierce) sans devoir modifier le pipeline plus tard.

## 5. Scan de vulnérabilités de l'image Docker — Trivy

**Outil** : `aquasecurity/trivy-action`
**Déclenchement** : job `security-image`, après la publication de l'image sur GHCR.
**Seuil configuré** : `severity: CRITICAL,HIGH` avec `exit-code: 1` — le job échoue si une vulnérabilité CRITICAL ou HIGH est trouvée dans l'image finale (couches système Alpine, Nginx, dépendances).

**Pourquoi scanner l'image et non juste le code source** : une image Docker embarque un système d'exploitation minimal (Alpine Linux) et des binaires (Nginx). Ces couches peuvent contenir des vulnérabilités indépendantes du code applicatif. `npm audit` ne les détecte pas — Trivy comble cette lacune.

**Choix de conception réduisant la surface d'attaque** :
- Build multi-stage : le stage final ne contient **ni Node.js, ni `node_modules`, ni le code source** — uniquement les fichiers statiques compilés et Nginx.
- Images de base `-alpine` : distributions minimalistes, moins de paquets installés = moins de vulnérabilités potentielles.

## 6. En-têtes de sécurité HTTP (Nginx)

Configurés dans `nginx.conf`, appliqués à chaque réponse du serveur :

| En-tête | Rôle |
|---|---|
| `X-Content-Type-Options: nosniff` | Empêche le navigateur de deviner le type MIME d'un fichier, réduisant les risques d'exécution de scripts malveillants déguisés |
| `X-Frame-Options: SAMEORIGIN` | Empêche que le site soit intégré dans une `<iframe>` sur un autre domaine (protection contre le clickjacking) |
| `Referrer-Policy: strict-origin-when-cross-origin` | Limite les informations envoyées dans l'en-tête `Referer` lors de la navigation vers un autre site |

## 7. Gestion des secrets en environnement de production

- Aucun secret n'est actuellement nécessaire (API publique sans clé).
- Le pipeline utilise `secrets.GITHUB_TOKEN`, un jeton **généré automatiquement et à durée de vie limitée** par GitHub Actions à chaque exécution — jamais stocké en clair, jamais partagé.
- Si le projet évoluait vers une vraie base de données ou une API tierce nécessitant une clé, la pratique recommandée serait de stocker ces valeurs dans **GitHub Secrets** (Settings → Secrets and variables → Actions) et de les injecter comme variables d'environnement au runtime du conteneur, jamais en dur dans le code ou l'image Docker.

## 8. Authentification applicative

- Le token JWT retourné par `/auth/login` est stocké dans le `localStorage` du navigateur.
- Un intercepteur HTTP (`auth-interceptor.ts`) attache automatiquement le token à chaque requête sortante via l'en-tête `Authorization: Bearer <token>`.
- Un guard de route (`auth-guard.ts`) empêche l'accès à `/cart` sans authentification valide, avec redirection automatique vers `/login`.

**Limite assumée** (à mentionner en conclusion du rapport) : le stockage en `localStorage` expose le token à un risque XSS si une faille d'injection de script existait ailleurs dans l'application. Une amélioration future consisterait à migrer vers un cookie `httpOnly` + `secure`, généré côté serveur — non implémenté ici car Fake Store API (API de démonstration) ne le permet pas côté backend.

## 9. Récapitulatif des gates de sécurité du pipeline

| Gate | Outil | Bloquant ? | Job |
|---|---|---|---|
| Qualité de code | ESLint | ✅ Oui | `lint` |
| Dépendances vulnérables | npm audit | ✅ Oui (HIGH+) | `security-deps` |
| Secrets committés | Gitleaks | ✅ Oui | `security-secrets` |
| Vulnérabilités image Docker | Trivy | ✅ Oui (HIGH+) | `security-image` |