const fs = require('fs');
const path = require('path');
const { pipeline } = require('stream/promises');
const { Readable } = require('stream');

const BASE_SEARCH_URL = 'https://archive.org/advancedsearch.php';
const BASE_METADATA_URL = 'https://archive.org/metadata';
const BASE_DOWNLOAD_URL = 'https://archive.org/download';

const HEADERS = {
  'User-Agent': 'ArchiveMusicClient/1.0 (NodeJS; Educational/OpenSource)'
};

/**
 * 1. Mencari musik/audio di Internet Archive berdasarkan kata kunci
 */
async function searchMusic(query, limit = 10) {
  const url = `${BASE_SEARCH_URL}?q=${encodeURIComponent(`(${query}) AND mediatype:(audio)`)}&fl[]=identifier&fl[]=title&fl[]=creator&fl[]=downloads&sort[]=downloads+desc&rows=${limit}&page=1&output=json`;

  const response = await fetch(url, { headers: HEADERS });
  if (!response.ok) {
    throw new Error(`HTTP Error! Status: ${response.status}`);
  }

  const data = await response.json();
  return data?.response?.docs || [];
}

/**
 * 2. Mengambil informasi profil karya dan daftar rilisan dari seorang artis/creator
 */
async function getArtist(artistName, limit = 10) {
  const query = `creator:("${artistName}") AND mediatype:(audio)`;
  const url = `${BASE_SEARCH_URL}?q=${encodeURIComponent(query)}&fl[]=identifier&fl[]=title&fl[]=creator&fl[]=date&fl[]=downloads&sort[]=downloads+desc&rows=${limit}&page=1&output=json`;

  const response = await fetch(url, { headers: HEADERS });
  if (!response.ok) {
    throw new Error(`HTTP Error! Status: ${response.status}`);
  }

  const data = await response.json();
  const resBody = data?.response || {};

  return {
    artist: artistName,
    totalReleasesFound: resBody.numFound || 0,
    tracksOrAlbums: resBody.docs || []
  };
}

/**
 * 3. Mengambil metadata item dan mengunduh file MP3 pertama yang tersedia
 */
async function downloadMusic(identifier, outputDir = './downloads') {
  const metaUrl = `${BASE_METADATA_URL}/${encodeURIComponent(identifier)}`;
  const metaRes = await fetch(metaUrl, { headers: HEADERS });

  if (!metaRes.ok) {
    throw new Error(`Gagal mengambil metadata (${metaRes.status})`);
  }

  const metadata = await metaRes.json();
  const files = metadata?.files || [];

  // Cari file dengan ekstensi .mp3
  const mp3Files = files.filter(
    (f) => f.name && f.name.toLowerCase().endsWith('.mp3')
  );

  if (mp3Files.length === 0) {
    console.log(`[!] Tidak ditemukan file MP3 pada item: ${identifier}`);
    return null;
  }

  const targetFile = mp3Files[0].name;
  // Encode setiap segmen path jika file berada di dalam subfolder
  const encodedFilePath = targetFile
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');

  const downloadUrl = `${BASE_DOWNLOAD_URL}/${encodeURIComponent(identifier)}/${encodedFilePath}`;

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const localFilename = path.join(outputDir, path.basename(targetFile));
  console.log(`[*] Mengunduh: ${targetFile} ...`);

  const fileRes = await fetch(downloadUrl, { headers: HEADERS });
  if (!fileRes.ok || !fileRes.body) {
    throw new Error(`Gagal mengunduh file (${fileRes.status})`);
  }

  const fileStream = fs.createWriteStream(localFilename);
  await pipeline(Readable.fromWeb(fileRes.body), fileStream);

  console.log(`[+] Berhasil disimpan ke: ${localFilename}`);
  return localFilename;
}

// === CONTOH PENGGUNAAN ===
(async () => {
  try {
    console.log("=== 1. HASIL PENCARIAN MUSIK ('acoustic instrumental') ===");
    const results = await searchMusic('acoustic instrumental', 5);
    results.forEach((item, idx) => {
      console.log(
        `${idx + 1}. [${item.identifier}] ${item.title} - Artis: ${item.creator || 'Unknown'}`
      );
    });

    console.log("\n=== 2. INFO ARTIS ('Kevin MacLeod') ===");
    const artistInfo = await getArtist('Kevin MacLeod', 5);
    console.log(
      `Artis: ${artistInfo.artist} (Total rilisan: ${artistInfo.totalReleasesFound})`
    );
    artistInfo.tracksOrAlbums.forEach((item) => {
      console.log(`- [${item.identifier}] ${item.title}`);
    });

    if (results.length > 0) {
      const firstId = results[0].identifier;
      console.log(`\n=== 3. MENGUNDUH ITEM: ${firstId} ===`);
      await downloadMusic(firstId);
    }
  } catch (err) {
    console.error('[Error]:', err.message);
  }
})();
