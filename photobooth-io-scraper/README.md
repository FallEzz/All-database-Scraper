# Photobooth-io Scraper

Modul scraper untuk mengekstrak data dari platform photobooth online gratis: **[https://photobooth-io.cc](https://photobooth-io.cc)**.

Tersedia dalam versi **Node.js** (native `fetch`, tanpa library pihak ketiga) dan **Python**.

---

## 🚀 Fitur

- **Ekstraksi Metadata & FAQ:** Mengambil informasi umum, deskripsi, dan FAQ privasi/penggunaan.
- **Katalog Template & Layout:** Mengambil daftar 14+ template foto, jumlah pose foto (*photo slot*), link thumbnail preview, serta rute halaman capture dan customizer.
- **Daftar Stiker Drag & Drop:** Mengekstrak 84 file aset stiker PNG.
- **Downloader Aset:** Pengunduh paralel untuk aset visual template (`.webp`), stiker (`.png`), dan engine JavaScript kanvas (`canvas.js`, `customize.js`, `layout.js`).

---

## 📂 Struktur Berkas

```text
photobooth-io-scraper/
├── photobooth_scraper.js    # Modul scraper versi Node.js (ES Module)
├── photobooth_scraper.py    # Modul scraper versi Python 3
├── data/                    # Hasil ekstraksi JSON
│   ├── metadata.json        # Metadata & FAQ situs
│   ├── layout_catalog.json  # Katalog template foto lengkap
│   └── stickers_list.json   # Daftar 84 aset stiker
└── README.md                # Dokumentasi
```

---

## 🛠️ Penggunaan

### 1. Node.js

Jalankan langsung melalui terminal:
```bash
node photobooth_scraper.js
```

Atau impor sebagai modul dalam proyek Anda:
```javascript
import {
  scrapeMetadata,
  scrapeLayoutCatalog,
  scrapeStickersList,
  downloadAllAssets
} from './photobooth_scraper.js';

// Ambil metadata & FAQ
const meta = await scrapeMetadata();
console.log(meta.title);

// Ambil daftar template
const layouts = await scrapeLayoutCatalog();
console.log(`Ditemukan ${layouts.length} layout`);

// Unduh seluruh aset ke folder lokal
await downloadAllAssets('./output');
```

### 2. Python

Jalankan script Python:
```bash
python3 photobooth_scraper.py
```

---

## 📊 Contoh Output JSON

### `layout_catalog.json`
```json
[
  {
    "key": "layoutA",
    "name": "Layout A",
    "thumbnail": "/assets/layouts/layout_A.webp",
    "thumbnailUrl": "https://photobooth-io.cc/assets/layouts/layout_A.webp",
    "capturePage": "/canvas.html",
    "customizePage": "/customize.html",
    "photoCount": 3
  },
  {
    "key": "heartsFilter",
    "name": "Hearts Filter",
    "thumbnail": "/assets/layouts/hearts_filter.webp",
    "thumbnailUrl": "https://photobooth-io.cc/assets/layouts/hearts_filter.webp",
    "capturePage": "/hearts-layout.html",
    "customizePage": "/customize.html",
    "photoCount": 4
  }
]
```

---

## 👤 Author
**FallEzz (FallZx Infinity)**
