export interface TmdbMovie {
  id: number;
  title: string;
  popularity: number;
  vote_average: number;
  genre_ids: number[];
  release_date: string;
  poster_path: string | null;
  backdrop_path: string | null;
  original_language: string;
  overview: string;
  tagline: string;
}

export interface TmdbPopularResponse {
  page: number;
  results: TmdbMovie[];
}
