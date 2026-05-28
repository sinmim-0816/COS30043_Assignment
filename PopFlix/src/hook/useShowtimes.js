import { ref } from 'vue';
import { isSameDay } from 'date-fns';

// Import services
import { CinemaService } from '@/services/cinemaService';
import { getAllShowtimes, getShowtimeById } from '@/services/movieShowtime';

export function useShowtimes() {
    const cinemas = ref([]);
    const allSessions = ref([]);
    const isLoading = ref(false);
    const error = ref(null);
    const currentSession = ref(null);

    const loadInitialData = async () => {
        isLoading.value = true;
        try {
            const cinemaData = await CinemaService.getCinemas();
            cinemas.value = cinemaData;
            return cinemaData;
        } catch (err) {
            error.value = "Failed to fetch all cinemas.";
            return [];
        } finally {
            isLoading.value = false;
        }
    };

    const fetchAllShowtimes = async (cinemaId, date, movies) => {
        if (!cinemaId || !date) {
            return;
        }
        isLoading.value = true;
        try {
            const data = await getAllShowtimes(cinemaId, date, movies);
            allSessions.value = data;
        } catch (err) {
            error.value = "Failed to laod showtimes.";
        } finally {
            isLoading.value = false;
        }
    };

    const filterSessions = (movieId, cinemaId) => {
        return allSessions.value.filter(session =>
            String(session.movie_id) === String(movieId) &&
            String(session.cinema_id) === String(cinemaId)
        );
    };

    const fetchShowtimeById = async (showtimeId) => {
        if (!showtimeId) {
            return null;
        }
        isLoading.value = true;
        error.value = null;
        try {
            const data = await getShowtimeById(showtimeId);
            currentSession.value = data;
            return data;
        } catch (err) {
            console.error("Error in hook fetching showtime:", err);
            error.value = "Could not load session details.";
            return null;
        } finally {
            isLoading.value = false;
        }
    }

    return {
        cinemas,
        allSessions,
        isLoading,
        error,
        loadInitialData,
        fetchAllShowtimes,
        filterSessions,
        currentSession,
        fetchShowtimeById
    }
}
