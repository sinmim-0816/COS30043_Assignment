import backendClient from "@/api/backendClient";
import { API_ENDPOINTS } from "@/api/apiEndpoint";

export const movieRepository={
    getNowShowing(page=1, limit=20){
        return backendClient.get(API_ENDPOINTS.NOW_SHOWING(page) + `&limit=${limit}`);
    },

    getComingSoon(page=1, limit=20){
        return backendClient.get(API_ENDPOINTS.COMING_SOON(page) + `&limit=${limit}`);
    },

    getMovieDetails(movieId){
        return backendClient.get(API_ENDPOINTS.MOVIE_DETAILS(movieId));
    },

    getAllMovies({
        page = 1,
        limit = 25,
        search = '',
        status = '',
        schedule = '',
        experience = '',
        genres = [],
        languages = [],
        ratings = [],
        minRating = '',
        maxRating = '',
        sortBy = 'default',
    } = {}){
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('limit', String(limit));

        if (search) {
            params.set('search', search);
        }

        if (status) {
            params.set('status', status);
        }

        if (schedule) {
            params.set('schedule', schedule);
        }

        if (experience) {
            params.set('experience', experience);
        }

        if (genres?.length) {
            params.set('genres', genres.join(','));
        }

        if (languages?.length) {
            params.set('languages', languages.join(','));
        }

        if (ratings?.length) {
            params.set('ratings', ratings.join(','));
        }

        if (minRating !== '' && minRating !== null && minRating !== undefined) {
            params.set('minRating', String(minRating));
        }

        if (maxRating !== '' && maxRating !== null && maxRating !== undefined) {
            params.set('maxRating', String(maxRating));
        }

        if (sortBy) {
            params.set('sortBy', sortBy);
        }

        return backendClient.get(`${API_ENDPOINTS.MOVIES}?${params.toString()}`);
    },

    getMovieShowtimes(movieId){
        return backendClient.get(API_ENDPOINTS.SHOWTIMES(movieId));
    },

};
