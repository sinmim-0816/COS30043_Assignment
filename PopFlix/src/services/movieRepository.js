import backendClient from "@/api/backendClient";
import { API_ENDPOINTS } from "@/api/apiEndpoint";

export const movieRepository={
    getNowShowing(page=1){
        return backendClient.get(API_ENDPOINTS.NOW_SHOWING(page));
    },

    getComingSoon(page=1){
        return backendClient.get(API_ENDPOINTS.COMING_SOON(page));
    },

    getMovieDetails(movieId){
        return backendClient.get(API_ENDPOINTS.MOVIE_DETAILS(movieId));
    },

    getAllMovies(){
        return backendClient.get(API_ENDPOINTS.MOVIES);
    },

    getMovieShowtimes(movieId){
        return backendClient.get(API_ENDPOINTS.SHOWTIMES(movieId));
    },

};