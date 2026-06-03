import { computed, inject, ref } from 'vue';

const LOCALE_KEY = 'app_locale';
const DEFAULT_LOCALE = 'en';
const SUPPORTED_LOCALES = ['en', 'zh', 'ms'];
const LOCALE_SYMBOL = Symbol('popflix-i18n');

const messages = {
  en: {
    home: {
      watchTrailer: 'Watch Trailer',
      buyNow: 'Buy Now',
      movieShowtime: 'Movie Showtime',
      nowShowing: 'Now Showing',
      kids: 'Kids',
      comingSoon: 'Coming Soon',
      seeMore: 'See More',
      cinematicKeepsake: 'Craft Your Cinematic Keepsake',
      keepsakeDescription:
        'Don\'t just watch the movie, own the memory. After booking your showtime, unlock the ability to customize and design your own unique digital ticket to share and collect!',
      learnMore: 'Learn More',
    },
    profile: {
      displaySettings: 'Display Settings',
      textSizeDescription: 'Adjust the app text size for a more comfortable reading experience.',
      appLanguage: 'App Language',
      languageDescription: 'Choose the language used throughout the app.',
      languageEnglish: 'English',
      languageChinese: 'Chinese',
      languageMalay: 'Malay',
    },
    movieDetail: {
      watchTrailer: 'Watch Trailer',
      buyNow: 'Buy Now',
      remindMe: 'Remind Me',
      reminderSet: 'Reminder Set',
      rating: 'Rating',
      popularity: 'Popularity',
      nowProjecting: 'Now Projecting',
      officialPosters: 'Official Posters',
      trailersAndClips: 'Trailers & Clips',
      topBilledCast: 'Top Billed Cast',
      productionDetails: 'Production Details',
      director: 'Director',
      writers: 'Writers',
      originalLanguage: 'Original Language',
      productionCountries: 'Production Countries',
      budget: 'Budget',
      revenue: 'Revenue',
      status: 'Status',
      studios: 'Studios',
      cinephileReviews: 'Cinephile Reviews',
      recommended: 'RECOMMENDED',
      reviewed: 'REVIEWED',
      noReviews: 'No cinematic reviews logged under this profile record yet.',
      noShowtimes: 'No showtimes available for this movie yet.',
      overview: 'Overview',
    },
    common: {
      unknown: 'Unknown',
      nA: 'N/A',
    },
  },
  zh: {
    home: {
      watchTrailer: '观看预告片',
      buyNow: '立即购买',
      movieShowtime: '电影场次',
      nowShowing: '正在上映',
      kids: '儿童',
      comingSoon: '即将上映',
      seeMore: '查看更多',
      cinematicKeepsake: '打造你的电影纪念票',
      keepsakeDescription:
        '不只是看电影，更要收藏回忆。预订场次后，你可以自定义并设计独一无二的电子票，分享和收藏。',
      learnMore: '了解更多',
    },
    profile: {
      displaySettings: '显示设置',
      textSizeDescription: '调整应用文字大小，获得更舒适的阅读体验。',
      appLanguage: '应用语言',
      languageDescription: '选择整个应用的显示语言。',
      languageEnglish: '英语',
      languageChinese: '中文',
      languageMalay: '马来语',
    },
    movieDetail: {
      watchTrailer: '观看预告片',
      buyNow: '立即购买',
      remindMe: '提醒我',
      reminderSet: '已设置提醒',
      rating: '评分',
      popularity: '热度',
      nowProjecting: '正在放映',
      officialPosters: '官方海报',
      trailersAndClips: '预告片与片段',
      topBilledCast: '主要演员',
      productionDetails: '制作信息',
      director: '导演',
      writers: '编剧',
      originalLanguage: '原始语言',
      productionCountries: '制作国家',
      budget: '预算',
      revenue: '票房收入',
      status: '状态',
      studios: '制片公司',
      cinephileReviews: '影迷评论',
      recommended: '推荐',
      reviewed: '已评论',
      noReviews: '此账号下尚未记录任何影评。',
      noShowtimes: '此电影暂无场次。',
      overview: '简介',
    },
    common: {
      unknown: '未知',
      nA: '不适用',
    },
  },
  ms: {
    home: {
      watchTrailer: 'Tonton Treler',
      buyNow: 'Beli Sekarang',
      movieShowtime: 'Waktu Tayangan',
      nowShowing: 'Sedang Tayang',
      kids: 'Kanak-kanak',
      comingSoon: 'Akan Datang',
      seeMore: 'Lihat Lagi',
      cinematicKeepsake: 'Cipta Kenangan Tiket Sinematik Anda',
      keepsakeDescription:
        'Bukan sekadar menonton filem, simpan juga kenangannya. Selepas menempah masa tayangan, anda boleh menyesuaikan dan mereka bentuk tiket digital unik anda sendiri untuk dikongsi dan dikumpul.',
      learnMore: 'Ketahui Lagi',
    },
    profile: {
      displaySettings: 'Tetapan Paparan',
      textSizeDescription: 'Laraskan saiz teks aplikasi untuk pengalaman membaca yang lebih selesa.',
      appLanguage: 'Bahasa Aplikasi',
      languageDescription: 'Pilih bahasa yang digunakan dalam aplikasi.',
      languageEnglish: 'Inggeris',
      languageChinese: 'Cina',
      languageMalay: 'Bahasa Melayu',
    },
    movieDetail: {
      watchTrailer: 'Tonton Treler',
      buyNow: 'Beli Sekarang',
      remindMe: 'Ingatkan Saya',
      reminderSet: 'Peringatan Ditetapkan',
      rating: 'Penilaian',
      popularity: 'Populariti',
      nowProjecting: 'Sedang Dipaparkan',
      officialPosters: 'Poster Rasmi',
      trailersAndClips: 'Treler & Klip',
      topBilledCast: 'Pelakon Utama',
      productionDetails: 'Butiran Penerbitan',
      director: 'Pengarah',
      writers: 'Penulis',
      originalLanguage: 'Bahasa Asal',
      productionCountries: 'Negara Penerbitan',
      budget: 'Belanjawan',
      revenue: 'Pendapatan',
      status: 'Status',
      studios: 'Studio',
      cinephileReviews: 'Ulasan Peminat Filem',
      recommended: 'DISYORKAN',
      reviewed: 'DIULAS',
      noReviews: 'Tiada ulasan sinematik direkodkan di bawah profil ini lagi.',
      noShowtimes: 'Tiada waktu tayangan tersedia untuk filem ini.',
      overview: 'Gambaran',
    },
    common: {
      unknown: 'Tidak diketahui',
      nA: 'TIADA',
    },
  },
};

const localeLabels = {
  en: {
    en: 'English',
    zh: 'Chinese',
    ms: 'Malay',
  },
  zh: {
    en: '英语',
    zh: '中文',
    ms: '马来语',
  },
  ms: {
    en: 'Inggeris',
    zh: 'Cina',
    ms: 'Bahasa Melayu',
  },
};

const isBrowser = () => typeof window !== 'undefined' && typeof document !== 'undefined';

const normalizeLocale = (value) => {
  const next = String(value || '').toLowerCase();
  return SUPPORTED_LOCALES.includes(next) ? next : DEFAULT_LOCALE;
};

const getStoredLocale = () => {
  if (!isBrowser()) {
    return DEFAULT_LOCALE;
  }

  return normalizeLocale(localStorage.getItem(LOCALE_KEY));
};

export const currentLocale = ref(getStoredLocale());

const setDocumentLocale = (locale) => {
  if (!isBrowser()) return;

  const htmlLocale = locale === 'zh' ? 'zh-CN' : locale === 'ms' ? 'ms-MY' : 'en';
  document.documentElement.lang = htmlLocale;
};

export const applyLocalePreference = (value = DEFAULT_LOCALE) => {
  const normalized = normalizeLocale(value);
  currentLocale.value = normalized;

  if (isBrowser()) {
    localStorage.setItem(LOCALE_KEY, normalized);
    setDocumentLocale(normalized);
  }

  return normalized;
};

export const initLocalePreference = () => {
  applyLocalePreference(getStoredLocale());
};

export const setLocale = (value) => applyLocalePreference(value);

const resolveMessage = (locale, path) => {
  const segments = path.split('.');
  let cursor = messages[locale];

  for (const segment of segments) {
    cursor = cursor?.[segment];
    if (cursor === undefined) {
      return undefined;
    }
  }

  return cursor;
};

const interpolate = (template, params = {}) =>
  String(template).replace(/\{(\w+)\}/g, (_, key) => {
    const replacement = params[key];
    return replacement === undefined || replacement === null ? '' : String(replacement);
  });

export const t = (path, params = {}) => {
  const template =
    resolveMessage(currentLocale.value, path) ??
    resolveMessage(DEFAULT_LOCALE, path) ??
    path;

  if (typeof template !== 'string') {
    return String(template);
  }

  return interpolate(template, params);
};

export const getLocaleLabel = (value) => {
  const normalized = normalizeLocale(value);
  return localeLabels[currentLocale.value]?.[normalized] || localeLabels[DEFAULT_LOCALE]?.[normalized] || normalized;
};

export const getLocaleOptionLabel = (value) => {
  const normalized = normalizeLocale(value);
  return localeLabels[normalized]?.[normalized] || localeLabels[DEFAULT_LOCALE]?.[normalized] || normalized;
};

export const supportedLocales = SUPPORTED_LOCALES;

export const useAppI18n = () => ({
  locale: currentLocale,
  t,
  setLocale,
  getLocaleLabel,
  getLocaleOptionLabel,
  supportedLocales,
});

export const __i18nSymbol = LOCALE_SYMBOL;
