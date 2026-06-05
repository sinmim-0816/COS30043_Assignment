import { ref } from 'vue';
import { movieRepository } from '../services/movieRepository';
import { IMAGE_BASE_URL } from '../api/client';
import { youtubeSearch } from '../api/client';
import { currentLocale, getTmdbLanguageCode } from '../utils/i18n';

const featuredMovies = ref([]);
const error = ref(null);
const isLoading = ref(true);
let isFetching = false;
const comingSoonMovies = ref([]);
const isComingSoonLoaded = ref(false);
const allMovies = ref([]);
const allMoviesMeta = ref({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 1,
    availableLanguages: [],
});
const allMoviesLoading = ref(false);

export function useMovies() {
    const getImageURL = (path) => path ? `${IMAGE_BASE_URL}${path}` : null;

    const formatRuntime = (minutes) => {
        const hours = Math.floor(minutes / 60);
        const min = minutes % 60;
        return `${hours}h ${min}m`;
    }

    const getLanguageName = (code) => {
        if (!code) {
            return 'Unknown';
        }
        const map = {
            'cn': 'zh',
            'tw': 'zh-Hant',
            'ms': 'ms',
            'en': 'en',
        };
        const cleanCode = map[code.toLowerCase()] || code;
        try {
            const locale = currentLocale.value === 'zh'
                ? 'zh-CN'
                : currentLocale.value === 'ms'
                    ? 'ms-MY'
                    : 'en';
            const displayNames = new Intl.DisplayNames([locale], { type: 'language' });
            return displayNames.of(cleanCode);
        } catch (err) {
            console.error("Error fetching language name:", err);
            return code;
        }
    };

    const fetchComingSoonMovies = async () => {
        if (isFetching || isComingSoonLoaded.value) return;

        isFetching = true;
        error.value = null;

        try {
            const tmdbLanguage = getTmdbLanguageCode();
            const res = await movieRepository.getComingSoon(1, 20, tmdbLanguage);
            const movies = res.data?.results || [];

            const enriched = await Promise.all(
                movies.map(async (m) => {
                    try {
                        const detailRes = await movieRepository.getMovieDetails(m.id, tmdbLanguage);
                        const d = detailRes.data.movie;

                        return {
                            id: m.id,
                            title: m.title,
                            poster: getImageURL(m.poster),
                            posters: d.posters || [],
                            backdrop: getImageURL(d.backdrop),
                            release_date: m.release_date,
                            vote_average: d.vote_average || 0,
                            language: d.language || "en",
                            overview: d.overview || "",
                            genres: d.genres || [],
                            actors: d.actors || [],
                            backdrops: d.backdrops || [],
                            runtime: formatRuntime(d.runtime || 0),
                            trailer: d.trailer,
                            experiences: d.experiences,
                            director: d.director,
                            popularity: d.popularity,
                            writers: d.writers,
                            production_companies: d.production_companies,
                            budget: d.budget,
                            revenue: d.revenue,
                        };
                    } catch (err) {
                        console.error("Coming Soon enrich failed:", m.id, err);

                        return {
                            id: m.id,
                            title: m.title,
                            poster: getImageURL(m.poster),
                            posters: [],
                            backdrop: null,
                            release_date: m.release_date,
                            vote_average: 0,
                            language: "en",
                            overview: "",
                            genres: [],
                            actors: [],
                            backdrops: [],
                            runtime: "0h 0m",
                            trailer: null,
                            experiences: null,
                            director: null,
                            popularity: null,
                            writers: null,
                            production_companies: null,
                            budget: null,
                            revenue: null,
                        };
                    }
                })
            );

            comingSoonMovies.value = enriched;
            isComingSoonLoaded.value = true;

        } catch (err) {
            error.value = "Failed to load coming soon movies";
            console.error(err);
        } finally {
            isFetching = false;
        }
    };

    // Inside useMovies.js

    const fetchAllMoviesPage = async (params = {}) => {
        // Destructure to set defaults for page/limit, while keeping the rest of the object
        const {
            page = 1,
            limit = 24
        } = params;

        error.value = null;
        allMoviesLoading.value = true;

        try {
            // Pass the entire params object directly to the repository
            // This ensures schedule, experience, genres, etc., are included
            const res = await movieRepository.getAllMovies(params);

            const payload = res.data || {};
            const results = payload.results || [];

            const localizedMovies = results.map((movie) => ({
                ...movie,
                poster: getImageURL(movie.poster),
                runtime: formatRuntime(movie.runtime || 0),
                genres: movie.genres || movie.genre_ids || [],
                experiences: movie.experiences || [],
            }));

            allMovies.value = localizedMovies;

            allMoviesMeta.value = {
                page: payload.page || page,
                limit: payload.limit || limit,
                total: payload.total || 0,
                totalPages: payload.totalPages || 1,
                availableLanguages: payload.availableLanguages || [],
            };

            return {
                movies: allMovies.value,
                meta: allMoviesMeta.value,
            };
        } catch (err) {
            error.value = "Failed to load movies. Please try again later.";
            console.error(err);

            allMovies.value = [];
            allMoviesMeta.value = {
                page,
                limit,
                total: 0,
                totalPages: 1,
                availableLanguages: [],
            };

            return {
                movies: [],
                meta: allMoviesMeta.value,
            };
        } finally {
            allMoviesLoading.value = false;
        }
    };

    const fetchHeroMovies = async () => {
        if (isFetching) return;

        error.value = null;
        isLoading.value = true;
        isFetching = true;

        try {
            const tmdbLanguage = getTmdbLanguageCode();
            const pages = await Promise.all([
                movieRepository.getNowShowing(1, 20, tmdbLanguage),
                movieRepository.getNowShowing(2, 20, tmdbLanguage),
                movieRepository.getNowShowing(3, 20, tmdbLanguage)
            ]);
            const allMovies = pages.flatMap(res => res.data?.results || []);
            const enrichedMovies = await Promise.all(
                allMovies.map(async (m) => {
                    try {
                        const res = await movieRepository.getMovieDetails(m.id, tmdbLanguage);
                        const d = res.data.movie;

                        return {
                            id: m.id,
                            title: m.title,
                            poster: getImageURL(m.poster),
                            posters: d.posters,
                            backdrop: getImageURL(d.backdrop),
                            release_date: m.release_date,
                            vote_average: d.vote_average,
                            language: d.language,
                            overview: d.overview,
                            genres: d.genres,
                            actors: d.actors,
                            backdrops: d.backdrops,
                            runtime: formatRuntime(d.runtime),
                            trailer: d.trailer,
                            experiences: d.experiences,
                            director: d.director,
                            popularity: d.popularity,
                            writers: d.writers,
                            production_companies: d.production_companies,
                            budget: d.budget,
                            revenue: d.revenue,
                        };
                    } catch (err) {
                        console.error("Failed to load movie detail:", m.id, err);

                        return {
                            id: m.id,
                            title: m.title,
                            poster: getImageURL(m.poster),
                            backdrop: null,
                            posters: null,
                            release_date: m.release_date,
                            vote_average: 0,
                            language: "en",
                            overview: "",
                            genres: [],
                            actors: null,
                            runtime: 0,
                            trailer: null,
                            experiences: null,
                            director: null,
                            popularity: null,
                            writers: null,
                            production_companies: null,
                            budget: null,
                            revenue: null,
                        };
                    }
                })
            );

            featuredMovies.value = enrichedMovies;

        } catch (err) {
            error.value = "Failed to load movies. Please try again later.";
            console.error(err);

        } finally {
            isFetching = false;
            isLoading.value = false;
        }
    };

    const getCertificate = (movie) => {
        if (!movie) return "U";
        if (movie.adult) return "18";
        const genreIds = movie.genre_ids || movie.genres?.map(g => g.id) || [];

        const matureGenres = ['27', '53', '80', '99'];
        const isMature = genreIds.some(id => matureGenres.includes(id));

        if (isMature || movie.vote_average > 7.5) {
            return "P13";
        }
        return "U";
    };

    const uniqueVideos = (videos) => {
        const map = new Map();

        for (const v of videos) {
            const uniqueKey = `${v.site}-${v.key}`;

            if (!map.has(uniqueKey)) {
                map.set(uniqueKey, v);
            }
        }

        return Array.from(map.values());
    };

    const youtubeCache = new Map();

    const getYouTubeVideos = async (movieTitle) => {
        if (!movieTitle) return [];

        if (youtubeCache.has(movieTitle)) {
            return youtubeCache.get(movieTitle);
        }

        const results = await youtubeSearch(
            `${movieTitle} teaser `
        );

        const mapped = results.map(video => ({
            id: video.id,
            key: video.key,
            name: video.title,
            type: video.type,
            site: video.site,
            isOfficial: false,
            thumbnail: video.thumbnail
        }));

        youtubeCache.set(movieTitle, mapped);
        return mapped;
    };
    const movieCache = new Map();

    const fetchMovieDetails = async (id) => {
        if (!id) {
            console.error("invalid id");
            return null;
        }
        const key = `${String(id)}:${getTmdbLanguageCode()}`;

        if (movieCache.has(key)) {
            return movieCache.get(key);
        }

        error.value = null;
        isLoading.value = true;

        try {
            const tmdbLanguage = getTmdbLanguageCode();
            const res = await movieRepository.getMovieDetails(id, tmdbLanguage);

            const details = res.data?.movie;

            if (!details || !details.title) {
                throw new Error("Invalid data received from TMDB");
            }
            const extractYoutubeId = (url) => {
                if (!url) return null;
                const match = url.match(/(?:v=|\/embed\/|youtu\.be\/)([^&?#/]+)/);
                return match ? match[1] : url;
            };

            const tmdbTrailers = details.trailer ? [{
                key: extractYoutubeId(details.trailer),
                name: "Official Trailer",
                site: "YouTube",
                type: "Trailer",
                isOfficial: true,
                thumbnail: `https://img.youtube.com/vi/${extractYoutubeId(details.trailer)}/mqdefault.jpg`
            }] : [];

            const youtubeVideos = await getYouTubeVideos(details.title);
            const combinedVideos = uniqueVideos([
                ...tmdbTrailers,
                ...youtubeVideos
            ]);
            const processedMovie = {
                ...details,
                runtime: formatRuntime(details.runtime || 0),
                poster: getImageURL(details.poster),
                posters: details.posters?.map(getImageURL) || [],
                actors: details.actors || [],
                experiences: details.experiences || [],
                allVideos: combinedVideos.slice(0, 5),
                trailer: details.trailer,
                popularity: details.popularity,
            };

            movieCache.set(key, processedMovie);
            return processedMovie;

        } catch (err) {
            console.error("Error in fetchMovieDetails:", err);
            error.value = "Could not load movie details.";
            return null;
        } finally {
            isLoading.value = false;
        }
    };


    return {
        featuredMovies,
        fetchHeroMovies,
        getImageURL,
        isLoading,
        getLanguageName,
        getCertificate,
        fetchMovieDetails,
        error,
        comingSoonMovies,
        fetchComingSoonMovies,
        allMovies,
        allMoviesMeta,
        allMoviesLoading,
        fetchAllMoviesPage,
    }
}
