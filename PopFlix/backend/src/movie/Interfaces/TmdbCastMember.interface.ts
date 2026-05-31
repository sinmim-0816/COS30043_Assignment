export interface TmdbCastMember {
  name: string;
  character: string;
  profile_path: string | null;
}

export interface TmdbCreditsResponse {
  cast: {
    name: string;
    character: string;
    profile_path: string;
  }[];

  crew: {
    job: string;
    name: string;
  }[];
}
