import { ref, computed } from 'vue';
import { useMovies } from './useMovies';
import { useAppI18n } from '../utils/i18n';

export function useMovieDetails() {
    const { fetchMovieDetails, getImageURL, getLanguageName, getCertificate } = useMovies();
    const { t } = useAppI18n();

    const movie = ref(null);
    const isLoading = ref(false);
    const error = ref(null);

    const loadMovieDetails = async (id) => {
        isLoading.value = true;
        try {
            const data = await fetchMovieDetails(id);
            movie.value = data;
        } catch (err) {
            error.value = "Failed to load movie details.";
            console.error(err);
        } finally {
            isLoading.value = false;
        }
    };

    const writers = computed(() =>
        movie.value?.writers?.join(', ') || t('common.nA')
    );

    const director = computed(() => movie.value?.director || t('common.nA'));

    const formattedBudget = computed(() =>
        movie.value?.budget ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(movie.value.budget) : t('common.nA')
    );

    const formattedRevenue = computed(() =>
        movie.value?.revenue ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(movie.value.revenue) : t('common.nA')
    );

    const releaseYear = computed(() =>
        movie.value?.release_date ? new Date(movie.value.release_date).getFullYear() : t('common.nA')
    );

    const productionCountries = computed(() =>
        movie.value?.production_countries?.join(', ') || t('common.nA')
    );

    const status = computed(() => {
        if (!movie.value?.release_date) {
            return t('common.unknown');
        }

        const today = new Date();
        const releaseDate = new Date(movie.value.release_date);

        return releaseDate > today
            ? t('home.comingSoon')
            : t('home.nowShowing');
    });

    return {
        movie,
        isLoading,
        error,
        writers,
        director,
        formattedBudget,
        formattedRevenue,
        releaseYear,
        productionCountries,
        status,
        loadMovieDetails,
        getImageURL,
        getLanguageName,
        getCertificate
    };
}
