# Rando Var — PWA Club de Carcès

Application web progressive (PWA) du club de randonnée de Carcès (Var).  
Hébergée sur GitHub Pages : **https://BernardHoyez.github.io/verdonargens/**

---

## Structure du projet

```
pwa-verdonargens/
├── index.html              ← Page unique (SPA)
├── manifest.json           ← Métadonnées PWA (installation)
├── sw.js                   ← Service Worker (cache + offline)
├── 404.html                ← Redirect SPA pour GitHub Pages
├── css/
│   └── app.css             ← Styles
├── js/
│   ├── app.js              ← Navigation, chargement sorties, fiches
│   └── formulaire.js       ← Formulaire animateur + envoi email
├── sorties/
│   └── 2025.json           ← ⭐ DONNÉES des randonnées (à éditer)
├── traces/
│   ├── futures/            ← Fichiers .gpx des randos à venir
│   └── passees/            ← Fichiers .gpx des randos passées
├── icons/
│   ├── icon192.png         ← Icône PWA (placeholder)
│   └── icon512.png         ← Icône PWA haute résolution (placeholder)
└── .github/
    └── workflows/
        ├── deploy.yml      ← Déploiement automatique sur push
        └── keep-alive.yml  ← Ping hebdomadaire du site
```

---

## Déploiement initial

### 1. Créer le dépôt GitHub

```bash
# Sur GitHub : créer un dépôt public nommé "verdonargens"
# sous le compte BernardHoyez

git init
git add .
git commit -m "Initial commit — PWA Rando Var"
git branch -M main
git remote add origin https://github.com/BernardHoyez/verdonargens.git
git push -u origin main
```

### 2. Activer GitHub Pages

Dans le dépôt GitHub :
- Settings → Pages
- Source : **GitHub Actions**
- Sauvegarder

Le déploiement se lance automatiquement. Le site sera disponible à :  
`https://BernardHoyez.github.io/verdonargens/`

---

## Ajouter une randonnée (reçue par email d'un animateur)

L'animateur utilise le formulaire dans l'onglet **Infos → Proposer une rando**.  
Le webmaster reçoit un email avec la fiche et le bloc JSON.

**Sur GitHub.com (sans ligne de commande) :**

1. Ouvrir `sorties/2025.json` dans le dépôt
2. Cliquer sur l'icône crayon (Edit)
3. Ajouter la nouvelle fiche JSON dans le tableau (après une virgule)
4. Cliquer **Commit changes** → message : `Ajout rando : [intitulé]`
5. Le site se redéploie automatiquement en ~1 minute

**Structure d'une fiche :**

```json
{
  "id": "2025-09-07-mont-faron",
  "date": "2025-09-07",
  "intitule": "Mont Faron depuis Toulon",
  "difficulte": "moyen",
  "distance_km": 13,
  "denivele_m": 450,
  "points_remarquables": ["Télécabine du Faron", "Fort du Baron", "Vue sur la rade"],
  "depart_carces": "08:00",
  "depart_rando": "09:00",
  "point_depart": "Parking Faron bas",
  "distance_ar_km": 18,
  "covoiturage": true,
  "animateur": "Marie Leblanc",
  "telephone": "06 23 45 67 89",
  "trace_gpx": "traces/futures/2025-09-07-mont-faron.gpx"
}
```

---

## Ajouter un fichier GPX

1. Dans le dépôt, ouvrir `traces/futures/`
2. Cliquer **Add file → Upload files**
3. Déposer le fichier `.gpx`
4. Nommer le fichier selon la convention : `AAAA-MM-JJ-slug.gpx`
5. Commit

Après la randonnée, déplacer le fichier de `traces/futures/` vers `traces/passees/`  
et mettre à jour le champ `trace_gpx` dans `sorties/2025.json`.

---

## Mise à jour du Service Worker (brise-cache)

À chaque déploiement important, incrémenter `CACHE_VERSION` dans `sw.js` :

```js
// sw.js ligne 4
const CACHE_VERSION = 'v1.0.1';  // ← changer à chaque déploiement majeur
```

Tous les navigateurs des membres téléchargeront automatiquement la nouvelle version.

---

## Remplacer les icônes placeholder

Les fichiers `icons/icon192.png` et `icons/icon512.png` sont des placeholders verts.  
Pour les remplacer par le logo du club :

1. Préparer deux images PNG carrées : 192×192 et 512×512 px
2. Les nommer exactement `icon192.png` et `icon512.png`
3. Les déposer dans `icons/` (écrasement des placeholders)
4. Commit + push → redéploiement automatique

---

## Changer l'email du webmaster

Dans `js/formulaire.js`, ligne 5 :

```js
const WEBMASTER_EMAIL = 'webmaster@clubrando.fr';  // ← remplacer
```

---

## Mettre à jour la carte uMap

La carte est votre carte uMap existante, embarquée via iframe.  
Aucune action nécessaire côté PWA : toute modification sur  
`umap.openstreetmap.fr` apparaît automatiquement dans l'application.

---

## Résolution de problèmes courants

| Problème | Solution |
|----------|----------|
| Le site n'est pas à jour | Vider le cache navigateur ou attendre 5 min |
| La carte ne charge pas | Vérifier la connexion (iframe nécessite internet) |
| L'email animateur est tronqué | Fiche trop longue pour mailto: — copier le JSON manuellement |
| Le SW bloque une mise à jour | Incrémenter `CACHE_VERSION` dans `sw.js` |
| GitHub Pages retourne 404 | Vérifier Settings → Pages → Source = GitHub Actions |

---

*PWA générée avec Claude (Anthropic) — Juin 2025*
