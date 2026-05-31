import { ref, computed } from 'vue';
import { useMovies } from './useMovies';

export function useMovieDetails() {
    const { fetchMovieDetails, getImageURL, getLanguageName, getCertificate } = useMovies();

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
        movie.value?.writers?.join(', ') || 'N/A'
    );

    const director = computed(() => movie.value?.director || 'N/A');

    const formattedBudget = computed(() =>
        movie.value?.budget ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(movie.value.budget) : 'N/A'
    );

    const formattedRevenue = computed(() =>
        movie.value?.revenue ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(movie.value.revenue) : 'N/A'
    );

    const releaseYear = computed(() =>
        movie.value?.release_date ? new Date(movie.value.release_date).getFullYear() : 'N/A'
    );

    const productionCountries = computed(() =>
        movie.value?.production_countries?.join(', ') || 'N/A'
    );

    const status = computed(() => {
        if (!movie.value?.release_date) {
            return 'Unknown';
        }

        const today = new Date();
        const releaseDate = new Date(movie.value.release_date);

        return releaseDate > today
            ? 'Coming Soon'
            : 'Now Showing';
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