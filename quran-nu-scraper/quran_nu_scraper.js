/**
 * ============================================================================
 * QURAN NU ONLINE SCRAPER (https://quran.nu.or.id/)
 * Oleh: FallEzz (FallZx Infinity)
 * ============================================================================
 * Fitur Lengkap:
 * 1. Surah        (Daftar 114 Surah, Detail Surah & Ayat, Detail per Ayat)
 * 2. Juz          (Daftar 30 Juz & Pengelompokan Surah, Detail Ayat per Juz)
 * 3. Urutan Turun (Daftar 114 Surah berdasarkan Urutan Turun / Nuzulul Qur'an)
 * 4. Tahlil       (Bacaan Tahlil & Doa Arwah Lengkap Arab, Latin & Terjemah)
 * 5. Doa          (Daftar Kategori Doa, Daftar Doa per Kategori & Detail Doa)
 * 6. Wirid        (Daftar Kategori Wirid, Daftar Wirid per Kategori & Detail)
 * 7. Maulid       (Daftar 7 Kitab Maulid & Detail Bacaan Rawi Maulid)
 * 8. Hadits       (Daftar 22 Kitab Hadits, Bab, dan Isi Hadits hadits.nu.or.id)
 * 9. Jadwal Sholat(Jadwal Sholat Kota/Kabupaten Indonesia - Standar LFNU/Kemenag)
 * ============================================================================
 */

const QURAN_BASE_URL = 'https://quran.nu.or.id';
const HADITS_BASE_URL = 'https://hadits.nu.or.id';
const JADWAL_BASE_URL = 'https://jadwalsholat.nu.or.id';

const DEFAULT_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept: 'text/x-component, text/html, application/json, */*'
};

// Urutan turun (Nuzulul Qur'an) resmi dari bundle aplikasi quran.nu.or.id
const REVELATION_ORDER_IDS = [
  96, 68, 73, 74, 1, 111, 81, 87, 92, 89, 93, 94, 103, 100, 108, 102, 107, 109,
  105, 113, 114, 112, 53, 80, 97, 91, 85, 95, 106, 101, 75, 104, 77, 50, 90, 86,
  54, 38, 7, 72, 36, 25, 35, 19, 20, 56, 26, 27, 28, 17, 10, 11, 12, 15, 6, 37,
  31, 34, 39, 40, 41, 42, 43, 44, 45, 46, 51, 88, 18, 16, 71, 14, 21, 23, 32,
  52, 67, 69, 70, 78, 79, 82, 84, 30, 29, 83, 2, 8, 3, 33, 60, 4, 99, 57, 47,
  13, 55, 76, 65, 98, 59, 24, 22, 63, 58, 49, 66, 64, 61, 62, 48, 5, 9, 110
];

// Data indeks 114 Surah dari quran.nu.or.id
const SURAH_INDEX = [
  { id: 1, name: 'Al-Fatihah', slug: 'al-fatihah', translate: 'Pembuka', type: 'Makkiyah', verse_count: 7, juz_id: 1 },
  { id: 2, name: 'Al-Baqarah', slug: 'al-baqarah', translate: 'Sapi', type: 'Madaniyah', verse_count: 286, juz_id: 1 },
  { id: 3, name: "Ali 'Imran", slug: 'ali-imran', translate: 'Keluarga Imran', type: 'Madaniyah', verse_count: 200, juz_id: 3 },
  { id: 4, name: "An-Nisa'", slug: 'an-nisa', translate: 'Perempuan', type: 'Madaniyah', verse_count: 176, juz_id: 4 },
  { id: 5, name: "Al-Ma'idah", slug: 'al-maidah', translate: 'Hidangan', type: 'Madaniyah', verse_count: 120, juz_id: 6 },
  { id: 6, name: "Al-An'am", slug: 'al-anam', translate: 'Binatang Ternak', type: 'Makkiyah', verse_count: 165, juz_id: 7 },
  { id: 7, name: "Al-A'raf", slug: 'al-araf', translate: 'Tempat Tertinggi', type: 'Makkiyah', verse_count: 206, juz_id: 8 },
  { id: 8, name: 'Al-Anfal', slug: 'al-anfal', translate: 'Rampasan Perang', type: 'Madaniyah', verse_count: 75, juz_id: 9 },
  { id: 9, name: 'At-Taubah', slug: 'at-taubah', translate: 'Pengampunan', type: 'Madaniyah', verse_count: 129, juz_id: 10 },
  { id: 10, name: 'Yunus', slug: 'yunus', translate: 'Yunus', type: 'Makkiyah', verse_count: 109, juz_id: 11 },
  { id: 11, name: 'Hud', slug: 'hud', translate: 'Hud', type: 'Makkiyah', verse_count: 123, juz_id: 11 },
  { id: 12, name: 'Yusuf', slug: 'yusuf', translate: 'Yusuf', type: 'Makkiyah', verse_count: 111, juz_id: 12 },
  { id: 13, name: "Ar-Ra'd", slug: 'ar-rad', translate: 'Guruh', type: 'Makkiyah', verse_count: 43, juz_id: 13 },
  { id: 14, name: 'Ibrahim', slug: 'ibrahim', translate: 'Ibrahim', type: 'Makkiyah', verse_count: 52, juz_id: 13 },
  { id: 15, name: 'Al-Hijr', slug: 'al-hijr', translate: 'Hijr', type: 'Makkiyah', verse_count: 99, juz_id: 14 },
  { id: 16, name: 'An-Nahl', slug: 'an-nahl', translate: 'Lebah', type: 'Makkiyah', verse_count: 128, juz_id: 14 },
  { id: 17, name: "Al-Isra'", slug: 'al-isra', translate: 'Memperjalankan pada Malam Hari', type: 'Makkiyah', verse_count: 111, juz_id: 15 },
  { id: 18, name: 'Al-Kahf', slug: 'al-kahf', translate: 'Gua', type: 'Makkiyah', verse_count: 110, juz_id: 15 },
  { id: 19, name: 'Maryam', slug: 'maryam', translate: 'Maryam', type: 'Makkiyah', verse_count: 98, juz_id: 16 },
  { id: 20, name: 'Thaha', slug: 'thaha', translate: 'Taha', type: 'Makkiyah', verse_count: 135, juz_id: 16 },
  { id: 21, name: "Al-Anbiya'", slug: 'al-anbiya', translate: 'Para Nabi', type: 'Makkiyah', verse_count: 112, juz_id: 17 },
  { id: 22, name: 'Al-Hajj', slug: 'al-hajj', translate: 'Haji', type: 'Madaniyah', verse_count: 78, juz_id: 17 },
  { id: 23, name: "Al-Mu'minun", slug: 'al-muminun', translate: 'Orang-Orang Mukmin', type: 'Makkiyah', verse_count: 118, juz_id: 18 },
  { id: 24, name: 'An-Nur', slug: 'an-nur', translate: 'Cahaya', type: 'Madaniyah', verse_count: 64, juz_id: 18 },
  { id: 25, name: 'Al-Furqan', slug: 'al-furqan', translate: 'Pembeda', type: 'Makkiyah', verse_count: 77, juz_id: 18 },
  { id: 26, name: "Asy-Syu'ara'", slug: 'asy-syuara', translate: 'Para Penyair', type: 'Makkiyah', verse_count: 227, juz_id: 19 },
  { id: 27, name: 'An-Naml', slug: 'an-naml', translate: 'Semut', type: 'Makkiyah', verse_count: 93, juz_id: 19 },
  { id: 28, name: 'Al-Qashash', slug: 'al-qashash', translate: 'Kisah', type: 'Makkiyah', verse_count: 88, juz_id: 20 },
  { id: 29, name: "Al-'Ankabut", slug: 'al-ankabut', translate: 'Laba-Laba', type: 'Makkiyah', verse_count: 69, juz_id: 20 },
  { id: 30, name: 'Ar-Rum', slug: 'ar-rum', translate: 'Romawi', type: 'Makkiyah', verse_count: 60, juz_id: 21 },
  { id: 31, name: 'Luqman', slug: 'luqman', translate: 'Luqman', type: 'Makkiyah', verse_count: 34, juz_id: 21 },
  { id: 32, name: 'As-Sajdah', slug: 'as-sajdah', translate: 'Sajdah', type: 'Makkiyah', verse_count: 30, juz_id: 21 },
  { id: 33, name: 'Al-Ahzab', slug: 'al-ahzab', translate: 'Golongan Yang Bersekutu', type: 'Madaniyah', verse_count: 73, juz_id: 21 },
  { id: 34, name: "Saba'", slug: 'saba', translate: "Saba'", type: 'Makkiyah', verse_count: 54, juz_id: 22 },
  { id: 35, name: 'Fathir', slug: 'fathir', translate: 'Pencipta', type: 'Makkiyah', verse_count: 45, juz_id: 22 },
  { id: 36, name: 'Yasin', slug: 'yasin', translate: 'Yasin', type: 'Makkiyah', verse_count: 83, juz_id: 22 },
  { id: 37, name: 'Ash-Shaffat', slug: 'ash-shaffat', translate: 'Yang Berbaris-baris', type: 'Makkiyah', verse_count: 182, juz_id: 23 },
  { id: 38, name: 'Shad', slug: 'shad', translate: 'Shad', type: 'Makkiyah', verse_count: 88, juz_id: 23 },
  { id: 39, name: 'Az-Zumar', slug: 'az-zumar', translate: 'Rombongan', type: 'Makkiyah', verse_count: 75, juz_id: 23 },
  { id: 40, name: 'Ghafir', slug: 'ghafir', translate: 'Maha Pengampun', type: 'Makkiyah', verse_count: 85, juz_id: 24 },
  { id: 41, name: 'Fushshilat', slug: 'fushshilat', translate: 'Dijelaskan', type: 'Makkiyah', verse_count: 54, juz_id: 24 },
  { id: 42, name: 'Asy-Syura', slug: 'asy-syura', translate: 'Musyawarah', type: 'Makkiyah', verse_count: 53, juz_id: 25 },
  { id: 43, name: 'Az-Zukhruf', slug: 'az-zukhruf', translate: 'Perhiasan dari Emas', type: 'Makkiyah', verse_count: 89, juz_id: 25 },
  { id: 44, name: 'Ad-Dukhan', slug: 'ad-dukhan', translate: 'Kabut Asap', type: 'Makkiyah', verse_count: 59, juz_id: 25 },
  { id: 45, name: 'Al-Jatsiyah', slug: 'al-jatsiyah', translate: 'Berlutut', type: 'Makkiyah', verse_count: 37, juz_id: 25 },
  { id: 46, name: 'Al-Ahqaf', slug: 'al-ahqaf', translate: 'Ahqaf', type: 'Makkiyah', verse_count: 35, juz_id: 26 },
  { id: 47, name: 'Muhammad', slug: 'muhammad', translate: 'Nabi Muhammad', type: 'Madaniyah', verse_count: 38, juz_id: 26 },
  { id: 48, name: 'Al-Fath', slug: 'al-fath', translate: 'Kemenangan', type: 'Madaniyah', verse_count: 29, juz_id: 26 },
  { id: 49, name: 'Al-Hujurat', slug: 'al-hujurat', translate: 'Kamar-Kamar', type: 'Madaniyah', verse_count: 18, juz_id: 26 },
  { id: 50, name: 'Qaf', slug: 'qaf', translate: 'Qaf', type: 'Makkiyah', verse_count: 45, juz_id: 26 },
  { id: 51, name: 'Adz-Dzariyat', slug: 'adz-dzariyat', translate: 'Yang Menerbangkan', type: 'Makkiyah', verse_count: 60, juz_id: 26 },
  { id: 52, name: 'At-Thur', slug: 'at-thur', translate: 'Gunung', type: 'Makkiyah', verse_count: 49, juz_id: 27 },
  { id: 53, name: 'An-Najm', slug: 'an-najm', translate: 'Bintang', type: 'Makkiyah', verse_count: 62, juz_id: 27 },
  { id: 54, name: 'Al-Qamar', slug: 'al-qamar', translate: 'Bulan', type: 'Makkiyah', verse_count: 55, juz_id: 27 },
  { id: 55, name: 'Ar-Rahman', slug: 'ar-rahman', translate: 'Yang Maha Pengasih', type: 'Makkiyah', verse_count: 78, juz_id: 27 },
  { id: 56, name: "Al-Waqi'ah", slug: 'al-waqiah', translate: 'Hari Kiamat Yang Pasti Terjadi', type: 'Makkiyah', verse_count: 96, juz_id: 27 },
  { id: 57, name: 'Al-Hadid', slug: 'al-hadid', translate: 'Besi', type: 'Madaniyah', verse_count: 29, juz_id: 27 },
  { id: 58, name: 'Al-Mujadilah', slug: 'al-mujadilah', translate: 'Gugatan', type: 'Madaniyah', verse_count: 22, juz_id: 28 },
  { id: 59, name: 'Al-Hasyr', slug: 'al-hasyr', translate: 'Pengusiran', type: 'Madaniyah', verse_count: 24, juz_id: 28 },
  { id: 60, name: 'Al-Mumtahanah', slug: 'al-mumtahanah', translate: 'Wanita Yang Diuji', type: 'Madaniyah', verse_count: 13, juz_id: 28 },
  { id: 61, name: 'Ash-Shaff', slug: 'ash-shaff', translate: 'Barisan', type: 'Madaniyah', verse_count: 14, juz_id: 28 },
  { id: 62, name: "Al-Jumu'ah", slug: 'al-jumuah', translate: 'Jumat', type: 'Madaniyah', verse_count: 11, juz_id: 28 },
  { id: 63, name: 'Al-Munafiqun', slug: 'al-munafiqun', translate: 'Orang-Orang Munafik', type: 'Madaniyah', verse_count: 11, juz_id: 28 },
  { id: 64, name: 'At-Taghabun', slug: 'at-taghabun', translate: 'Pengungkapan Kesalahan', type: 'Madaniyah', verse_count: 18, juz_id: 28 },
  { id: 65, name: 'At-Thalaq', slug: 'at-thalaq', translate: 'Talak', type: 'Madaniyah', verse_count: 12, juz_id: 28 },
  { id: 66, name: 'At-Tahrim', slug: 'at-tahrim', translate: 'Pengharaman', type: 'Madaniyah', verse_count: 12, juz_id: 28 },
  { id: 67, name: 'Al-Mulk', slug: 'al-mulk', translate: 'Kerajaan', type: 'Makkiyah', verse_count: 30, juz_id: 29 },
  { id: 68, name: 'Al-Qalam', slug: 'al-qalam', translate: 'Pena', type: 'Makkiyah', verse_count: 52, juz_id: 29 },
  { id: 69, name: 'Al-Haqqah', slug: 'al-haqqah', translate: 'Hari Kiamat Yang Pasti Datang', type: 'Makkiyah', verse_count: 52, juz_id: 29 },
  { id: 70, name: "Al-Ma'arij", slug: 'al-maarij', translate: 'Tempat-Tempat Naik', type: 'Makkiyah', verse_count: 44, juz_id: 29 },
  { id: 71, name: 'Nuh', slug: 'nuh', translate: 'Nuh', type: 'Makkiyah', verse_count: 28, juz_id: 29 },
  { id: 72, name: 'Al-Jinn', slug: 'al-jinn', translate: 'Jin', type: 'Makkiyah', verse_count: 28, juz_id: 29 },
  { id: 73, name: 'Al-Muzzammil', slug: 'al-muzzammil', translate: 'Orang Berkelumun', type: 'Makkiyah', verse_count: 20, juz_id: 29 },
  { id: 74, name: 'Al-Muddatstsir', slug: 'al-muddatstsir', translate: 'Orang Berselimut', type: 'Makkiyah', verse_count: 56, juz_id: 29 },
  { id: 75, name: 'Al-Qiyamah', slug: 'al-qiyamah', translate: 'Hari Kiamat', type: 'Makkiyah', verse_count: 40, juz_id: 29 },
  { id: 76, name: 'Al-Insan', slug: 'al-insan', translate: 'Manusia', type: 'Madaniyah', verse_count: 31, juz_id: 29 },
  { id: 77, name: 'Al-Mursalat', slug: 'al-mursalat', translate: 'Malaikat Yang Diutus', type: 'Makkiyah', verse_count: 50, juz_id: 29 },
  { id: 78, name: "An-Naba'", slug: 'an-naba', translate: 'Berita', type: 'Makkiyah', verse_count: 40, juz_id: 30 },
  { id: 79, name: "An-Nazi'at", slug: 'an-naziat', translate: 'Yang Mencabut Dengan Keras', type: 'Makkiyah', verse_count: 46, juz_id: 30 },
  { id: 80, name: "'Abasa", slug: 'abasa', translate: 'Berwajah Masam', type: 'Makkiyah', verse_count: 42, juz_id: 30 },
  { id: 81, name: 'At-Takwir', slug: 'at-takwir', translate: 'Penggulungan', type: 'Makkiyah', verse_count: 29, juz_id: 30 },
  { id: 82, name: 'Al-Infithar', slug: 'al-infithar', translate: 'Terbelah', type: 'Makkiyah', verse_count: 19, juz_id: 30 },
  { id: 83, name: 'Al-Muthaffifin', slug: 'al-muthaffifin', translate: 'Orang-Orang Yang Curang', type: 'Makkiyah', verse_count: 36, juz_id: 30 },
  { id: 84, name: 'Al-Insyiqaq', slug: 'al-insyiqaq', translate: 'Terbelah', type: 'Makkiyah', verse_count: 25, juz_id: 30 },
  { id: 85, name: 'Al-Buruj', slug: 'al-buruj', translate: 'Gugusan Bintang', type: 'Makkiyah', verse_count: 22, juz_id: 30 },
  { id: 86, name: 'At-Thariq', slug: 'at-thariq', translate: 'Yang Datang Pada Malam Hari', type: 'Makkiyah', verse_count: 17, juz_id: 30 },
  { id: 87, name: "Al-A'la", slug: 'al-ala', translate: 'Yang Maha Tinggi', type: 'Makkiyah', verse_count: 19, juz_id: 30 },
  { id: 88, name: 'Al-Ghasyiyah', slug: 'al-ghasyiyah', translate: 'Hari Kiamat Yang Menghilangkan Kesadaran', type: 'Makkiyah', verse_count: 26, juz_id: 30 },
  { id: 89, name: 'Al-Fajr', slug: 'al-fajr', translate: 'Fajar', type: 'Makkiyah', verse_count: 30, juz_id: 30 },
  { id: 90, name: 'Al-Balad', slug: 'al-balad', translate: 'Negeri', type: 'Makkiyah', verse_count: 20, juz_id: 30 },
  { id: 91, name: 'Asy-Syams', slug: 'asy-syams', translate: 'Matahari', type: 'Makkiyah', verse_count: 15, juz_id: 30 },
  { id: 92, name: 'Al-Lail', slug: 'al-lail', translate: 'Malam', type: 'Makkiyah', verse_count: 21, juz_id: 30 },
  { id: 93, name: 'Adh-Dhuha', slug: 'adh-dhuha', translate: 'Duha', type: 'Makkiyah', verse_count: 11, juz_id: 30 },
  { id: 94, name: 'Al-Insyirah', slug: 'al-insyirah', translate: 'Pelapangan', type: 'Makkiyah', verse_count: 8, juz_id: 30 },
  { id: 95, name: 'At-Tin', slug: 'at-tin', translate: 'Buah Tin', type: 'Makkiyah', verse_count: 8, juz_id: 30 },
  { id: 96, name: "Al-'Alaq", slug: 'al-alaq', translate: 'Segumpal Darah', type: 'Makkiyah', verse_count: 19, juz_id: 30 },
  { id: 97, name: 'Al-Qadr', slug: 'al-qadr', translate: 'Kemuliaan', type: 'Makkiyah', verse_count: 5, juz_id: 30 },
  { id: 98, name: 'Al-Bayyinah', slug: 'al-bayyinah', translate: 'Bukti Nyata', type: 'Madaniyah', verse_count: 8, juz_id: 30 },
  { id: 99, name: 'Az-Zalzalah', slug: 'az-zalzalah', translate: 'Guncangan', type: 'Madaniyah', verse_count: 8, juz_id: 30 },
  { id: 100, name: "Al-'Adiyat", slug: 'al-adiyat', translate: 'Kuda Perang Yang Berlari Kencang', type: 'Makkiyah', verse_count: 11, juz_id: 30 },
  { id: 101, name: "Al-Qari'ah", slug: 'al-qariah', translate: 'Hari Kiamat Yang Menggetarkan', type: 'Makkiyah', verse_count: 11, juz_id: 30 },
  { id: 102, name: 'At-Takatsur', slug: 'at-takatsur', translate: 'Berbangga-Bangga Dalam Memperbanyak Dunia', type: 'Makkiyah', verse_count: 8, juz_id: 30 },
  { id: 103, name: "Al-'Ashr", slug: 'al-ashr', translate: 'Masa', type: 'Makkiyah', verse_count: 3, juz_id: 30 },
  { id: 104, name: 'Al-Humazah', slug: 'al-humazah', translate: 'Pengumpat', type: 'Makkiyah', verse_count: 9, juz_id: 30 },
  { id: 105, name: 'Al-Fil', slug: 'al-fil', translate: 'Gajah', type: 'Makkiyah', verse_count: 5, juz_id: 30 },
  { id: 106, name: 'Quraisy', slug: 'quraisy', translate: 'Orang Quraisy', type: 'Makkiyah', verse_count: 4, juz_id: 30 },
  { id: 107, name: "Al-Ma'un", slug: 'al-maun', translate: 'Bantuan', type: 'Makkiyah', verse_count: 7, juz_id: 30 },
  { id: 108, name: 'Al-Kautsar', slug: 'al-kautsar', translate: 'Nikmat Yang Banyak', type: 'Makkiyah', verse_count: 3, juz_id: 30 },
  { id: 109, name: 'Al-Kafirun', slug: 'al-kafirun', translate: 'Orang-Orang Kafir', type: 'Makkiyah', verse_count: 6, juz_id: 30 },
  { id: 110, name: 'An-Nashr', slug: 'an-nashr', translate: 'Pertolongan', type: 'Madaniyah', verse_count: 3, juz_id: 30 },
  { id: 111, name: 'Al-Lahab', slug: 'al-lahab', translate: 'Gejolak Api', type: 'Makkiyah', verse_count: 5, juz_id: 30 },
  { id: 112, name: 'Al-Ikhlash', slug: 'al-ikhlash', translate: 'Ikhlas', type: 'Makkiyah', verse_count: 4, juz_id: 30 },
  { id: 113, name: 'Al-Falaq', slug: 'al-falaq', translate: 'Fajar', type: 'Madaniyah', verse_count: 5, juz_id: 30 },
  { id: 114, name: 'An-Nas', slug: 'an-nas', translate: 'Manusia', type: 'Madaniyah', verse_count: 6, juz_id: 30 }
];

const REVELATION_MAP = Object.fromEntries(
  REVELATION_ORDER_IDS.map((surahId, idx) => [surahId, idx + 1])
);

/**
 * Helper: Membersihkan tag HTML (<p>, <br>, dll) menjadi teks bersih
 */
function stripHtml(html) {
  if (!html || typeof html !== 'string') return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .trim();
}

/**
 * Helper: Byte-accurate Next.js RSC (React Server Components) Flight Stream Parser
 * Mengambil dan me-resolve semua referensi "$id" (termasuk chunk teks besar T<hex_len>,...)
 */
async function fetchRSC(url) {
  const response = await fetch(url, {
    headers: {
      ...DEFAULT_HEADERS,
      RSC: '1'
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP Error ${response.status} saat mengakses ${url}`);
  }

  const buf = Buffer.from(await response.arrayBuffer());
  const chunks = {};
  let pos = 0;

  while (pos < buf.length) {
    const colonIdx = buf.indexOf(0x3a, pos); // ':'
    if (colonIdx === -1) break;
    const id = buf.subarray(pos, colonIdx).toString('utf8').trim();
    pos = colonIdx + 1;
    if (pos >= buf.length) break;

    // Jika diawali 'T' diikuti panjang hex dan koma (contoh: 11:Tc57,<bytes>)
    if (buf[pos] === 0x54) {
      const commaIdx = buf.indexOf(0x2c, pos + 1); // ','
      const hexStr = buf.subarray(pos + 1, commaIdx).toString('utf8');
      const byteLen = parseInt(hexStr, 16);
      if (!Number.isNaN(byteLen) && commaIdx !== -1) {
        const start = commaIdx + 1;
        chunks[id] = buf.subarray(start, start + byteLen).toString('utf8');
        pos = start + byteLen;
        continue;
      }
    }

    // Baris JSON biasa sampai '\n'
    let nlIdx = buf.indexOf(0x0a, pos);
    if (nlIdx === -1) nlIdx = buf.length;
    const line = buf.subarray(pos, nlIdx).toString('utf8');
    pos = nlIdx + 1;

    if (line.startsWith('I[') || line.startsWith('HL[') || line.startsWith('E{')) {
      chunks[id] = line;
    } else {
      try {
        chunks[id] = JSON.parse(line);
      } catch {
        chunks[id] = line;
      }
    }
  }

  const memo = {};
  function resolve(val, depth = 0) {
    if (depth > 35) return val;
    if (typeof val === 'string') {
      if (val === '$undefined') return undefined;
      if (/^\$[0-9a-fA-F]+$/.test(val)) {
        const refId = val.slice(1);
        if (refId in memo) return memo[refId];
        if (refId in chunks) {
          memo[refId] = resolve(chunks[refId], depth + 1);
          return memo[refId];
        }
      }
      return val;
    }
    if (Array.isArray(val)) {
      return val.map((v) => resolve(v, depth + 1));
    }
    if (val && typeof val === 'object') {
      const out = {};
      for (const [k, v] of Object.entries(val)) {
        out[k] = resolve(v, depth + 1);
      }
      return out;
    }
    return val;
  }

  return resolve(chunks);
}

/**
 * Helper: Mencari semua object di dalam pohon RSC yang memenuhi predicate
 */
function findObjects(node, predicate, results = [], seen = new Set()) {
  if (!node || typeof node !== 'object' || seen.has(node)) return results;
  seen.add(node);
  if (predicate(node)) results.push(node);
  if (Array.isArray(node)) {
    for (const item of node) findObjects(item, predicate, results, seen);
  } else {
    for (const val of Object.values(node)) findObjects(val, predicate, results, seen);
  }
  return results;
}

// ============================================================================
// 1. FITUR SURAH
// ============================================================================

/**
 * Mengambil daftar seluruh 114 Surah di Al-Qur'an
 * @param {'asc'|'desc'} order Urutan nomor surah ('asc' = 1..114, 'desc' = 114..1)
 */
function getSurahList(order = 'asc') {
  const dir = order === 'desc' ? -1 : 1;
  return SURAH_INDEX.map((s) => ({
    ...s,
    revelation_order: REVELATION_MAP[s.id] || s.id,
    url: `${QURAN_BASE_URL}/${s.slug}`
  })).sort((a, b) => (a.id - b.id) * dir);
}

/**
 * Mengambil detail Surah beserta seluruh ayatnya (Arab, Latin, Terjemahan)
 * @param {string|number} surahSlugOrNumber Nomor surah (1-114) atau slug (contoh: 'yasin', 'al-fatihah')
 */
async function getSurahDetail(surahSlugOrNumber) {
  let slug = String(surahSlugOrNumber).toLowerCase().trim();
  if (/^\d+$/.test(slug)) {
    const num = parseInt(slug, 10);
    const found = SURAH_INDEX.find((s) => s.id === num);
    if (!found) throw new Error(`Surah dengan nomor ${num} tidak ditemukan (1-114)`);
    slug = found.slug;
  }

  const rsc = await fetchRSC(`${QURAN_BASE_URL}/${slug}`);
  const surahObj = findObjects(rsc, (o) => o.surah && o.surah.slug === slug)[0]?.surah;
  const versesObj = findObjects(rsc, (o) => Array.isArray(o.verses))[0]?.verses || [];

  return {
    surah: surahObj || SURAH_INDEX.find((s) => s.slug === slug),
    total_verses: versesObj.length,
    verses: versesObj
  };
}

/**
 * Mengambil detail spesifik 1 ayat dalam Surah (termasuk terjemahan multi-bahasa)
 * @param {string|number} surahSlugOrNumber Nomor surah atau slug
 * @param {number} verseNumber Nomor ayat
 */
async function getAyatDetail(surahSlugOrNumber, verseNumber) {
  let slug = String(surahSlugOrNumber).toLowerCase().trim();
  if (/^\d+$/.test(slug)) {
    const num = parseInt(slug, 10);
    const found = SURAH_INDEX.find((s) => s.id === num);
    if (!found) throw new Error(`Surah nomor ${num} tidak ditemukan`);
    slug = found.slug;
  }

  const rsc = await fetchRSC(`${QURAN_BASE_URL}/${slug}/${verseNumber}`);
  const match = findObjects(rsc, (o) => o.surah && o.verse)[0];
  if (!match) {
    throw new Error(`Ayat ${verseNumber} pada surah ${slug} tidak ditemukan`);
  }

  return {
    surah: match.surah,
    verse: match.verse,
    url: `${QURAN_BASE_URL}/${slug}/${verseNumber}`
  };
}

// ============================================================================
// 2. FITUR JUZ
// ============================================================================

/**
 * Mengambil daftar 30 Juz beserta pengelompokan Surah di dalamnya (sesuai tab Juz di quran.nu.or.id)
 * @param {'asc'|'desc'} order Urutan Juz ('asc' = 1..30, 'desc' = 30..1)
 */
function getJuzList(order = 'asc') {
  const groupsMap = new Map();
  for (let j = 1; j <= 30; j++) {
    groupsMap.set(j, {
      juz: j,
      url: `${QURAN_BASE_URL}/juz/${j}`,
      surahs: []
    });
  }

  for (const surah of SURAH_INDEX) {
    groupsMap.get(surah.juz_id).surahs.push({
      ...surah,
      url: `${QURAN_BASE_URL}/${surah.slug}`
    });
  }

  // Juz 2 (kelanjutan Al-Baqarah) dan Juz 5 (kelanjutan An-Nisa')
  if (groupsMap.get(2).surahs.length === 0) {
    const baqarah = SURAH_INDEX.find((s) => s.id === 2);
    groupsMap.get(2).surahs.push({ ...baqarah, url: `${QURAN_BASE_URL}/${baqarah.slug}` });
  }
  if (groupsMap.get(5).surahs.length === 0) {
    const annisa = SURAH_INDEX.find((s) => s.id === 4);
    groupsMap.get(5).surahs.push({ ...annisa, url: `${QURAN_BASE_URL}/${annisa.slug}` });
  }

  const list = Array.from(groupsMap.values());
  return order === 'desc' ? list.reverse() : list;
}

/**
 * Mengambil seluruh isi ayat di dalam suatu Juz (1-30) dari https://quran.nu.or.id/juz/:number
 * @param {number} juzNumber Nomor Juz (1 - 30)
 */
async function getJuzDetail(juzNumber) {
  const num = parseInt(juzNumber, 10);
  if (Number.isNaN(num) || num < 1 || num > 30) {
    throw new Error('Nomor Juz harus antara 1 sampai 30');
  }

  const rsc = await fetchRSC(`${QURAN_BASE_URL}/juz/${num}`);
  const rawItems = findObjects(rsc, (o) => o.verse && o.surah && o.anchorId);

  // Deduplikasi berdasarkan anchorId ("surahId-verseNumber")
  const seenAnchors = new Set();
  const verses = [];
  const surahsMap = new Map();

  for (const item of rawItems) {
    if (!seenAnchors.has(item.anchorId)) {
      seenAnchors.add(item.anchorId);
      verses.push({
        ...item.verse,
        surah_name: item.surah.name,
        surah_slug: item.surah.slug
      });
      if (!surahsMap.has(item.surah.id)) {
        surahsMap.set(item.surah.id, item.surah);
      }
    }
  }

  return {
    juz: num,
    url: `${QURAN_BASE_URL}/juz/${num}`,
    total_surahs: surahsMap.size,
    total_verses: verses.length,
    surahs: Array.from(surahsMap.values()),
    verses
  };
}

// ============================================================================
// 3. FITUR URUTAN TURUN (REVELATION ORDER)
// ============================================================================

/**
 * Mengambil daftar 114 Surah berdasarkan Urutan Turun (Nuzulul Qur'an)
 * sesuai tab "Urutan Turun" di https://quran.nu.or.id/
 * @param {'asc'|'desc'} order 'asc' (1..114 dari Al-'Alaq) atau 'desc' (114..1 dari An-Nashr)
 */
function getUrutanTurun(order = 'asc') {
  const dir = order === 'desc' ? -1 : 1;
  return SURAH_INDEX.map((s) => ({
    revelation_order: REVELATION_MAP[s.id] ?? s.id,
    ...s,
    url: `${QURAN_BASE_URL}/${s.slug}`
  })).sort((a, b) => (a.revelation_order - b.revelation_order) * dir);
}

// ============================================================================
// 4. FITUR TAHLIL
// ============================================================================

/**
 * Mengambil bacaan lengkap Tahlil & Doa Arwah dari https://quran.nu.or.id/tahlil
 */
async function getTahlil() {
  const rsc = await fetchRSC(`${QURAN_BASE_URL}/tahlil`);
  const verseHolders = findObjects(rsc, (o) => o.verse && o.verse.text && o.verse.number);

  const seen = new Set();
  const items = [];
  for (const holder of verseHolders) {
    const v = holder.verse;
    if (!seen.has(v.number)) {
      seen.add(v.number);
      items.push({
        id: v.id,
        number: v.number,
        arabic: stripHtml(v.text),
        arabic_html: v.text,
        latin: stripHtml(v.transliteration),
        translation: stripHtml(v.translation_id)
      });
    }
  }

  items.sort((a, b) => a.number - b.number);

  return {
    title: 'Tahlil & Doa Arwah',
    url: `${QURAN_BASE_URL}/tahlil`,
    total_items: items.length,
    items
  };
}

// ============================================================================
// 5. FITUR DOA
// ============================================================================

/**
 * Helper internal untuk mengekstrak daftar kartu kategori dari halaman indeks (/doa, /wirid, /maulid)
 */
function extractCategoryCards(rsc, prefix) {
  const cards = findObjects(
    rsc,
    (o) => typeof o.href === 'string' && o.href.startsWith(`/${prefix}/`) && o.title
  );

  const seen = new Set();
  const results = [];

  for (const card of cards) {
    if (seen.has(card.href)) continue;
    seen.add(card.href);

    // Cari angka jumlah bacaan di dalam children card
    const countNodes = findObjects(
      card,
      (o) => Array.isArray(o.children) && typeof o.children[0] === 'number'
    );
    const total = countNodes[0]?.children?.[0] ?? null;
    const slug = card.href.replace(`/${prefix}/`, '');

    results.push({
      title: card.title,
      slug,
      total_items: total,
      url: `${QURAN_BASE_URL}${card.href}`
    });
  }

  return results;
}

/**
 * Mengambil daftar kategori Doa dari https://quran.nu.or.id/doa
 */
async function getDoaCategories() {
  const rsc = await fetchRSC(`${QURAN_BASE_URL}/doa`);
  const categories = extractCategoryCards(rsc, 'doa');
  return {
    title: 'Kumpulan Doa Harian Arab, Latin, dan Terjemah',
    url: `${QURAN_BASE_URL}/doa`,
    total_categories: categories.length,
    categories
  };
}

/**
 * Mengambil seluruh daftar doa beserta bacaannya di dalam 1 kategori Doa
 * @param {string} categorySlug Contoh: 'doa-keseharian', 'doa-rezeki', 'doa-tolak-bala'
 */
async function getDoaByCategory(categorySlug) {
  const cleanSlug = categorySlug.replace(/^\/?doa\//, '');
  const url = `${QURAN_BASE_URL}/doa/${cleanSlug}`;
  const rsc = await fetchRSC(url);

  const sectionsHolder = findObjects(rsc, (o) => Array.isArray(o.sections))[0];
  const sections = (sectionsHolder?.sections || []).map((sec) => ({
    id: sec.id,
    name: sec.name,
    slug: sec.slug,
    category_name: sec.parent_name,
    category_slug: sec.parent_slug,
    description: sec.description,
    url: `${QURAN_BASE_URL}/doa/${cleanSlug}/${sec.slug}`,
    content: (sec.content || []).map((c) => ({
      id: c.id,
      order: c.order,
      arabic: stripHtml(c.arabic),
      latin: stripHtml(c.transliteration),
      translation: stripHtml(c.translate)
    }))
  }));

  return {
    category_slug: cleanSlug,
    category_name: sections[0]?.category_name || cleanSlug,
    url,
    total_doa: sections.length,
    items: sections
  };
}

/**
 * Mengambil 1 bacaan Doa spesifik berdasarkan kategori dan slug doa
 * @param {string} categorySlug Contoh: 'doa-keseharian'
 * @param {string} itemSlug Contoh: 'doa-masuk-rumah'
 */
async function getDoaDetail(categorySlug, itemSlug) {
  const catData = await getDoaByCategory(categorySlug);
  const found = catData.items.find((i) => i.slug === itemSlug);
  if (!found) {
    throw new Error(`Doa '${itemSlug}' tidak ditemukan pada kategori '${categorySlug}'`);
  }
  return found;
}

// ============================================================================
// 6. FITUR WIRID
// ============================================================================

/**
 * Mengambil daftar kategori Wirid dari https://quran.nu.or.id/wirid
 */
async function getWiridCategories() {
  const rsc = await fetchRSC(`${QURAN_BASE_URL}/wirid`);
  const categories = extractCategoryCards(rsc, 'wirid');
  return {
    title: 'Kumpulan Bacaan Wirid Lengkap Arab, Latin dan Terjemah',
    url: `${QURAN_BASE_URL}/wirid`,
    total_categories: categories.length,
    categories
  };
}

/**
 * Mengambil seluruh bacaan Wirid di dalam suatu kategori
 * @param {string} categorySlug Contoh: 'wirid-harian', 'shalawat', 'ratib', 'hizib', 'munajat'
 */
async function getWiridByCategory(categorySlug) {
  const cleanSlug = categorySlug.replace(/^\/?wirid\//, '');
  const url = `${QURAN_BASE_URL}/wirid/${cleanSlug}`;
  const rsc = await fetchRSC(url);

  const sectionsHolder = findObjects(rsc, (o) => Array.isArray(o.sections))[0];
  const sections = (sectionsHolder?.sections || []).map((sec) => ({
    id: sec.id,
    name: sec.name,
    slug: sec.slug,
    category_name: sec.parent_name,
    category_slug: sec.parent_slug,
    description: sec.description,
    url: `${QURAN_BASE_URL}/wirid/${cleanSlug}/${sec.slug}`,
    content: (sec.content || []).map((c) => ({
      id: c.id,
      order: c.order,
      arabic: stripHtml(c.arabic),
      latin: stripHtml(c.transliteration),
      translation: stripHtml(c.translate)
    }))
  }));

  return {
    category_slug: cleanSlug,
    category_name: sections[0]?.category_name || cleanSlug,
    url,
    total_wirid: sections.length,
    items: sections
  };
}

/**
 * Mengambil detail 1 bacaan Wirid spesifik
 * @param {string} categorySlug Contoh: 'shalawat'
 * @param {string} itemSlug Contoh: 'shalawat-nariyah'
 */
async function getWiridDetail(categorySlug, itemSlug) {
  const catData = await getWiridByCategory(categorySlug);
  const found = catData.items.find((i) => i.slug === itemSlug);
  if (!found) {
    throw new Error(`Wirid '${itemSlug}' tidak ditemukan pada kategori '${categorySlug}'`);
  }
  return found;
}

// ============================================================================
// 7. FITUR MAULID
// ============================================================================

/**
 * Mengambil daftar 7 Kitab Maulid dari https://quran.nu.or.id/maulid
 */
async function getMaulidList() {
  const rsc = await fetchRSC(`${QURAN_BASE_URL}/maulid`);
  const items = extractCategoryCards(rsc, 'maulid');
  return {
    title: 'Kumpulan Bacaan Maulid Lengkap Arab, Latin dan Terjemah',
    url: `${QURAN_BASE_URL}/maulid`,
    total_maulid: items.length,
    items
  };
}

/**
 * Mengambil seluruh bacaan / bagian rawi dari sebuah Kitab Maulid
 * @param {string} maulidSlug Contoh: 'maulid-dibai', 'maulidul-barzanji', 'maulid-simthud-duror', 'qasidah-burdah'
 */
async function getMaulidDetail(maulidSlug) {
  const cleanSlug = maulidSlug.replace(/^\/?maulid\//, '');
  const url = `${QURAN_BASE_URL}/maulid/${cleanSlug}`;
  const rsc = await fetchRSC(url);

  const sectionsHolder = findObjects(rsc, (o) => Array.isArray(o.sections))[0];
  const sections = (sectionsHolder?.sections || []).map((sec) => ({
    id: sec.id,
    name: sec.name,
    slug: sec.slug,
    maulid_name: sec.parent_name,
    maulid_slug: sec.parent_slug,
    description: sec.description,
    url: `${QURAN_BASE_URL}/maulid/${cleanSlug}/${sec.slug}`,
    content: (sec.content || []).map((c) => ({
      id: c.id,
      order: c.order,
      arabic: stripHtml(c.arabic),
      latin: stripHtml(c.transliteration),
      translation: stripHtml(c.translate)
    }))
  }));

  return {
    maulid_slug: cleanSlug,
    maulid_name: sections[0]?.maulid_name || cleanSlug,
    url,
    total_sections: sections.length,
    sections
  };
}

// ============================================================================
// 8. FITUR HADITS (https://hadits.nu.or.id/)
// ============================================================================

/**
 * Mengambil daftar 22 Kitab Hadits dari https://hadits.nu.or.id/
 */
async function getHaditsKitabList() {
  const rsc = await fetchRSC(`${HADITS_BASE_URL}/`);
  const holder = findObjects(rsc, (o) => Array.isArray(o.kitabs))[0];
  const kitabs = (holder?.kitabs || []).map((k) => ({
    ...k,
    url: `${HADITS_BASE_URL}/${k.slug}`
  }));

  return {
    title: 'Koleksi Kitab Hadits NU Online',
    url: HADITS_BASE_URL,
    total_kitabs: kitabs.length,
    kitabs
  };
}

/**
 * Mengambil daftar bab (chapters) atau daftar hadits dari suatu Kitab Hadits
 * @param {string} kitabSlug Contoh: 'arbaun-nawawiyah', '40-hadits-prinsip-nu', 'shahih-bukhari'
 * @param {number} page Nomor halaman (default 1)
 */
async function getHaditsKitabDetail(kitabSlug, page = 1) {
  const url = `${HADITS_BASE_URL}/${kitabSlug}${page > 1 ? `?page=${page}` : ''}`;
  const rsc = await fetchRSC(url);

  const chaptersHolder = findObjects(rsc, (o) => Array.isArray(o.chapters))[0];
  const hadithHolders = findObjects(rsc, (o) => o.hadith && o.hadith.arabicText);

  const seenIds = new Set();
  const hadiths = [];
  for (const h of hadithHolders) {
    if (!seenIds.has(h.hadith.id)) {
      seenIds.add(h.hadith.id);
      hadiths.push({
        ...h.hadith,
        url: `${HADITS_BASE_URL}/${kitabSlug}/${h.hadith.number}`
      });
    }
  }

  return {
    kitab_slug: kitabSlug,
    page,
    url,
    chapters: (chaptersHolder?.chapters || []).map((ch) => ({
      ...ch,
      url: `${HADITS_BASE_URL}/${kitabSlug}/bab/${ch.number}`
    })),
    hadiths
  };
}

/**
 * Mengambil daftar hadits di dalam suatu Bab pada Kitab Hadits
 * @param {string} kitabSlug Contoh: 'shahih-bukhari'
 * @param {number} chapterNumber Nomor bab (contoh: 1)
 * @param {number} page Halaman (default: 1)
 */
async function getHaditsByChapter(kitabSlug, chapterNumber, page = 1) {
  const url = `${HADITS_BASE_URL}/${kitabSlug}/bab/${chapterNumber}${page > 1 ? `?page=${page}` : ''}`;
  const rsc = await fetchRSC(url);
  const hadithHolders = findObjects(rsc, (o) => o.hadith && o.hadith.arabicText);

  const seenIds = new Set();
  const hadiths = [];
  for (const h of hadithHolders) {
    if (!seenIds.has(h.hadith.id)) {
      seenIds.add(h.hadith.id);
      hadiths.push({
        ...h.hadith,
        url: `${HADITS_BASE_URL}/${kitabSlug}/${h.hadith.number}`
      });
    }
  }

  return {
    kitab_slug: kitabSlug,
    chapter_number: chapterNumber,
    page,
    url,
    total_hadiths_on_page: hadiths.length,
    hadiths
  };
}

/**
 * Mengambil detail 1 Hadits spesifik berdasarkan slug kitab dan nomor hadits
 * @param {string} kitabSlug Contoh: 'arbaun-nawawiyah' atau 'shahih-bukhari'
 * @param {number} hadithNumber Nomor hadits (contoh: 1)
 */
async function getHaditsDetail(kitabSlug, hadithNumber) {
  const url = `${HADITS_BASE_URL}/${kitabSlug}/${hadithNumber}`;
  const rsc = await fetchRSC(url);
  const holder = findObjects(rsc, (o) => o.hadith && o.hadith.arabicText)[0];
  if (!holder) {
    throw new Error(`Hadits nomor ${hadithNumber} pada kitab ${kitabSlug} tidak ditemukan`);
  }
  return {
    ...holder.hadith,
    url
  };
}

// ============================================================================
// 9. FITUR JADWAL SHOLAT (Standar LFNU / Kemenag RI)
// ============================================================================

/**
 * Mengambil Jadwal Sholat berdasarkan nama kota/kabupaten dan tanggal.
 * Mencoba jadwalsholat.nu.or.id terlebih dahulu; jika terhalang Vercel Security
 * Checkpoint (HTTP 429), otomatis menggunakan fallback MyQuran Kemenag/LFNU & AlAdhan
 * dengan parameter hisab Indonesia (Subuh -20°, Isya -18°).
 *
 * @param {string} city Nama kota/kabupaten (contoh: 'Jakarta', 'Surabaya', 'Bandung')
 * @param {string} [dateStr] Format 'YYYY-MM-DD' (opsional, default hari ini)
 */
async function getJadwalSholat(city = 'Jakarta', dateStr = null) {
  const now = dateStr ? new Date(dateStr) : new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const formattedDate = `${yyyy}-${mm}-${dd}`;

  // 1. Coba akses langsung jadwalsholat.nu.or.id jika tidak terblokir Vercel Challenge
  try {
    const citySlug = `kota-${city.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    const directRes = await fetch(`${JADWAL_BASE_URL}/${citySlug}`, {
      headers: { ...DEFAULT_HEADERS, RSC: '1' }
    });
    if (directRes.ok) {
      const text = await directRes.text();
      if (text && !text.includes('Vercel Security Checkpoint')) {
        return {
          source: `${JADWAL_BASE_URL}/${citySlug}`,
          city,
          date: formattedDate,
          raw_rsc_length: text.length
        };
      }
    }
  } catch {
    // Lanjut ke fallback API
  }

  // 2. Fallback Pertama: API MyQuran (Data Resmi Bimas Islam Kemenag / Standar Hisab Indonesia)
  try {
    const searchRes = await fetch(
      `https://api.myquran.com/v2/sholat/kota/cari/${encodeURIComponent(city)}`,
      { headers: DEFAULT_HEADERS }
    );
    if (searchRes.ok) {
      const searchJson = await searchRes.json();
      const firstCity = searchJson?.data?.[0];
      if (firstCity?.id) {
        const schedRes = await fetch(
          `https://api.myquran.com/v2/sholat/jadwal/${firstCity.id}/${yyyy}/${mm}/${dd}`,
          { headers: DEFAULT_HEADERS }
        );
        if (schedRes.ok) {
          const schedJson = await schedRes.json();
          if (schedJson?.status && schedJson?.data?.jadwal) {
            const j = schedJson.data.jadwal;
            return {
              source: 'jadwalsholat.nu.or.id (via Kemenag/LFNU Hisab Provider)',
              reference_url: JADWAL_BASE_URL,
              method: 'Hisab LFNU / Kemenag RI (Subuh -20°, Isya -18°)',
              id_lokasi: schedJson.data.id,
              lokasi: schedJson.data.lokasi,
              daerah: schedJson.data.daerah,
              tanggal: j.tanggal,
              date: j.date || formattedDate,
              jadwal: {
                imsak: j.imsak,
                subuh: j.subuh,
                terbit: j.terbit,
                dhuha: j.dhuha,
                dzuhur: j.dzuhur,
                ashar: j.ashar,
                maghrib: j.maghrib,
                isya: j.isya
              }
            };
          }
        }
      }
    }
  } catch {
    // Lanjut ke fallback AlAdhan
  }

  // 3. Fallback Kedua: AlAdhan API (Method 20 = Kemenag / LFNU: Fajr 20°, Isha 18°)
  const aladhanUrl = `https://api.aladhan.com/v1/timingsByCity/${dd}-${mm}-${yyyy}?city=${encodeURIComponent(city)}&country=Indonesia&method=20`;
  const alRes = await fetch(aladhanUrl, { headers: DEFAULT_HEADERS });
  if (!alRes.ok) {
    throw new Error(`Gagal mengambil jadwal sholat untuk kota ${city}`);
  }
  const alJson = await alRes.json();
  const timings = alJson?.data?.timings || {};
  const hijri = alJson?.data?.date?.hijri || {};

  return {
    source: 'jadwalsholat.nu.or.id (via AlAdhan Method 20 - LFNU/Kemenag)',
    reference_url: JADWAL_BASE_URL,
    method: 'Lembaga Falakiyah PBNU / Kemenag RI (Subuh -20°, Isya -18°)',
    lokasi: city.toUpperCase(),
    date: formattedDate,
    hijriah: `${hijri.day || ''} ${hijri.month?.en || ''} ${hijri.year || ''} H`.trim(),
    jadwal: {
      imsak: timings.Imsak,
      subuh: timings.Fajr,
      terbit: timings.Sunrise,
      dhuha: timings.Sunrise,
      dzuhur: timings.Dhuhr,
      ashar: timings.Asr,
      maghrib: timings.Maghrib,
      isya: timings.Isha
    }
  };
}

// ============================================================================
// EXPORT MODUL
// ============================================================================
module.exports = {
  // 1. Surah
  getSurahList,
  getSurahDetail,
  getAyatDetail,
  // 2. Juz
  getJuzList,
  getJuzDetail,
  // 3. Urutan Turun
  getUrutanTurun,
  // 4. Tahlil
  getTahlil,
  // 5. Doa
  getDoaCategories,
  getDoaByCategory,
  getDoaDetail,
  // 6. Wirid
  getWiridCategories,
  getWiridByCategory,
  getWiridDetail,
  // 7. Maulid
  getMaulidList,
  getMaulidDetail,
  // 8. Hadits
  getHaditsKitabList,
  getHaditsKitabDetail,
  getHaditsByChapter,
  getHaditsDetail,
  // 9. Jadwal Sholat
  getJadwalSholat
};

// ============================================================================
// DEMO PENGGUNAAN (Dijalankan langsung jika dipanggil via `node quran_nu_scraper.js`)
// ============================================================================
if (require.main === module) {
  (async () => {
    try {
      console.log('==============================================================');
      console.log('   DEMO SCRAPER QURAN NU ONLINE (https://quran.nu.or.id/)');
      console.log('==============================================================\n');

      // 1. SURAH
      const surahs = getSurahList();
      const alFatihah = await getSurahDetail('al-fatihah');
      console.log(`1. [SURAH] Total Surah: ${surahs.length}`);
      console.log(
        `   Detail ${alFatihah.surah.name} (${alFatihah.surah.translate}) - ${alFatihah.total_verses} Ayat:`
      );
      console.log(`   Ayat 1: ${alFatihah.verses[0].text}`);
      console.log(`   Latin : ${alFatihah.verses[0].transliteration}`);
      console.log(`   Arti  : ${alFatihah.verses[0].translation_id}\n`);

      // 2. JUZ
      const juzList = getJuzList();
      const juz30 = await getJuzDetail(30);
      console.log(
        `2. [JUZ] Total Juz: ${juzList.length} | Juz 30 memiliki ${juz30.total_surahs} Surah & ${juz30.total_verses} Ayat`
      );
      console.log(
        `   Ayat pertama Juz 30 (${juz30.verses[0].surah_name}:1): ${juz30.verses[0].text}\n`
      );

      // 3. URUTAN TURUN
      const urutanTurun = getUrutanTurun();
      console.log(
        `3. [URUTAN TURUN] Wahyu ke-1: ${urutanTurun[0].name} (Surah ke-${urutanTurun[0].id}) | Wahyu ke-114: ${urutanTurun[113].name} (Surah ke-${urutanTurun[113].id})\n`
      );

      // 4. TAHLIL
      const tahlil = await getTahlil();
      console.log(`4. [TAHLIL] ${tahlil.title} - Total Bagian: ${tahlil.total_items}`);
      console.log(`   Bagian 1 (Arab) : ${tahlil.items[0].arabic}`);
      console.log(`   Bagian 1 (Latin): ${tahlil.items[0].latin}\n`);

      // 5. DOA
      const doaCats = await getDoaCategories();
      const doaHarian = await getDoaByCategory('doa-keseharian');
      console.log(
        `5. [DOA] Total Kategori: ${doaCats.total_categories} | Kategori '${doaHarian.category_name}': ${doaHarian.total_doa} doa`
      );
      console.log(
        `   Contoh (${doaHarian.items[0].name}): ${doaHarian.items[0].content[0].arabic}\n`
      );

      // 6. WIRID
      const wiridCats = await getWiridCategories();
      const shalawat = await getWiridDetail('shalawat', 'shalawat-nariyah');
      const shalawatBody = shalawat.content.find((c) => c.latin) || shalawat.content[0];
      console.log(
        `6. [WIRID] Total Kategori: ${wiridCats.total_categories} | Contoh: ${shalawat.name}`
      );
      console.log(`   Arab : ${shalawatBody.arabic}`);
      console.log(`   Latin: ${shalawatBody.latin}\n`);

      // 7. MAULID
      const maulidList = await getMaulidList();
      const diba = await getMaulidDetail('maulid-dibai');
      console.log(
        `7. [MAULID] Total Kitab Maulid: ${maulidList.total_maulid} | ${diba.maulid_name}: ${diba.total_sections} bagian`
      );
      console.log(`   Bagian 1: ${diba.sections[0].name}\n`);

      // 8. HADITS
      const haditsKitabs = await getHaditsKitabList();
      const arbaun = await getHaditsDetail('arbaun-nawawiyah', 1);
      console.log(
        `8. [HADITS] Total Kitab Hadits: ${haditsKitabs.total_kitabs} (${haditsKitabs.kitabs.slice(0, 4).map((k) => k.name).join(', ')}, ...)`
      );
      console.log(
        `   Contoh (${arbaun.kitab.name} #${arbaun.number}): ${arbaun.translation.slice(0, 140)}...\n`
      );

      // 9. JADWAL SHOLAT
      const jadwal = await getJadwalSholat('Jakarta');
      console.log(`9. [JADWAL SHOLAT] Lokasi: ${jadwal.lokasi} (${jadwal.tanggal || jadwal.date})`);
      console.log(`   Jadwal:`, JSON.stringify(jadwal.jadwal));
    } catch (err) {
      console.error('[Error]:', err.message);
      process.exitCode = 1;
    }
  })();
}
