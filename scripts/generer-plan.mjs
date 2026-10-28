// Plan du site de https://ivoireprix.tontine-ci.com : un index (sitemap.xml), un fichier pour l'accueil et les catégories,
// puis des fichiers de produits. Lit la liste des produits et des catégories dans l'API publique en lecture seule
// (la même clé publique que celle de la page). Lancé chaque nuit par .github/workflows/plan-du-site.yml.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

export const SITE = 'https://ivoireprix.tontine-ci.com';
const API = 'https://zhmdvtmziqdjxxxpilbh.supabase.co/rest/v1';
const CLE = 'sb_publishable_39t5LLbPbc6n8686NqBvfw_PFzsDLBM';     // clé publique (la même que dans index.html), jamais la service_role
const PAR_FICHIER = 5000;                                         // Google accepte jusqu'à 50 000 adresses par fichier
const MINIMUM_PRODUITS = 100;                                     // en dessous, la lecture a échoué : on n'écrase rien
const SIMPLE = /^[a-z0-9-]+$/;
const esc = t => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
const adresse = (prefixe, slug) => `${SITE}/${prefixe}/${SIMPLE.test(slug) ? slug : esc(encodeURIComponent(slug))}`;
const xml = (balise, lignes) => `<?xml version="1.0" encoding="UTF-8"?>\n<${balise} xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${lignes.join('\n')}\n</${balise}>\n`;

// Entrée : listes de slugs. Sortie : {nom de fichier: contenu}
export function construire(produits, categories) {
  const fichiers = {'sitemap-pages.xml': xml('urlset', [`  <url><loc>${SITE}/</loc></url>`, ...categories.map(s => `  <url><loc>${adresse('c', s)}</loc></url>`)])};
  const noms = ['sitemap-pages.xml'];
  for (let i = 0; i * PAR_FICHIER < produits.length; i++) {
    const nom = `sitemap-produits-${i + 1}.xml`;
    fichiers[nom] = xml('urlset', produits.slice(i * PAR_FICHIER, (i + 1) * PAR_FICHIER).map(s => `  <url><loc>${adresse('p', s)}</loc></url>`));
    noms.push(nom);
  }
  fichiers['sitemap.xml'] = xml('sitemapindex', noms.map(n => `  <sitemap><loc>${SITE}/${n}</loc></sitemap>`));
  return fichiers;
}

async function lire(table, colonnes) {
  const lignes = [];
  for (let debut = 0; ; debut += 1000) {
    const r = await fetch(`${API}/${table}?select=${colonnes}&order=id&limit=1000&offset=${debut}`, {headers: {apikey: CLE}});
    if (!r.ok) throw new Error(`${table} : réponse ${r.status}`);
    const page = await r.json();
    lignes.push(...page);
    if (page.length < 1000) return lignes;
  }
}

async function principal() {
  const produits = (await lire('products', 'slug')).map(p => p.slug).filter(Boolean);
  const categories = (await lire('categories', 'slug')).map(c => c.slug).filter(Boolean);
  if (produits.length < MINIMUM_PRODUITS) throw new Error(`Seulement ${produits.length} produits lus : plan du site non modifié.`);
  const racine = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
  for (const f of fs.readdirSync(racine)) if (/^sitemap(-pages|-produits-\d+)?\.xml$/.test(f)) fs.unlinkSync(path.join(racine, f));   // pas de vieux fichiers
  for (const [nom, contenu] of Object.entries(construire(produits, categories))) fs.writeFileSync(path.join(racine, nom), contenu);
  console.log(`${produits.length} produits et ${categories.length} catégories : plan du site écrit.`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) principal().catch(e => { console.error(e.message); process.exit(1); });
