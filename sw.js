/* Ivoire Prix : service worker minimal.
   - Les prix ne sont JAMAIS mis en cache : toutes les requêtes vers une autre origine (Supabase, polices) passent par le réseau.
   - Les pages (navigations) vont d'abord au réseau ; hors connexion, on affiche la coquille de la page d'accueil.
   - Les fichiers fixes du site (icônes, manifeste, image de partage) sont servis depuis le cache puis rafraîchis.
   Pour forcer une mise à jour du cache, changer VERSION. */
const VERSION = 'v1';
const CACHE = `ivoire-prix-${VERSION}`;
const COQUILLE = ['/', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png'];
const FIXES = /^\/(icons\/|manifest\.webmanifest$|og-image\.png$)/;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(COQUILLE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(noms => Promise.all(noms.filter(n => n.startsWith('ivoire-prix-') && n !== CACHE).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;                 // prix, comptes, polices : toujours le réseau
  if (/^\/(sitemap.*\.xml|robots\.txt|google.*\.html|sw\.js)$/.test(url.pathname)) return;

  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(() => caches.match('/').then(r => r || Response.error())));
    return;
  }
  if (FIXES.test(url.pathname)) {
    e.respondWith(caches.open(CACHE).then(async c => {
      const connu = await c.match(req);
      const frais = fetch(req).then(r => { if (r.ok) c.put(req, r.clone()); return r; }).catch(() => connu);
      return connu || frais;
    }));
  }
});
