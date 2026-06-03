import { computed, inject, ref } from 'vue';

const LOCALE_KEY = 'app_locale';
const DEFAULT_LOCALE = 'en';
const SUPPORTED_LOCALES = ['en', 'zh', 'ms'];
const LOCALE_SYMBOL = Symbol('popflix-i18n');

const messages = {
  en: {
    common: {
      unknown: 'Unknown',
      nA: 'N/A',
      noSeatsSelected: 'No Seats Selected',
      loading: 'Loading...',
    },
    home: {
      all: 'All',
      watchTrailer: 'Watch Trailer',
      buyNow: 'Buy Now',
      remindMe: 'Remind Me',
      reminderSet: 'Reminder Set',
      moreInfo: 'More Info',
      movieShowtime: 'Movie Showtime',
      nowShowing: 'Now Showing',
      kids: 'Kids',
      comingSoon: 'Coming Soon',
      seeMore: 'See More',
      cinematicKeepsake: 'Craft Your Cinematic Keepsake',
      keepsakeDescription:
        "Don't just watch the movie, own the memory. After booking your showtime, unlock the ability to customize and design your own unique digital ticket to share and collect!",
      learnMore: 'Learn More',
      viewAllExperiences: 'View All Experiences',
      viewAll: 'View All',
      immersiveTitle: 'Immersive ways to watch your movie.',
    },
    topbar: {
      movies: 'Movies',
      showtimes: 'Showtimes',
      cinemas: 'Cinemas',
      customization: 'Customization',
      viewProfile: 'View Profile',
      myBookings: 'My Bookings',
      logOut: 'Log Out',
      register: 'Register',
      login: 'Login',
      notifications: 'View notifications',
      openMenu: 'Open menu',
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
      overview: 'Overview',
      synopsis: 'Synopsis',
      trailersAndClips: 'Trailers & Clips',
      nowProjecting: 'Now Projecting',
      topBilledCast: 'Top Billed Cast',
      officialPosters: 'Official Posters',
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
    },
    allMovies: {
      title: 'Explore Big Screens',
      all: 'ALL',
      searchPlaceholder: 'Search movies...',
      filterBy: 'Filter-By',
      noMoviesFound: 'No movies found',
      noMoviesHint: 'Try adjusting your filters or checking a different experience.',
      movieInfo: 'More Info',
      selectExperience: 'Select Experience:',
      stars: 'Stars',
      buyNow: 'Buy Now',
      remindMe: 'Remind Me',
      loading: 'Loading...',
    },
    allShowtimes: {
      title: 'Movie Showtimes',
      selectTheatre: 'Select your Theatre:',
      selectCinema: 'Select a Cinema:',
      selectDate: 'Select Date:',
      filterBy: 'Filter-By',
      movieInfo: 'Movie Info',
      selectExperience: 'Select Experience:',
      noShowtimesFound: 'No showtimes found for this selection.',
      noShowtimesHint: 'Try selecting a different cinema or date.',
      loading: 'Loading...',
      selectTime: 'Select a time:',
      stars: 'Stars',
    },
    checkoutPayment: {
      title: 'Checkout Payment',
      loadingSelection: 'Loading Selection...',
      seats: 'Seats',
      bookingId: 'Booking ID',
      parkingSpot: 'Parking Spot',
      subtotalCost: 'Subtotal Cost',
      bookingServiceFee: 'Booking Service Fee',
      smartParkingStall: 'Smart Parking Stall',
      total: 'Total',
      gstInclusive: 'GST (10%) Inclusive Mapping',
      information: 'Information',
      payment: 'Payment',
      confirmation: 'Confirmation',
      timerLeft: 'Timer Left',
      enterPaymentDetails: 'Enter Payment Details',
      paymentDescription: 'Select a routing transaction pipeline method to proceed.',
      selectMethod: 'Select Method:',
      debitCreditCard: 'Debit / Credit Card',
      virtualAccount: 'Virtual Account',
      cardInformation: 'Card Information *',
      expiryDate: 'Expiry Date *',
      cvcCvv: 'CVC / CVV *',
      cardholderName: 'Cardholder Name *',
      fpxTitle: 'FPX Automated Online Banking System',
      fpxDescription:
        'A secure multi-bank gateway redirect authorization routing node will initialize upon submission confirmation step.',
      saveInfo:
        'Securely save my information for 1-click checkout via Stripe Elements encryption.',
      saveInfoHint:
        'Tokenize account hashes across local session instances securely.',
      payNow: 'Pay Now',
      securedBy: 'Secured & Protected by',
      bookingConfirmed: 'Booking Confirmed',
      paymentReceived: 'Payment received and seats are now secured.',
      officialTicketReceipt: 'Official Ticket Receipt',
      paid: 'Paid',
      bookingReference: 'Booking Reference',
      paymentMethod: 'Payment Method',
      totalPaid: 'Total Paid',
      transactionId: 'Transaction ID',
      viewTicket: 'View Ticket',
      cardStripe: 'Card (Stripe)',
      memberDiscount: '{tier} Member Discount (-{percent}%)',
      free: 'FREE',
      inclusive: 'INCLUSIVE',
      reservationExpired:
        'The 8-minute reservation timeout window expired. Your locked items have been freed.',
      invalidCard:
        'Invalid card configuration layout. Please use a standard 16-digit number string.',
    },
  },
  zh: {
    common: {
      unknown: '未知',
      nA: '不適用',
      noSeatsSelected: '未選擇座位',
      loading: '載入中...',
    },
    home: {
      all: '全部',
      watchTrailer: '觀看預告片',
      buyNow: '立即購買',
      remindMe: '提醒我',
      reminderSet: '已設定提醒',
      moreInfo: '更多資訊',
      movieShowtime: '電影場次',
      nowShowing: '正在上映',
      kids: '兒童',
      comingSoon: '即將上映',
      seeMore: '查看更多',
      cinematicKeepsake: '打造你的電影紀念票',
      keepsakeDescription:
        '不只是看電影，更要收藏回憶。預訂場次後，你可以自訂並設計獨一無二的電子票，分享和收藏。',
      learnMore: '了解更多',
      viewAllExperiences: '查看所有體驗',
      viewAll: '查看全部',
      immersiveTitle: '沉浸式觀影方式。',
    },
    topbar: {
      movies: '電影',
      showtimes: '場次',
      cinemas: '影院',
      customization: '自訂',
      viewProfile: '查看資料',
      myBookings: '我的訂票',
      logOut: '登出',
      register: '註冊',
      login: '登入',
      notifications: '查看通知',
      openMenu: '打開選單',
    },
    profile: {
      displaySettings: '顯示設定',
      textSizeDescription: '調整應用文字大小，獲得更舒適的閱讀體驗。',
      appLanguage: '應用語言',
      languageDescription: '選擇整個應用的顯示語言。',
      languageEnglish: '英語',
      languageChinese: '中文',
      languageMalay: '馬來語',
    },
    movieDetail: {
      watchTrailer: '觀看預告片',
      buyNow: '立即購買',
      remindMe: '提醒我',
      reminderSet: '已設定提醒',
      rating: '評分',
      popularity: '熱度',
      overview: '簡介',
      synopsis: '簡介',
      trailersAndClips: '預告與片段',
      nowProjecting: '正在放映',
      topBilledCast: '主要演員',
      officialPosters: '官方海報',
      productionDetails: '製作資訊',
      director: '導演',
      writers: '編劇',
      originalLanguage: '原始語言',
      productionCountries: '製作國家',
      budget: '預算',
      revenue: '票房收入',
      status: '狀態',
      studios: '製作公司',
      cinephileReviews: '影迷評論',
      recommended: '推薦',
      reviewed: '已評論',
      noReviews: '此帳號下尚未記錄任何影評。',
      noShowtimes: '此電影目前沒有場次。',
    },
    allMovies: {
      title: '探索大銀幕',
      all: '全部',
      searchPlaceholder: '搜尋電影...',
      filterBy: '篩選',
      noMoviesFound: '沒有找到電影',
      noMoviesHint: '試著調整篩選條件，或切換其他體驗。',
      movieInfo: '更多資訊',
      selectExperience: '選擇體驗：',
      stars: '顆星',
      buyNow: '立即購買',
      remindMe: '提醒我',
      loading: '載入中...',
    },
    allShowtimes: {
      title: '電影場次',
      selectTheatre: '選擇影院：',
      selectCinema: '選擇影院：',
      selectDate: '選擇日期：',
      filterBy: '篩選',
      movieInfo: '電影資訊',
      selectExperience: '選擇體驗：',
      noShowtimesFound: '此選擇沒有場次。',
      noShowtimesHint: '請選擇其他影院或日期。',
      loading: '載入中...',
      selectTime: '選擇時間：',
      stars: '顆星',
    },
    checkoutPayment: {
      title: '結帳付款',
      loadingSelection: '正在載入選擇...',
      seats: '座位',
      bookingId: '訂單編號',
      parkingSpot: '停車位',
      subtotalCost: '小計',
      bookingServiceFee: '訂票服務費',
      smartParkingStall: '智慧停車位',
      total: '總計',
      gstInclusive: '含 GST (10%)',
      information: '資訊',
      payment: '付款',
      confirmation: '確認',
      timerLeft: '剩餘時間',
      enterPaymentDetails: '輸入付款資料',
      paymentDescription: '請選擇付款管線方式以繼續。',
      selectMethod: '選擇方式：',
      debitCreditCard: '金融 / 信用卡',
      virtualAccount: '虛擬帳號',
      cardInformation: '卡片資訊 *',
      expiryDate: '有效期限 *',
      cvcCvv: 'CVC / CVV *',
      cardholderName: '持卡人姓名 *',
      fpxTitle: 'FPX 自動網路銀行系統',
      fpxDescription:
        '提交確認後，安全的多銀行閘道重新導向授權流程將會啟動。',
      saveInfo:
        '安全儲存我的資訊，透過 Stripe Elements 加密進行一鍵結帳。',
      saveInfoHint:
        '在本地工作階段中安全地將帳號雜湊值代幣化。',
      payNow: '立即付款',
      securedBy: '安全保護由',
      bookingConfirmed: '訂單已確認',
      paymentReceived: '款項已收到，座位已鎖定。',
      officialTicketReceipt: '正式票據收據',
      paid: '已付款',
      bookingReference: '訂單參考',
      paymentMethod: '付款方式',
      totalPaid: '付款總額',
      transactionId: '交易編號',
      viewTicket: '查看票券',
      cardStripe: '卡片 (Stripe)',
      memberDiscount: '{tier} 會員折扣 (-{percent}%)',
      free: '免費',
      inclusive: '包含',
      reservationExpired: '8 分鐘保留時限已到期。您鎖定的項目已釋放。',
      invalidCard: '卡片格式無效。請使用標準的 16 位數字。',
    },
  },
  ms: {
    common: {
      unknown: 'Tidak diketahui',
      nA: 'TIADA',
      noSeatsSelected: 'Tiada Tempat Duduk Dipilih',
      loading: 'Memuatkan...',
    },
    home: {
      all: 'Semua',
      watchTrailer: 'Tonton Treler',
      buyNow: 'Beli Sekarang',
      remindMe: 'Ingatkan Saya',
      reminderSet: 'Peringatan Ditetapkan',
      moreInfo: 'Maklumat Lanjut',
      movieShowtime: 'Waktu Tayangan',
      nowShowing: 'Sedang Tayang',
      kids: 'Kanak-kanak',
      comingSoon: 'Akan Datang',
      seeMore: 'Lihat Lagi',
      cinematicKeepsake: 'Cipta Kenangan Tiket Sinematik Anda',
      keepsakeDescription:
        'Bukan sekadar menonton filem, simpan juga kenangannya. Selepas menempah masa tayangan, anda boleh menyesuaikan dan mereka bentuk tiket digital unik anda sendiri untuk dikongsi dan dikumpul.',
      learnMore: 'Ketahui Lagi',
      viewAllExperiences: 'Lihat Semua Pengalaman',
      viewAll: 'Lihat Semua',
      immersiveTitle: 'Cara imersif untuk menonton filem anda.',
    },
    topbar: {
      movies: 'Filem',
      showtimes: 'Waktu Tayangan',
      cinemas: 'Pawagam',
      customization: 'Penyesuaian',
      viewProfile: 'Lihat Profil',
      myBookings: 'Tempahan Saya',
      logOut: 'Log Keluar',
      register: 'Daftar',
      login: 'Log Masuk',
      notifications: 'Lihat notifikasi',
      openMenu: 'Buka menu',
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
      overview: 'Gambaran',
      synopsis: 'Sinopsis',
      trailersAndClips: 'Treler & Klip',
      nowProjecting: 'Sedang Dipaparkan',
      topBilledCast: 'Pelakon Utama',
      officialPosters: 'Poster Rasmi',
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
    },
    allMovies: {
      title: 'Teroka Skrin Besar',
      all: 'SEMUA',
      searchPlaceholder: 'Cari filem...',
      filterBy: 'Tapis',
      noMoviesFound: 'Tiada filem ditemui',
      noMoviesHint: 'Cuba ubah penapis anda atau semak pengalaman yang lain.',
      movieInfo: 'Maklumat Lanjut',
      selectExperience: 'Pilih Pengalaman:',
      stars: 'Bintang',
      buyNow: 'Beli Sekarang',
      remindMe: 'Ingatkan Saya',
      loading: 'Memuatkan...',
    },
    allShowtimes: {
      title: 'Waktu Tayangan Filem',
      selectTheatre: 'Pilih pawagam anda:',
      selectCinema: 'Pilih Pawagam:',
      selectDate: 'Pilih Tarikh:',
      filterBy: 'Tapis',
      movieInfo: 'Maklumat Filem',
      selectExperience: 'Pilih Pengalaman:',
      noShowtimesFound: 'Tiada waktu tayangan ditemui untuk pilihan ini.',
      noShowtimesHint: 'Cuba pilih pawagam atau tarikh yang lain.',
      loading: 'Memuatkan...',
      selectTime: 'Pilih masa:',
      stars: 'Bintang',
    },
    checkoutPayment: {
      title: 'Daftar Keluar & Bayar',
      loadingSelection: 'Memuatkan pilihan...',
      seats: 'Tempat duduk',
      bookingId: 'ID Tempahan',
      parkingSpot: 'Petak Parkir',
      subtotalCost: 'Jumlah Kecil',
      bookingServiceFee: 'Yuran Perkhidmatan Tempahan',
      smartParkingStall: 'Petak Parkir Pintar',
      total: 'Jumlah',
      gstInclusive: 'Pemetaan termasuk GST (10%)',
      information: 'Maklumat',
      payment: 'Pembayaran',
      confirmation: 'Pengesahan',
      timerLeft: 'Baki Masa',
      enterPaymentDetails: 'Masukkan Butiran Pembayaran',
      paymentDescription: 'Pilih kaedah saluran transaksi untuk meneruskan.',
      selectMethod: 'Pilih Kaedah:',
      debitCreditCard: 'Kad Debit / Kredit',
      virtualAccount: 'Akaun Maya',
      cardInformation: 'Maklumat Kad *',
      expiryDate: 'Tarikh Luput *',
      cvcCvv: 'CVC / CVV *',
      cardholderName: 'Nama Pemegang Kad *',
      fpxTitle: 'Sistem Perbankan Dalam Talian Automatik FPX',
      fpxDescription:
        'Gerbang multi-bank yang selamat akan memulakan penghalaan kebenaran selepas pengesahan dihantar.',
      saveInfo:
        'Simpan maklumat saya dengan selamat untuk daftar keluar satu klik melalui penyulitan Stripe Elements.',
      saveInfoHint:
        'Tokenkan cincangan akaun merentas sesi tempatan dengan selamat.',
      payNow: 'Bayar Sekarang',
      securedBy: 'Dilindungi oleh',
      bookingConfirmed: 'Tempahan Disahkan',
      paymentReceived: 'Pembayaran diterima dan tempat duduk kini disahkan.',
      officialTicketReceipt: 'Resit Rasmi Tiket',
      paid: 'Dibayar',
      bookingReference: 'Rujukan Tempahan',
      paymentMethod: 'Kaedah Pembayaran',
      totalPaid: 'Jumlah Dibayar',
      transactionId: 'ID Transaksi',
      viewTicket: 'Lihat Tiket',
      cardStripe: 'Kad (Stripe)',
      memberDiscount: '{tier} Diskaun Ahli (-{percent}%)',
      free: 'PERCUMA',
      inclusive: 'TERMASUK',
      reservationExpired:
        'Tetingkap tamat tempoh tempahan 8 minit telah tamat. Item terkunci anda telah dibebaskan.',
      invalidCard:
        'Susun atur kad tidak sah. Sila gunakan nombor standard 16 digit.',
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
    en: '英語',
    zh: '中文',
    ms: '馬來語',
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
  return localeLabels[currentLocale.value]?.[normalized] || localeLabels[DEFAULT_LOCALE]?.[normalized] || normalized;
};

export const getTmdbLanguageCode = (value = currentLocale.value) => {
  const normalized = normalizeLocale(value);

  if (normalized === 'zh') return 'zh-CN';
  if (normalized === 'ms') return 'ms-MY';
  return 'en-US';
};

export const supportedLocales = SUPPORTED_LOCALES;

export const useAppI18n = () => ({
  locale: currentLocale,
  t,
  setLocale,
  getLocaleLabel,
  getLocaleOptionLabel,
  getTmdbLanguageCode,
  supportedLocales,
});

export const __i18nSymbol = LOCALE_SYMBOL;
