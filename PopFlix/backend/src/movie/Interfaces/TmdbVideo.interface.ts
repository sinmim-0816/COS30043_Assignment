export interface TmdbVideo {
  key: string;
  site: string;
  type: string;
}

export interface TmdbVideosResponse {
  results: TmdbVideo[];
}
