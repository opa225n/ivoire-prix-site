# Ivoire Prix, page publique

Page du comparateur de prix des boutiques en ligne de Côte d'Ivoire : https://ivoireprix.tontine-ci.com

Ce dépôt ne contient que la page publique (HTML, icônes, manifeste de l'application installable, service worker).
Les prix sont lus à l'ouverture de la page depuis une API publique en lecture seule ; aucune donnée ni aucun secret
n'est stocké ici.

- `index.html` : toute la page, sans framework.
- `404.html` : copie de `index.html`, pour que les adresses `/p/<produit>` et `/c/<catégorie>` ouvrent la page (GitHub Pages
  renvoie `404.html` pour une adresse inconnue).
- `CNAME` : nom de domaine de la page.
- `sw.js`, `manifest.webmanifest`, `icons/` : application installable. Les prix ne sont jamais mis en cache.
