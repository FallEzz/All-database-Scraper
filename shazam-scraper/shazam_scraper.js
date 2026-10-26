/**
 * ============================================================================
 * SHAZAM & APPLE MUSIC CATALOG SCRAPER (https://www.shazam.com/)
 * Oleh: FallEzz (FallZx Infinity)
 * ============================================================================
 * Fitur Lengkap:
 * 1. searchMusic     (Cari Lagu & Artis + Preview Audio M4A + Artwork HD)
 * 2. getTrackDetail  (Detail Lagu Lengkap + Lirik Plain & Synced LRC + Audio)
 * 3. getArtistDetail (Profil Artis, Top Tracks & Daftar Album)
 * 4. getTopCharts    (Top Charts Lagu Terpopuler per Negara: ID, US, KR, JP, dll)
 * 5. downloadPreview (Download Audio Preview Resmi .m4a dari Lagu)
 * ============================================================================
 * Catatan Teknis:
 * - Mendukung akses langsung ke endpoint Shazam Web API (www.shazam.com/services/amapi)
 * - Dilengkapi auto-fallback ke backend utama Shazam (Apple Music / iTunes API +
 *   Apple Music RSS Charts + LRCLIB Synced Lyrics) apabila IP server/VPS terkena
 *   blokir Fastly WAF (HTTP 405/403) pada www.shazam.com.
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const { pipeline } = require('stream/promises');
const { Readable } = require('stream');

const SHAZAM_BASE_URL = 'https://www.shazam.com';
const ITUNES_API_URL = 'https://itunes.apple.com';
const APPLE_CHARTS_URL = 'https://rss.applemarketingtools.com/api/v2';
const LRCLIB_API_URL = 'https://lrclib.net/api';

const DEFAULT_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept: 'application/json, text/plain, */*',
  'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7'
};

/**
 * Helper: Mengubah URL artwork resolusi kecil (100x100) menjadi HD (1000x1000)
 */
function toHighResArtwork(url) {
  if (!url || typeof url !== 'string') return null;
  return url.replace(/\/\d+x\d+bb\.(jpg|png|webp)/i, '/1000x1000bb.$1');
}

/**
 * Helper: Membuat slug URL ramah Shazam
 */
function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Helper: Format objek track dari katalog Shazam / Apple Music
 */
function formatTrack(item) {
  const durationSec = item.trackTimeMillis
    ? Math.round(item.trackTimeMillis / 1000)
    : null;
  const songSlug = slugify(`${item.trackName || ''}-${item.artistName || ''}`);

  return {
    track_id: item.trackId,
    title: item.trackName,
    artist: item.artistName,
    artist_id: item.artistId,
    album: item.collectionName || null,
    album_id: item.collectionId || null,
    genre: item.primaryGenreName || null,
    release_date: item.releaseDate || null,
    duration_seconds: durationSec,
    explicit: item.trackExplicitness === 'explicit',
    artwork_hd: toHighResArtwork(item.artworkUrl100),
    artwork_thumb: item.artworkUrl100 || null,
    preview_audio_url: item.previewUrl || null,
    shazam_url: `${SHAZAM_BASE_URL}/song/${item.trackId}/${songSlug}`,
    apple_music_url: item.trackViewUrl || null,
    artist_url: item.artistViewUrl || `${SHAZAM_BASE_URL}/artist/${slugify(item.artistName)}/${item.artistId}`
  };
}

/**
 * Helper: Mengambil lirik lagu (Plain & Synced LRC) berdasarkan artis & judul lagu
 */
async function fetchLyrics(artistName, trackName) {
  if (!artistName || !trackName) return null;
  try {
    const url = `${LRCLIB_API_URL}/get?artist_name=${encodeURIComponent(
      artistName
    )}&track_name=${encodeURIComponent(trackName)}`;
    const res = await fetch(url, { headers: DEFAULT_HEADERS });
    if (res.ok) {
      const data = await res.json();
      return {
        instrumental: Boolean(data.instrumental),
        plain_lyrics: data.plainLyrics || null,
        synced_lyrics: data.syncedLyrics || null
      };
    }

    // Jika exact match tidak ketemu, coba search lirik
    const searchUrl = `${LRCLIB_API_URL}/search?q=${encodeURIComponent(
      `${artistName} ${trackName}`
    )}`;
    const sRes = await fetch(searchUrl, { headers: DEFAULT_HEADERS });
    if (sRes.ok) {
      const sList = await sRes.json();
      if (Array.isArray(sList) && sList.length > 0) {
        return {
          instrumental: Boolean(sList[0].instrumental),
          plain_lyrics: sList[0].plainLyrics || null,
          synced_lyrics: sList[0].syncedLyrics || null
        };
      }
    }
  } catch {
    // Abaikan jika layanan lirik tidak merespons
  }
  return null;
}

// ============================================================================
// 1. PENCARIAN MUSIK & ARTIS (searchMusic)
// ============================================================================

/**
 * Mencari lagu di katalog Shazam / Apple Music berdasarkan kata kunci
 * @param {string} query Kata kunci judul lagu atau nama artis (contoh: 'Hindia Evaluasi', 'Coldplay Yellow')
 * @param {number} [limit=10] Jumlah hasil maksimal
 * @param {string} [country='ID'] Kode negara katalog ('ID', 'US', 'JP', 'KR', 'GB')
 */
async function searchMusic(query, limit = 10, country = 'ID') {
  if (!query) throw new Error('Parameter query pencarian tidak boleh kosong');

  // 1. Coba endpoint Shazam amapi langsung jika IP tidak diblokir Fastly
  try {
    const shazamUrl = `${SHAZAM_BASE_URL}/services/amapi/v1/catalog/${country}/search?types=songs,artists&term=${encodeURIComponent(
      query
    )}&limit=${limit}`;
    const sRes = await fetch(shazamUrl, { headers: DEFAULT_HEADERS });
    if (sRes.ok) {
      const sJson = await sRes.json();
      const songs = sJson?.results?.songs?.data || [];
      if (songs.length > 0) {
        return {
          query,
          country,
          total: songs.length,
          tracks: songs.map((s) => ({
            track_id: s.id,
            title: s.attributes?.name,
            artist: s.attributes?.artistName,
            album: s.attributes?.albumName,
            genre: s.attributes?.genreNames?.[0] || null,
            release_date: s.attributes?.releaseDate || null,
            duration_seconds: s.attributes?.durationInMillis
              ? Math.round(s.attributes.durationInMillis / 1000)
              : null,
            artwork_hd: s.attributes?.artwork?.url
              ?.replace('{w}', '1000')
              .replace('{h}', '1000'),
            preview_audio_url: s.attributes?.previews?.[0]?.url || null,
            shazam_url: `${SHAZAM_BASE_URL}/song/${s.id}/${slugify(s.attributes?.name)}`,
            apple_music_url: s.attributes?.url || null
          }))
        };
      }
    }
  } catch {
    // Lanjut ke Apple Music / iTunes Catalog API (backend resmi Shazam)
  }

  // 2. Query ke backend katalog Apple Music / Shazam
  const url = `${ITUNES_API_URL}/search?term=${encodeURIComponent(
    query
  )}&country=${encodeURIComponent(country)}&media=music&entity=song&limit=${limit}`;

  const res = await fetch(url, { headers: DEFAULT_HEADERS });
  if (!res.ok) {
    throw new Error(`Gagal mencari musik (${res.status})`);
  }

  const data = await res.json();
  const tracks = (data.results || []).map(formatTrack);

  return {
    query,
    country,
    total: tracks.length,
    tracks
  };
}

// ============================================================================
// 2. DETAIL LAGU + LIRIK + PREVIEW AUDIO (getTrackDetail)
// ============================================================================

/**
 * Mengambil informasi detail sebuah lagu beserta Lirik (Plain & Synced LRC) dan link audio preview
 * @param {string|number} trackIdOrQuery ID lagu (contoh: 1793295104) atau judul lagu (contoh: 'Hindia Evaluasi')
 * @param {string} [country='ID'] Kode negara katalog
 */
async function getTrackDetail(trackIdOrQuery, country = 'ID') {
  let trackObj = null;

  if (/^\d+$/.test(String(trackIdOrQuery).trim())) {
    const lookupUrl = `${ITUNES_API_URL}/lookup?id=${encodeURIComponent(
      trackIdOrQuery
    )}&country=${encodeURIComponent(country)}&entity=song`;
    const res = await fetch(lookupUrl, { headers: DEFAULT_HEADERS });
    if (res.ok) {
      const data = await res.json();
      const found = (data.results || []).find((r) => r.wrapperType === 'track');
      if (found) trackObj = formatTrack(found);
    }
  }

  if (!trackObj) {
    const searchRes = await searchMusic(String(trackIdOrQuery), 1, country);
    if (searchRes.tracks.length === 0) {
      throw new Error(`Lagu '${trackIdOrQuery}' tidak ditemukan`);
    }
    trackObj = searchRes.tracks[0];
  }

  const lyrics = await fetchLyrics(trackObj.artist, trackObj.title);

  return {
    ...trackObj,
    lyrics: lyrics || {
      instrumental: false,
      plain_lyrics: null,
      synced_lyrics: null
    }
  };
}

// ============================================================================
// 3. PROFIL ARTIS, TOP TRACKS & ALBUM (getArtistDetail)
// ============================================================================

/**
 * Mengambil profil artis beserta daftar lagu terpopuler (Top Songs) dan daftar albumnya
 * @param {string|number} artistIdOrName ID Artis (contoh: 1440146558) atau Nama Artis (contoh: 'Hindia', 'Tulus')
 * @param {number} [limit=10] Jumlah lagu/album yang ditampilkan
 * @param {string} [country='ID'] Kode negara katalog
 */
async function getArtistDetail(artistIdOrName, limit = 10, country = 'ID') {
  let artistId = null;

  if (/^\d+$/.test(String(artistIdOrName).trim())) {
    artistId = String(artistIdOrName).trim();
  } else {
    const searchUrl = `${ITUNES_API_URL}/search?term=${encodeURIComponent(
      artistIdOrName
    )}&country=${encodeURIComponent(country)}&entity=musicArtist&limit=1`;
    const sRes = await fetch(searchUrl, { headers: DEFAULT_HEADERS });
    if (sRes.ok) {
      const sData = await sRes.json();
      artistId = sData.results?.[0]?.artistId;
    }
  }

  if (!artistId) {
    throw new Error(`Artis '${artistIdOrName}' tidak ditemukan`);
  }

  // Ambil profil artis + top songs + albums secara paralel
  const [songsRes, albumsRes] = await Promise.all([
    fetch(
      `${ITUNES_API_URL}/lookup?id=${artistId}&country=${country}&entity=song&limit=${limit}`,
      { headers: DEFAULT_HEADERS }
    ),
    fetch(
      `${ITUNES_API_URL}/lookup?id=${artistId}&country=${country}&entity=album&limit=${limit}`,
      { headers: DEFAULT_HEADERS }
    )
  ]);

  const songsData = songsRes.ok ? await songsRes.json() : { results: [] };
  const albumsData = albumsRes.ok ? await albumsRes.json() : { results: [] };

  const artistInfo =
    (songsData.results || []).find((r) => r.wrapperType === 'artist') ||
    (albumsData.results || []).find((r) => r.wrapperType === 'artist') ||
    {};

  const topTracks = (songsData.results || [])
    .filter((r) => r.wrapperType === 'track')
    .map(formatTrack);

  const albums = (albumsData.results || [])
    .filter((r) => r.wrapperType === 'collection')
    .map((a) => ({
      album_id: a.collectionId,
      title: a.collectionName,
      artist: a.artistName,
      track_count: a.trackCount,
      release_date: a.releaseDate,
      genre: a.primaryGenreName,
      artwork_hd: toHighResArtwork(a.artworkUrl100),
      apple_music_url: a.collectionViewUrl
    }));

  return {
    artist_id: artistInfo.artistId || artistId,
    name: artistInfo.artistName || String(artistIdOrName),
    genre: artistInfo.primaryGenreName || null,
    shazam_artist_url: `${SHAZAM_BASE_URL}/artist/${slugify(
      artistInfo.artistName || artistIdOrName
    )}/${artistInfo.artistId || artistId}`,
    apple_music_url: artistInfo.artistLinkUrl || null,
    total_top_tracks: topTracks.length,
    top_tracks: topTracks,
    total_albums: albums.length,
    albums
  };
}

// ============================================================================
// 4. TOP CHARTS MUSIK PER NEGARA (getTopCharts)
// ============================================================================

/**
 * Mengambil tangga lagu terpopuler (Top Charts) berdasarkan kode negara
 * @param {string} [country='ID'] Kode negara ISO-2 (contoh: 'ID', 'US', 'KR', 'JP', 'GB', 'MY')
 * @param {number} [limit=20] Jumlah lagu (maks 100)
 */
async function getTopCharts(country = 'ID', limit = 20) {
  const cc = String(country || 'ID').toLowerCase();
  const url = `${APPLE_CHARTS_URL}/${cc}/music/most-played/${limit}/songs.json`;

  const res = await fetch(url, { headers: DEFAULT_HEADERS });
  if (!res.ok) {
    throw new Error(`Gagal mengambil Top Charts untuk negara '${country}' (${res.status})`);
  }

  const data = await res.json();
  const results = data?.feed?.results || [];

  const charts = results.map((item, idx) => ({
    rank: idx + 1,
    track_id: item.id,
    title: item.name,
    artist: item.artistName,
    artist_id: item.artistId || null,
    release_date: item.releaseDate || null,
    genres: (item.genres || []).map((g) => g.name),
    artwork_hd: toHighResArtwork(item.artworkUrl100),
    shazam_url: `${SHAZAM_BASE_URL}/song/${item.id}/${slugify(
      `${item.name}-${item.artistName}`
    )}`,
    apple_music_url: item.url || null
  }));

  return {
    title: data?.feed?.title || `Top Songs (${country.toUpperCase()})`,
    country: country.toUpperCase(),
    updated: data?.feed?.updated || null,
    shazam_charts_url: `${SHAZAM_BASE_URL}/charts/top-200/${cc}`,
    total: charts.length,
    charts
  };
}

// ============================================================================
// 5. DOWNLOAD AUDIO PREVIEW LAGU (downloadPreview)
// ============================================================================

/**
 * Mengunduh file audio preview resmi (.m4a) dari lagu di Shazam / Apple Music
 * @param {string|number} trackIdOrQuery ID lagu atau kata kunci judul lagu
 * @param {string} [outputDir='./downloads'] Folder penyimpanan
 * @param {string} [country='ID'] Kode negara katalog
 */
async function downloadPreview(
  trackIdOrQuery,
  outputDir = './downloads',
  country = 'ID'
) {
  const track = await getTrackDetail(trackIdOrQuery, country);
  if (!track.preview_audio_url) {
    throw new Error(`Tidak tersedia audio preview untuk lagu: ${track.title}`);
  }

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const safeFilename = `${slugify(`${track.artist}-${track.title}`)}-${track.track_id}.m4a`;
  const filePath = path.join(outputDir, safeFilename);

  const audioRes = await fetch(track.preview_audio_url, { headers: DEFAULT_HEADERS });
  if (!audioRes.ok || !audioRes.body) {
    throw new Error(`Gagal mengunduh file audio preview (${audioRes.status})`);
  }

  const fileStream = fs.createWriteStream(filePath);
  await pipeline(Readable.fromWeb(audioRes.body), fileStream);

  return {
    track_id: track.track_id,
    title: track.title,
    artist: track.artist,
    preview_audio_url: track.preview_audio_url,
    saved_to: filePath
  };
}

// ============================================================================
// EXPORT MODUL
// ============================================================================
module.exports = {
  searchMusic,
  getTrackDetail,
  getArtistDetail,
  getTopCharts,
  downloadPreview
};

// ============================================================================
// DEMO PENGGUNAAN (Dijalankan langsung via `node shazam_scraper.js`)
// ============================================================================
if (require.main === module) {
  (async () => {
    try {
      console.log('==============================================================');
      console.log('   DEMO SCRAPER SHAZAM MUSIC (https://www.shazam.com/)');
      console.log('==============================================================\n');

      // 1. Pencarian Lagu
      const searchRes = await searchMusic('Hindia Evaluasi', 5, 'ID');
      console.log(`1. [SEARCH MUSIC] Kata Kunci: "${searchRes.query}" (${searchRes.total} hasil):`);
      searchRes.tracks.forEach((t, i) => {
        console.log(
          `   ${i + 1}. [${t.track_id}] ${t.title} - ${t.artist} (Album: ${t.album}, ${t.duration_seconds}s)`
        );
      });
      console.log();

      // 2. Detail Lagu + Lirik (Plain & Synced LRC)
      const detail = await getTrackDetail('Hindia Evaluasi', 'ID');
      console.log(`2. [TRACK DETAIL & LYRICS] ${detail.title} - ${detail.artist}`);
      console.log(`   Shazam URL  : ${detail.shazam_url}`);
      console.log(`   Artwork HD  : ${detail.artwork_hd}`);
      console.log(`   Preview M4A : ${detail.preview_audio_url}`);
      if (detail.lyrics?.plain_lyrics) {
        console.log(
          `   Cuplikan Lirik:\n   "${detail.lyrics.plain_lyrics.split('\n').slice(0, 4).join(' / ')}"\n`
        );
      }

      // 3. Profil Artis, Top Songs & Albums
      const artist = await getArtistDetail('Hindia', 5, 'ID');
      console.log(
        `3. [ARTIST DETAIL] ${artist.name} (ID: ${artist.artist_id}, Genre: ${artist.genre})`
      );
      console.log(
        `   Top Tracks : ${artist.top_tracks.map((t) => t.title).join(', ')}`
      );
      console.log(
        `   Albums     : ${artist.albums.map((a) => a.title).join(', ')}\n`
      );

      // 4. Top Charts Indonesia
      const charts = await getTopCharts('ID', 10);
      console.log(`4. [TOP CHARTS INDONESIA] (${charts.total} Lagu Terpopuler):`);
      charts.charts.slice(0, 5).forEach((c) => {
        console.log(`   #${c.rank} ${c.title} - ${c.artist}`);
      });
      console.log();

      // 5. Download Audio Preview (.m4a)
      const dl = await downloadPreview(detail.track_id, './downloads', 'ID');
      console.log(`5. [DOWNLOAD PREVIEW AUDIO] Berhasil diunduh ke: ${dl.saved_to}`);
    } catch (err) {
      console.error('[Error]:', err.message);
      process.exitCode = 1;
    }
  })();
}
