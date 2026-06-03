import { currentLocale } from './i18n';

export const GENRE_MAP = {
  en: {
    28: 'Action',
    12: 'Adventure',
    16: 'Animation',
    35: 'Comedy',
    80: 'Crime',
    99: 'Documentary',
    18: 'Drama',
    10751: 'Family',
    14: 'Fantasy',
    36: 'History',
    27: 'Horror',
    10402: 'Music',
    9648: 'Mystery',
    10749: 'Romance',
    878: 'Science Fiction',
    10770: 'TV Movie',
    53: 'Thriller',
    10752: 'War',
    37: 'Western',
  },
  zh: {
    28: '動作',
    12: '冒險',
    16: '動畫',
    35: '喜劇',
    80: '犯罪',
    99: '紀錄片',
    18: '劇情',
    10751: '家庭',
    14: '奇幻',
    36: '歷史',
    27: '恐怖',
    10402: '音樂',
    9648: '懸疑',
    10749: '愛情',
    878: '科幻',
    10770: '電視電影',
    53: '驚悚',
    10752: '戰爭',
    37: '西部',
  },
  ms: {
    28: 'Aksi',
    12: 'Pengembaraan',
    16: 'Animasi',
    35: 'Komedi',
    80: 'Jenayah',
    99: 'Dokumentari',
    18: 'Drama',
    10751: 'Keluarga',
    14: 'Fantasi',
    36: 'Sejarah',
    27: 'Seram',
    10402: 'Muzik',
    9648: 'Misteri',
    10749: 'Romantik',
    878: 'Sains Fiksyen',
    10770: 'Filem TV',
    53: 'Ngeri',
    10752: 'Perang',
    37: 'Barat',
  },
};

export const GENRE_IDS = Object.keys(GENRE_MAP.en).map(Number);

const normalizeGenreKey = (value) =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s/_-]+/g, ' ')
    .replace(/\./g, '')
    .replace(/\s+/g, ' ');

const GENRE_ALIASES = {
  'sci fi': 878,
  'sci-fi': 878,
  'science fiction': 878,
  sf: 878,
  'tv movie': 10770,
};

const GENRE_LOOKUP = Object.entries(GENRE_MAP.en).reduce((acc, [id, label]) => {
  acc[normalizeGenreKey(id)] = Number(id);
  acc[normalizeGenreKey(label)] = Number(id);

  const localizedLabels = [GENRE_MAP.zh?.[id], GENRE_MAP.ms?.[id]];
  localizedLabels.forEach((localizedLabel) => {
    if (localizedLabel) {
      acc[normalizeGenreKey(localizedLabel)] = Number(id);
    }
  });

  return acc;
}, { ...GENRE_ALIASES });

export const resolveGenreId = (value) => {
  if (value === null || value === undefined || value === '') return null;

  const numeric = Number(value);
  if (Number.isFinite(numeric) && GENRE_MAP.en?.[numeric]) {
    return numeric;
  }

  const lookupKey = normalizeGenreKey(value);
  return GENRE_LOOKUP[lookupKey] ?? null;
};

export const getGenreName = (value) => {
  const resolvedId = resolveGenreId(value);
  if (!resolvedId) {
    return typeof value === 'string' && value.trim() ? value : 'Unknown';
  }

  const locale = currentLocale.value === 'zh' ? 'zh' : currentLocale.value === 'ms' ? 'ms' : 'en';
  return GENRE_MAP[locale]?.[resolvedId] || GENRE_MAP.en?.[resolvedId] || 'Unknown';
};
