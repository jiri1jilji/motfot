// Inkrementální sběr fotek ze seznam-autobusu.cz -> data.json
// Spuštění: LIST_URL="https://www.seznam-autobusu.cz/...?page={page}" node scraper.mjs
//
// Proměnné prostředí:
//   LIST_URL   URL přehledu fotek; {page} se nahradí číslem stránky (1, 2, ...).
//              Bez {page} se stáhne jen jedna stránka.
//   MAX_PAGES  kolik stránek přehledu maximálně projít (výchozí 5; první běh dej třeba 200)
//   FULL=1     neukončovat průchod, když stránka nemá žádné nové odkazy
//   DELAY_MS   pauza mezi požadavky (výchozí 1500)
//   CONTACT    kontakt do User-Agentu (e-mail nebo URL), ať ví, kdo se dotazuje

import fs from 'node:fs/promises';
import * as cheerio from 'cheerio';

const LIST_URL = process.env.LIST_URL;
const MAX_PAGES = Number(process.env.MAX_PAGES || 5);
const FULL = process.env.FULL === '1';
const DELAY_MS = Number(process.env.DELAY_MS || 1500);
const CONTACT = process.env.CONTACT || 'neuvedeno';
const UA = `MOTFOT-mapa/1.0 (sběr povolen provozovatelem; kontakt: ${CONTACT})`;

const DATA_FILE = 'data.json';   // výsledek, který čte index.html
const SEEN_FILE = 'seen.json';   // odkazy bez GPS, ať je příště nestahujeme znovu
const IGNORE_FILE = 'ignore.json'; // ručně vyřazené odkazy (pole linkUrl)

if (!LIST_URL) {
  console.error('Chybí LIST_URL (URL přehledu fotek).');
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function readJson(file, fallback) {
  try {
    return JSON.parse(await fs.readFile(file, 'utf8'));
  } catch {
    return fallback;
  }
}

async function fetchHtml(url, tries = 3) {
  for (let t = 1; t <= tries; t++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'cs' } });
      if (res.status === 403 || res.status === 404) {
        console.warn(`⚠️ ${res.status} na ${url}`);
        return null;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (err) {
      console.warn(`Pokus ${t}/${tries} selhal u ${url}: ${err.message}`);
      await sleep(DELAY_MS * t * 2);
    }
  }
  return null;
}

function absolute(href, base) {
  try {
    return new URL(href, base).href;
  } catch {
    return null;
  }
}

// Stejná logika výběru odkazů jako v původním konzolovém skriptu
function extractLinks(html, base) {
  const $ = cheerio.load(html);
  const out = new Set();
  $('a').each((_, el) => {
    const a = $(el);
    const href = a.attr('href');
    if (!href) return;
    const ok = a.find('img').length > 0 || href.includes('fotka') || href.includes('voz');
    if (!ok) return;
    const abs = absolute(href, base);
    if (abs) out.add(abs);
  });
  return [...out];
}

function parseDetail(html, url) {
  const $ = cheerio.load(html);

  // GPS z odkazu na Mapy.cz (?id=lon,lat)
  let lat = null;
  let lon = null;
  const mapHref = $('a[href*="mapy.cz"]').first().attr('href');
  if (mapHref) {
    try {
      const id = new URL(mapHref, url).searchParams.get('id');
      if (id && id.includes(',')) {
        const [x, y] = id.split(',');
        lon = parseFloat(x);
        lat = parseFloat(y);
      }
    } catch {}
  }
  if (lat === null || lon === null || Number.isNaN(lat) || Number.isNaN(lon)) return null;

  const imgEl = $('.fotka img, img.main-foto, img[src*="fotky"]').first();
  const img = imgEl.length ? imgEl : $('img').first();
  const src = img.attr('src');
  const fotoUrl = src ? absolute(src, url) || '' : '';

  const title =
    $('h1').first().text().trim() ||
    $('h2').first().text().trim() ||
    $('.nadpis').first().text().trim() ||
    $('title').text().trim();

  let autor = 'S-A';
  const authorText = $('.metadata.author a, a[href*="/uzivatel/"]').first().text().trim();
  if (authorText) autor = authorText;

  return {
    lat,
    lon,
    fotoUrl,
    linkUrl: url,
    vozidlo: title.replace(/\s+/g, ' '),
    autor,
  };
}

async function main() {
  const data = await readJson(DATA_FILE, []);
  const seen = new Set(await readJson(SEEN_FILE, []));
  const ignored = new Set(await readJson(IGNORE_FILE, []));
  const known = new Set(data.map((d) => d.linkUrl));
  const hasPlaceholder = LIST_URL.includes('{page}');
  const pages = hasPlaceholder ? MAX_PAGES : 1;

  let added = 0;

  for (let p = 1; p <= pages; p++) {
    const listUrl = hasPlaceholder ? LIST_URL.replace('{page}', String(p)) : LIST_URL;
    console.log(`📄 Přehled, strana ${p}: ${listUrl}`);
    const html = await fetchHtml(listUrl);
    await sleep(DELAY_MS);
    if (!html) break;

    const links = extractLinks(html, listUrl);
    const fresh = links.filter((l) => !known.has(l) && !seen.has(l) && !ignored.has(l));
    console.log(`   odkazů: ${links.length}, nových: ${fresh.length}`);

    if (links.length === 0) break;
    if (fresh.length === 0 && !FULL) {
      console.log('   Žádné nové odkazy, končím průchod.');
      break;
    }

    for (const url of fresh) {
      const detail = await fetchHtml(url);
      await sleep(DELAY_MS);
      if (!detail) continue;
      const item = parseDetail(detail, url);
      if (!item) {
        seen.add(url); // bez GPS (nebo to není detail fotky)
        continue;
      }
      data.push(item);
      known.add(url);
      added++;
      console.log(`   + ${item.vozidlo} | ${item.autor}`);
    }

    // průběžné uložení, ať se při pádu nic neztratí
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
    await fs.writeFile(SEEN_FILE, JSON.stringify([...seen], null, 2));
  }

  // odstraň z dat vše, co je mezitím v ignore.json
  const cleaned = data.filter((d) => !ignored.has(d.linkUrl));
  await fs.writeFile(DATA_FILE, JSON.stringify(cleaned, null, 2));
  await fs.writeFile(SEEN_FILE, JSON.stringify([...seen], null, 2));
  console.log(`🎉 Hotovo. Přidáno ${added}, celkem ${cleaned.length} fotek s GPS.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
