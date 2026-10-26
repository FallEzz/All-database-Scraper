/**
 * ============================================================================
 * JKT48 OFFICIAL WEBSITE & ECOSYSTEM SCRAPER (https://jkt48.com/)
 * Oleh: FallEzz (FallZx Infinity)
 * ============================================================================
 * Fitur Lengkap:
 * 1. Member List     (Daftar Member Aktif, Trainee, & Ex-Member + Filter/Search)
 * 2. Member Detail   (Profil Lengkap, Jikoshoukai, Biodata, Medsos, Histori Show)
 * 3. News            (Berita & Pengumuman Resmi JKT48 + Isi Detail Berita)
 * 4. Theater Schedule(Jadwal Teater Upcoming, Recent & Detail Lineup Member)
 * 5. Events/Calendar (Jadwal Event Eksternal, Konser & Kalender JKT48)
 * 6. Setlist         (Daftar Setlist Teater JKT48 Beserta Deskripsi & Lagu)
 * 7. Now Live        (Cek Member JKT48 yang Sedang Live di IDN Live / Showroom)
 * ============================================================================
 */

const JKT48_BASE_URL = 'https://jkt48.com';
const JKT48_API_MIRROR = 'https://api.crstlnz.my.id/api';

const DEFAULT_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept: 'application/json, text/html, */*'
};

/**
 * Helper: Membersihkan tag HTML menjadi teks bersih
 */
function stripHtml(html) {
  if (!html || typeof html !== 'string') return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Helper: Fetch JSON dari endpoint dengan error handling
 */
async function fetchJson(url, customHeaders = {}) {
  const res = await fetch(url, {
    headers: { ...DEFAULT_HEADERS, ...customHeaders }
  });
  if (!res.ok) {
    throw new Error(`HTTP Error ${res.status} saat mengakses ${url}`);
  }
  return res.json();
}

// ============================================================================
// 1. FITUR MEMBER JKT48 (https://jkt48.com/member/list?lang=id)
// ============================================================================

/**
 * Mengambil daftar member JKT48
 * @param {Object} options
 * @param {boolean} [options.onlyActive=true] Jika true hanya menampilkan member aktif (belum graduate)
 * @param {string} [options.generation] Filter generasi (contoh: 'gen12', 'gen10', 'gen7')
 * @param {string} [options.search] Cari berdasarkan nama atau panggilan (nickname)
 */
async function getMembers({ onlyActive = true, generation = null, search = null } = {}) {
  const rawMembers = await fetchJson(`${JKT48_API_MIRROR}/member?group=jkt48`);

  let filtered = Array.isArray(rawMembers) ? rawMembers : [];

  if (onlyActive) {
    filtered = filtered.filter((m) => !m.is_graduate && !m.is_group);
  }

  if (generation) {
    const genNorm = String(generation).toLowerCase().replace(/[^a-z0-9]/g, '');
    filtered = filtered.filter((m) =>
      String(m.generation || '')
        .toLowerCase()
        .includes(genNorm)
    );
  }

  if (search) {
    const q = search.toLowerCase().trim();
    filtered = filtered.filter(
      (m) =>
        (m.name && m.name.toLowerCase().includes(q)) ||
        (Array.isArray(m.nicknames) &&
          m.nicknames.some((n) => n.toLowerCase().includes(q))) ||
        (m.url && m.url.toLowerCase().includes(q))
    );
  }

  const members = filtered.map((m) => ({
    jkt48_id: m.jkt48_id || null,
    name: m.name,
    nicknames: m.nicknames || [],
    slug: m.url,
    generation: m.generation || null,
    team: m.team || null,
    is_graduate: Boolean(m.is_graduate),
    kabesha_img: m.img_alt || m.img,
    avatar_img: m.img,
    official_profile_url: m.jkt48_id
      ? `${JKT48_BASE_URL}/member/detail/id/${m.jkt48_id}?lang=id`
      : `${JKT48_BASE_URL}/member/list?lang=id`,
    idn_username: m.idn_username || null,
    showroom_room_id: m.room_id || null,
    socials: m.socials || []
  }));

  return {
    source_url: `${JKT48_BASE_URL}/member/list?lang=id`,
    total: members.length,
    members
  };
}

/**
 * Mengambil detail profil lengkap seorang member JKT48 (termasuk Jikoshoukai, tinggi badan,
 * golongan darah, tanggal lahir, medsos, serta riwayat & jadwal show teater)
 * @param {string} slugOrName Contoh: 'freya', 'christy', 'marsha', 'aralie', 'feni'
 */
async function getMemberDetail(slugOrName) {
  let slug = String(slugOrName).toLowerCase().trim();

  // Jika user memasukkan nama lengkap atau belum tahu slug-nya, cari dulu di daftar member
  let data;
  try {
    data = await fetchJson(`${JKT48_API_MIRROR}/member/${encodeURIComponent(slug)}`);
  } catch {
    const searchRes = await getMembers({ onlyActive: false, search: slugOrName });
    if (searchRes.members.length === 0) {
      throw new Error(`Member JKT48 '${slugOrName}' tidak ditemukan`);
    }
    slug = searchRes.members[0].slug;
    data = await fetchJson(`${JKT48_API_MIRROR}/member/${encodeURIComponent(slug)}`);
  }

  return {
    name: data.name,
    fullname: data.fullname || data.name,
    nickname: data.nickname,
    slug: data.url || slug,
    generation: data.generation,
    team: data.team,
    is_graduate: Boolean(data.is_graduate),
    jikosokai: data.jikosokai || null,
    birthdate: data.birthdate || null,
    bloodType: data.bloodType || null,
    height: data.height || null,
    description: data.description || null,
    kabesha_img: data.img_alt || data.img,
    avatar_img: data.img,
    banner_img: data.banner || null,
    socials: data.socials || [],
    upcoming_theater: data.upcomingTheater || [],
    recent_theater: data.recentTheater || [],
    live_stats: data.stats || null
  };
}

// ============================================================================
// 2. FITUR NEWS / BERITA RESMI (https://jkt48.com/news/list?lang=id)
// ============================================================================

/**
 * Mengambil daftar berita & pengumuman resmi dari https://jkt48.com/news/list?lang=id
 * @param {number} [page=1] Halaman berita
 * @param {number} [perpage=10] Jumlah berita per halaman
 */
async function getNews(page = 1, perpage = 10) {
  const data = await fetchJson(
    `${JKT48_API_MIRROR}/news?page=${page}&perpage=${perpage}`
  );
  const newsList = (data.news || []).map((n) => ({
    id: n.id,
    title: n.title,
    category: n.category,
    date: n.date,
    slug: n.link,
    official_url: `${JKT48_BASE_URL}/news/detail/id/${n.id}?lang=id`
  }));

  return {
    source_url: `${JKT48_BASE_URL}/news/list?lang=id`,
    page: data.page || page,
    perpage: data.perpage || perpage,
    total_count: data.total_count || newsList.length,
    news: newsList
  };
}

/**
 * Mengambil isi lengkap dari suatu berita JKT48 berdasarkan ID berita
 * @param {string|number} newsId Contoh: 1877
 */
async function getNewsDetail(newsId) {
  const data = await fetchJson(`${JKT48_API_MIRROR}/news/${encodeURIComponent(newsId)}`);
  return {
    id: data.id,
    title: data.title,
    category: data.category,
    date: data.date,
    official_url: `${JKT48_BASE_URL}/news/detail/id/${data.id}?lang=id`,
    content_text: stripHtml(data.content),
    content_html: data.content
  };
}

// ============================================================================
// 3. FITUR JADWAL TEATER & EVENT (https://jkt48.com/theater/schedule?lang=id)
// ============================================================================

/**
 * Mengambil jadwal pertunjukan Teater JKT48
 * @param {number} [page=1] Nomor halaman
 * @param {number} [perpage=10] Jumlah item per halaman
 */
async function getTheaterSchedule(page = 1, perpage = 10) {
  const data = await fetchJson(
    `${JKT48_API_MIRROR}/theater?page=${page}&perpage=${perpage}`
  );
  const shows = (data.theater || []).map((s) => ({
    id: s.id,
    title: s.title,
    team: s.team,
    start_date: s.start_date,
    end_date: s.end_date,
    member_count: s.member_count,
    seitansai: s.seitansai || [],
    graduation: s.graduation || [],
    poster: s.poster,
    banner: s.banner,
    official_ticket_url: `${JKT48_BASE_URL}/purchase/schedule/show?code=${s.id}`
  }));

  return {
    source_url: `${JKT48_BASE_URL}/theater/schedule?lang=id`,
    page: data.page || page,
    perpage: data.perpage || perpage,
    total_count: data.total_count || shows.length,
    shows
  };
}

/**
 * Mengambil detail spesifik pertunjukan Teater JKT48 (termasuk daftar lineup member yang tampil)
 * @param {string} showId Contoh: 'SH5538'
 */
async function getTheaterDetail(showId) {
  const data = await fetchJson(
    `${JKT48_API_MIRROR}/theater/${encodeURIComponent(showId)}`
  );
  const show = data.shows?.[0];
  if (!show) {
    throw new Error(`Jadwal teater dengan kode '${showId}' tidak ditemukan`);
  }

  return {
    id: show.id,
    title: show.title,
    team: show.team,
    date: show.date,
    official_ticket_url: show.url || `${JKT48_BASE_URL}/purchase/schedule/show?code=${show.id}`,
    setlist: show.setlist
      ? {
          id: show.setlist.id,
          title: show.setlist.title,
          title_alt: show.setlist.title_alt,
          description: show.setlist.description,
          poster: show.setlist.poster,
          banner: show.setlist.banner
        }
      : null,
    seitansai: show.seitansai || [],
    graduation: show.graduation || [],
    members: (show.members || []).map((m) => ({
      id: m.id,
      name: m.name,
      url_key: m.url_key,
      img: m.img
    }))
  };
}

/**
 * Mengambil ringkasan jadwal Teater (Upcoming & Recent) serta Event/Kalender JKT48 lainnya
 */
async function getEvents() {
  const data = await fetchJson(`${JKT48_API_MIRROR}/event`);
  return {
    source_url: `${JKT48_BASE_URL}/calendar/list?lang=id`,
    upcoming_theater: data.theater?.upcoming || [],
    recent_theater: data.theater?.recent || [],
    other_schedule: (data.other_schedule || []).map((ev) => ({
      ...ev,
      official_url: `${JKT48_BASE_URL}/calendar/list?lang=id`
    }))
  };
}

// ============================================================================
// 4. FITUR SETLIST TEATER JKT48
// ============================================================================

/**
 * Mengambil daftar seluruh Setlist Teater JKT48 beserta deskripsi, lagu, poster, dan statistiknya
 */
async function getSetlists() {
  const data = await fetchJson(`${JKT48_API_MIRROR}/setlist`);
  return {
    total: Array.isArray(data) ? data.length : 0,
    setlists: data || []
  };
}

// ============================================================================
// 5. FITUR LIVE STREAMING REAL-TIME (IDN Live / Showroom / YouTube)
// ============================================================================

/**
 * Mengecek member JKT48 yang sedang melakukan live streaming saat ini
 */
async function getNowLive() {
  const data = await fetchJson(`${JKT48_API_MIRROR}/now_live?group=jkt48`);
  const list = Array.isArray(data) ? data : [];
  return {
    total_live: list.length,
    streams: list.map((s) => ({
      name: s.name,
      url_key: s.url_key,
      slug: s.slug,
      type: s.type, // 'idn' | 'showroom' | 'youtube'
      started_at: s.started_at,
      img: s.img,
      avatar: s.img_alt,
      streaming_url_list: s.streaming_url_list || []
    }))
  };
}

// ============================================================================
// EXPORT MODUL
// ============================================================================
module.exports = {
  getMembers,
  getMemberDetail,
  getNews,
  getNewsDetail,
  getTheaterSchedule,
  getTheaterDetail,
  getEvents,
  getSetlists,
  getNowLive
};

// ============================================================================
// DEMO PENGGUNAAN (Dijalankan langsung via `node jkt48_scraper.js`)
// ============================================================================
if (require.main === module) {
  (async () => {
    try {
      console.log('==============================================================');
      console.log('   DEMO SCRAPER JKT48 OFFICIAL (https://jkt48.com/)');
      console.log('==============================================================\n');

      // 1. Daftar Member Aktif
      const activeMembers = await getMembers({ onlyActive: true });
      console.log(`1. [MEMBER AKTIF] Total Member Aktif: ${activeMembers.total}`);
      console.log(
        `   Contoh 5 Member: ${activeMembers.members
          .slice(0, 5)
          .map((m) => `${m.name} (${m.nicknames[0] || '-'})`)
          .join(', ')}\n`
      );

      // 2. Detail Profil Member
      const freya = await getMemberDetail('freya');
      console.log(`2. [DETAIL MEMBER] ${freya.fullname} (${freya.nickname})`);
      console.log(`   Generasi   : ${freya.generation}`);
      console.log(`   Tgl Lahir  : ${freya.birthdate}`);
      console.log(`   Tinggi/Goldar: ${freya.height} / ${freya.bloodType}`);
      console.log(`   Jikoshoukai: "${freya.jikosokai}"\n`);

      // 3. Berita Resmi JKT48 (News)
      const news = await getNews(1, 5);
      console.log(`3. [NEWS] Total Berita Tercatat: ${news.total_count}`);
      if (news.news.length > 0) {
        const firstNews = news.news[0];
        console.log(`   Berita Terbaru: [${firstNews.category}] ${firstNews.title}`);
        const detailNews = await getNewsDetail(firstNews.id);
        console.log(
          `   Cuplikan Isi  : ${detailNews.content_text.slice(0, 150).replace(/\n/g, ' ')}...\n`
        );
      }

      // 4. Jadwal Teater JKT48
      const theater = await getTheaterSchedule(1, 5);
      console.log(`4. [THEATER SCHEDULE] Total Jadwal Show: ${theater.total_count}`);
      if (theater.shows.length > 0) {
        const s = theater.shows[0];
        console.log(`   Show Terdekat: [${s.id}] ${s.title} (${s.team}) - ${s.start_date}`);
      }
      console.log();

      // 5. Event & Kalender JKT48
      const events = await getEvents();
      console.log(
        `5. [EVENTS & CALENDAR] Upcoming Theater: ${events.upcoming_theater.length} | Recent Theater: ${events.recent_theater.length} | Event Lainnya: ${events.other_schedule.length}`
      );
      if (events.other_schedule.length > 0) {
        console.log(
          `   Event Eksternal Terdekat: ${events.other_schedule[0].title} (${events.other_schedule[0].date})`
        );
      }
      console.log();

      // 6. Daftar Setlist Teater JKT48
      const setlists = await getSetlists();
      console.log(
        `6. [SETLIST TEATER] Total Setlist: ${setlists.total} (${setlists.setlists
          .slice(0, 5)
          .map((s) => s.title)
          .join(', ')}, ...)\n`
      );

      // 7. Member yang Sedang Live Streaming
      const live = await getNowLive();
      console.log(`7. [NOW LIVE] Member Sedang Live Saat Ini: ${live.total_live}`);
      live.streams.forEach((st, idx) => {
        console.log(`   ${idx + 1}. ${st.name} (via ${st.type.toUpperCase()}) - Slug: ${st.slug}`);
      });
    } catch (err) {
      console.error('[Error]:', err.message);
      process.exitCode = 1;
    }
  })();
}
