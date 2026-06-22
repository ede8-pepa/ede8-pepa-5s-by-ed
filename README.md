# 5S by ED

Application Next.js de pilotage terrain des audits 5S.

Modules bêta validés :
- Dashboard
- Nouvel audit
- Historique et détail audit
- Actions correctives
- Standards 5S
- Responsive mobile

## Développement Local

URL locale standard :

```bash
http://127.0.0.1:3010
```

Démarrer l'application :

```bash
npm run dev
```

Le port `3010` est réservé à 5S by ED pour éviter les conflits avec les autres projets locaux.

## Build Production

Commande attendue pour Vercel :

```bash
npm run build
```

Le script `build` utilise le comportement standard Next.js :

```bash
next build
```

Les variables `NEXT_DIST_DIR=.next-3010` sont réservées au développement local et ne sont pas nécessaires en production Vercel.

Runtime Node attendu :

```bash
22.x
```

Le champ `engines.node` de `package.json` force ce runtime côté Vercel. L'environnement local de test peut être plus récent, mais Node `22.x` est la cible bêta recommandée pour le build Vercel.

## Variables D'environnement

Créer les variables suivantes dans Vercel :

```bash
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=6a3681b00024f77f43af
APPWRITE_DATABASE_ID=6a3683a20012ce76d15f
APPWRITE_API_KEY=
```

`APPWRITE_API_KEY` est optionnelle selon les permissions Appwrite bêta. Si elle est utilisée, elle doit rester côté serveur uniquement. Ne pas créer de variable `NEXT_PUBLIC_APPWRITE_API_KEY`.

Le fichier [.env.example](./.env.example) sert de modèle sans clé secrète.

## Déploiement Vercel

Workflow recommandé :

1. Pousser le projet sur GitHub.
2. Connecter le dépôt GitHub dans Vercel.
3. Framework détecté : Next.js.
4. Node.js version : `22.x`.
5. Build command : `npm run build`.
6. Renseigner les variables d'environnement Appwrite dans Vercel.
7. Déployer.

## Appwrite : Domaine Vercel

Après le premier déploiement Vercel, ajouter le domaine dans Appwrite :

```text
Appwrite
→ Project
→ Platforms
→ Web
→ Add platform
→ ajouter le domaine Vercel
```

Domaine prévu :

```text
https://5s-by-ed.vercel.app
```

Ou le domaine réel généré par Vercel si différent.

## Sécurité Bêta

Mode bêta : les permissions Appwrite peuvent rester ouvertes temporairement pour les tests terrain.

Authentification, rôles, durcissement des permissions, photos et exports PDF seront traités dans des sprints ultérieurs.

Ne jamais commiter :
- `.env`
- `.env.local`
- une clé `APPWRITE_API_KEY`
- toute clé serveur ou secret Vercel
