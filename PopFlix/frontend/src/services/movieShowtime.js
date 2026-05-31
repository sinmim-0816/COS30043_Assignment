import { API_ENDPOINTS } from "../api/apiEndpoint";
import backendClient from "../api/backendClient";

export const getMovieShowtimes = async (movie) => {
    if (!movie || !movie.id) {
        console.warn("Movie ID is undefined.");
        return [];
    }
    try {
        const response = await backendClient.post(API_ENDPOINTS.SHOWTIMES(movie.id), {
            popularity: movie.popularity,
            vote_average: movie.vote_average,
            runtime: movie.runtime,
            genre_ids: movie.genre_ids,
        });
        return response.data;
    } catch (err) {
        console.error("Showtime API Error:", err);
        return [];
    }
}

export const getAllShowtimes = async (cinemaId, date) => {
    if (!cinemaId || !date) return [];

    try {
        const response = await backendClient.get(API_ENDPOINTS.ALL_SHOWTIMES, {
            params: {
                cinemaId,
                date: date.toISOString()
            }
        });
        return response.data;
    } catch (err) {
        console.error("Bulk Showtime API Error:", err);
        return [];
    }
}

export const getShowtimeById = async (id) => {
    if (!id) {
        return null;
    }
    try {
        const response = await backendClient.get(API_ENDPOINTS.SINGLE_SHOWTIME(id));
        return response.data;
    } catch (err) {
        console.error("Error fetching single showtime.", err);
        return null;
    }
}