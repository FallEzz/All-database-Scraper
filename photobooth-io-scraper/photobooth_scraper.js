/**
 * Photobooth-io Scraper (Node.js)
 * Author: FallEzz (FallZx Infinity)
 * Source: https://photobooth-io.cc
 * 
 * Modul scraper untuk mengekstrak metadata, katalog template/layout foto,
 * daftar stiker drag-and-drop, script engine kanvas, dan mengunduh aset.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://photobooth-io.cc';
const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
};

/**
 * Helper fetch teks dengan header
 */
async function fetchText(endpoint) {
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
  const response = await fetch(url, { headers: HEADERS });
  if (!response.ok) {
    throw new Error(`HTTP Error ${response.status} saat fetch ${url}`);
  }
  return await response.text();
}

/**
 * Helper download biner (gambar, js, css)
 */
async function downloadBinary(endpoint, destPath) {
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
  const response = await fetch(url, { headers: HEADERS });
  if (!response.ok) {
    throw new Error(`HTTP Error ${response.status} saat download ${url}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  await fs.mkdir(path.dirname(destPath), { recursive: true });
  await fs.writeFile(destPath, buffer);
  return buffer.length;
}

/**
 * 1. Scrape Metadata & FAQ
 */
export async function scrapeMetadata() {
  const [indexHtml, aboutHtml] = await Promise.all([
    fetchText('/index.html'),
    fetchText('/about.html'),
  ]);

  const titleMatch = indexHtml.match(/<title>(.*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : '';

  const descMatch = indexHtml.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/i);
  const description = descMatch ? descMatch[1].trim() : '';

  const faqRegex = /<h[34][^>]*>(.*?)<\/h[34]>\s*<p[^>]*>(.*?)<\/p>/gis;
  const faqs = [];
  let match;
  while ((match = faqRegex.exec(aboutHtml)) !== null) {
    const q = match[1].replace(/<[^>]+>/g, '').trim();
    const a = match[2].replace(/<[^>]+>/g, '').trim();
    if (q.length > 5 && a.length > 5) {
      faqs.push({ question: q, answer: a });
    }
  }

  return { title, description, faqs };
}

/**
 * 2. Scrape Katalog Template Lengkap
 */
export async function scrapeLayoutCatalog() {
  const jsContent = await fetchText('/js/layout-catalog.js');

  const catalogRegex =
    /key:\s*["']([^"']+)["'],\s*name:\s*["']([^"']+)["'],\s*thumbnail:\s*["']([^"']+)["'],\s*capturePage:\s*["']([^"']+)["'],\s*customizePage:\s*["']([^"']+)["'],\s*photoCount:\s*(\d+)/g;

  const catalog = [];
  let m;
  while ((m = catalogRegex.exec(jsContent)) !== null) {
    catalog.push({
      key: m[1],
      name: m[2],
      thumbnail: m[3],
      thumbnailUrl: `${BASE_URL}${m[3]}`,
      capturePage: m[4],
      customizePage: m[5],
      photoCount: parseInt(m[6], 10),
    });
  }

  return catalog;
}

/**
 * 3. Scrape Daftar Seluruh Stiker Drag & Drop
 */
export async function scrapeStickersList() {
  const customizeHtml = await fetchText('/customize.html');
  const stickerRegex = /assets\/drag-drop-stickers\/([a-zA-Z0-9_\-\.]+\.png)/g;
  const stickers = new Set();
  let m;
  while ((m = stickerRegex.exec(customizeHtml)) !== null) {
    stickers.add(m[1]);
  }
  return Array.from(stickers).sort();
}

/**
 * 4. Download Semua Aset (Template, Stiker, dan Scripts)
 */
export async function downloadAllAssets(outputDir = path.join(__dirname, 'output'), options = { maxConcurrency: 6 }) {
  console.log(`[Photobooth] Memulai proses download aset ke: ${outputDir}`);

  const metadata = await scrapeMetadata();
  const catalog = await scrapeLayoutCatalog();
  const stickers = await scrapeStickersList();

  // Simpan JSON
  const dataDir = path.join(outputDir, 'data');
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(path.join(dataDir, 'metadata.json'), JSON.stringify(metadata, null, 2));
  await fs.writeFile(path.join(dataDir, 'layout_catalog.json'), JSON.stringify(catalog, null, 2));
  await fs.writeFile(path.join(dataDir, 'stickers_list.json'), JSON.stringify(stickers, null, 2));

  // Unduh Template Thumbnails
  console.log(`[Photobooth] Mengunduh ${catalog.length} thumbnail template...`);
  for (const item of catalog) {
    const filename = path.basename(item.thumbnail);
    const dest = path.join(outputDir, 'templates', filename);
    await downloadBinary(item.thumbnailUrl, dest);
  }

  // Unduh Stiker secara paralel
  console.log(`[Photobooth] Mengunduh ${stickers.length} stiker drag & drop...`);
  const queue = [...stickers];
  const worker = async () => {
    while (queue.length > 0) {
      const st = queue.shift();
      if (!st) break;
      const url = `/assets/drag-drop-stickers/${st}`;
      const dest = path.join(outputDir, 'stickers', st);
      try {
        await downloadBinary(url, dest);
      } catch (e) {
        console.error(`[Error] Gagal mengunduh stiker ${st}:`, e.message);
      }
    }
  };
  await Promise.all(Array.from({ length: options.maxConcurrency }, () => worker()));

  // Unduh Script JS Inti
  console.log('[Photobooth] Mengunduh engine script canvas & customize...');
  const keyScripts = [
    'layout.js',
    'layout-navigation.js',
    'js/layout-catalog.js',
    'js/layout-switcher.js',
    'customize.js',
    'canvas.js',
    'download.js',
  ];
  for (const s of keyScripts) {
    const filename = path.basename(s);
    const dest = path.join(outputDir, 'scripts', filename);
    await downloadBinary(`/${s}`, dest);
  }

  console.log('[Photobooth] Selesai! Semua aset tersimpan rapi.');
  return { metadata, catalog, stickers };
}

// Jalankan otomatis jika dipanggil langsung lewat terminal
if (process.argv[1] && process.argv[1].endsWith('photobooth_scraper.js')) {
  downloadAllAssets().catch((err) => {
    console.error('[Fatal Error]', err);
    process.exit(1);
  });
}
