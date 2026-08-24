const BASE_URL = "https://api.themoviedb.org/3";
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

const assertEnv = (keyName, value) => {
    if (!value) {
        throw new Error(`Missing required env variable: ${keyName}`);
    }
};

// ============================
// TMDB API CLIENT
// ============================
export const apiClient = async (endpoint, params = {}) => {
    assertEnv("VITE_TMDB_API_KEY", API_KEY);

    const queryParams = new URLSearchParams({
        api_key: API_KEY,
        language: "en-US",
        ...params
    });

    const response = await fetch(`${BASE_URL}${endpoint}?${queryParams}`);

    if (!response.ok) {
        throw new Error(`TMDB API Error: ${response.status}`);
    }

    return response.json();
};


// ============================
// IMAGE HELPER
// ============================
export const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/original";

export const getImageURL = (path, size = "original") => {
    if (!path) return null;
    if (typeof path === "string" && /^https?:\/\//i.test(path)) {
        return path;
    }
    return `https://image.tmdb.org/t/p/${size}${path}`;
};


// ============================
// YOUTUBE SEARCH API 
// ============================
export const youtubeSearch = async (query) => {
    try {
        assertEnv("VITE_YOUTUBE_API_KEY", YOUTUBE_API_KEY);

        const url = new URL("https://www.googleapis.com/youtube/v3/search");

        url.search = new URLSearchParams({
            part: "snippet",
            q: query,
            type: "video",
            maxResults: 5,
            key: YOUTUBE_API_KEY
        });

        const res = await fetch(url);

        if (!res.ok) {
            throw new Error(`YouTube API Error: ${res.status}`);
        }

        const data = await res.json();

        return data.items.map(item => ({
            id: item.id.videoId,
            key: item.id.videoId,
            title: item.snippet.title,
            thumbnail: item.snippet.thumbnails.medium.url,
            site: "YouTube",
            type: "Search"
        }));

    } catch (err) {
        console.error("YouTube API failed:", err);
        return [];
    }
};
