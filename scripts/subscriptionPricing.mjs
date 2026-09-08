#!/usr/bin/env node
// Fetch + cache regional subscription pricing from opentherank.com/ai-pricing/
// (ChatGPT, Claude, Gemini, Cursor, GitHub Copilot, etc. — App Store regional price gaps).
//
// Usage:
//   node scripts/subscriptionPricing.mjs                 # fetch + cache + print full table
//   node scripts/subscriptionPricing.mjs --app=cursor     # filter one app
//   node scripts/subscriptionPricing.mjs --cached         # skip fetch, read last cache
//
// Cache: scripts/.cache/subscriptionPricing.json (gitignored — regenerate anytime).
// Site only exposes top-4 cheapest + 1 most-expensive region per app, NOT a full
// country list — so a query like "price in Cambodia" may not be answerable if KH
// isn't in that app's visible top/bottom rows. Say so instead of guessing.
//
// ponytail: naive HTML->markdown-ish scrape via regex on fetched text, no headless
// browser. Good enough since the page is server-rendered. Add Playwright only if
// the site switches to client-side rendering and this stops working.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = join(__dirname, ".cache");
const CACHE_FILE = join(CACHE_DIR, "subscriptionPricing.json");
const SOURCE_URL = "https://opentherank.com/ai-pricing/";

const APP_FILTER = process.argv.find(a => a.startsWith("--app="))?.slice("--app=".length)?.toLowerCase();
const USE_CACHE = process.argv.includes("--cached");

async function fetchAndParse() {
  const res = await fetch(SOURCE_URL);
  if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
  const html = await res.text();

  // Sections: <h2 ...>X Pricing by Region</h2> ... <tbody>...<tr class="pt-row">...</tbody>
  const apps = [];
  const sectionRe = /<h2[^>]*>([^<]+?) Pricing by Region<\/h2>/gi;
  let match;
  const sections = [];
  while ((match = sectionRe.exec(html))) sections.push({ name: match[1].trim(), start: match.index });

  const rowRe = /<td class="pt-td pt-td-rank"[^>]*>(\d+)<\/td>.*?<span class="pt-region[^>]*>([^<]+)<\/span>.*?data-otr-usd="([\d.]+)" data-otr-suffix="([^"]*)"[^>]*>\$[\d.]+\/[a-z]+<\/span>\s*<span class="pc-local"[^>]*>([^<]+)<\/span>/gis;

  for (let i = 0; i < sections.length; i++) {
    const { name, start } = sections[i];
    const end = i + 1 < sections.length ? sections[i + 1].start : html.length;
    const chunk = html.slice(start, end);
    const bodyMatch = chunk.match(/<tbody[^>]*>(.*?)<\/tbody>/is);
    if (!bodyMatch) continue;
    const rows = [];
    let rowMatch;
    rowRe.lastIndex = 0;
    while ((rowMatch = rowRe.exec(bodyMatch[1]))) {
      rows.push({
        rank: Number(rowMatch[1]),
        region: rowMatch[2].trim(),
        usd: Number(rowMatch[3]),
        period: rowMatch[4] || "/mo",
        local: rowMatch[5].trim(),
      });
    }
    if (rows.length) apps.push({ app: name, rows });
  }

  return {
    fetchedAt: new Date().toISOString(),
    source: SOURCE_URL,
    caveat: "Site shows only top-4 cheapest + 1 most-expensive region per app — not a full country list. A region absent here may still exist on the site but isn't scraped.",
    apps,
  };
}

function loadCache() {
  if (!existsSync(CACHE_FILE)) return null;
  return JSON.parse(readFileSync(CACHE_FILE, "utf8"));
}

function saveCache(data) {
  mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2));
}

async function main() {
  let data = USE_CACHE ? loadCache() : null;
  if (!data) {
    data = await fetchAndParse();
    saveCache(data);
  }

  const apps = APP_FILTER
    ? data.apps.filter(a => a.app.toLowerCase().includes(APP_FILTER))
    : data.apps;

  if (!apps.length) {
    console.log(`No app matching "${APP_FILTER}". Available: ${data.apps.map(a => a.app).join(", ")}`);
    return;
  }

  for (const a of apps) {
    console.log(`\n### ${a.app}`);
    for (const r of a.rows) console.log(`  ${r.rank}. ${r.region} — $${r.usd}${r.period} (${r.local})`);
  }
  console.log(`\n(cached: ${data.fetchedAt})\n${data.caveat}`);
}

main().catch(err => { console.error(err); process.exit(1); });
