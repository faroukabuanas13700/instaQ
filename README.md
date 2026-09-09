# Instagram-style GitHub Pages site

Ce projet est une interface de profil inspirée d'Instagram, conçue pour GitHub Pages.

## Fichiers
- `index.html` : structure du site
- `style.css` : design responsive
- `script.js` : interactions et stockage local

## Mise en ligne
1. Mets `index.html`, `style.css` et `script.js` à la racine du dépôt.
2. Dans GitHub : Settings → Pages.
3. Choisis `Deploy from a branch`, puis `main` et `/ (root)`.
4. Enregistre et attends le déploiement.

GitHub Pages est un hébergement statique : cette version fonctionne sans serveur, mais les données créées depuis le navigateur (likes, profil, publications ajoutées depuis l'appareil) sont locales au navigateur. Pour des likes et comptes partagés entre tous les visiteurs, il faudra ensuite ajouter un backend/base de données.

## Médias
Pour un site public permanent, mets les images/vidéos dans le dépôt (par exemple `assets/`) ou utilise un hébergeur de médias. Les fichiers choisis via les boutons de cette démo sont des aperçus locaux et ne deviennent pas automatiquement publics pour les autres visiteurs.

## Vidéo de profil
La zone de profil accepte une image ou une vidéo. Pour une vraie vidéo de profil publique, il est préférable d'héberger le fichier vidéo dans le dépôt puis de définir son URL dans le code.
