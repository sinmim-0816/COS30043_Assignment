import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Movie } from './entities/movie.entity';
import { Showtime } from '../showtimes/entities/showtime.entity';
import axios from 'axios';
import { MovieStatus } from 'src/enum/movieStatus';
import { AxiosResponse } from 'axios';

import { TmdbCreditsResponse } from './Interfaces/TmdbCastMember.interface';
import { TmdbVideosResponse } from './Interfaces/TmdbVideo.interface';
import { TmdbImageResponse } from './Interfaces/TmdbImageResponse';

@Injectable()
export class MovieService {
  constructor(
    @InjectRepository(Movie)
    private movieRepo: Repository<Movie>,

    @InjectRepository(Showtime)
    private showtimeRepo: Repository<Showtime>,
  ) {}

  private normalizeTmdbLanguage(language: string) {
    const normalized = String(language || '').toLowerCase();

    if (normalized.startsWith('zh')) return 'zh-CN';
    if (normalized.startsWith('ms')) return 'ms-MY';
    return 'en-US';
  }

  async findAll({
    page = 1,
    limit = 25,
    search = '',
    status = '',
    schedule = '',
    experience = '',
    genres = '',
    languages = '',
    ratings = '',
    minRating = '',
    maxRating = '',
    sortBy = 'default',
  }: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    schedule?: string;
    experience?: string;
    genres?: string;
    languages?: string;
    ratings?: string;
    minRating?: string;
    maxRating?: string;
    sortBy?: string;
  }) {
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.max(1, Number(limit) || 25);

    const parseList = (value: string) =>
      String(value || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

    const searchTerm = String(search || '')
      .trim()
      .toLowerCase();
    const statusValue = String(status || '')
      .trim()
      .toUpperCase();
    const scheduleValue = String(schedule || '')
      .trim()
      .toLowerCase();
    const experienceValue = String(experience || '')
      .trim()
      .toUpperCase();
    const genreList = parseList(genres);
    const languageList = parseList(languages);
    const ratingList = parseList(ratings).map((item) => item.toUpperCase());
    const minRatingValue = Number(minRating);
    const maxRatingValue = Number(maxRating);
    const hasMinRating = !Number.isNaN(minRatingValue);
    const hasMaxRating = !Number.isNaN(maxRatingValue);

    const now = new Date();
    const matureGenres = new Set(['27', '53', '80', '99']);
    const getCertificate = (movie: Movie) => {
      const genreIds = movie.genre_ids || [];
      const isMature = genreIds.some((id) => matureGenres.has(String(id)));

      if (isMature || Number(movie.vote_average || 0) > 7.5) {
        return 'P13';
      }

      return 'U';
    };

    let movies = await this.movieRepo.find();

    movies = movies.filter((movie) => {
      const releaseDate = movie.release_date
        ? new Date(movie.release_date)
        : null;
      const genreIds = movie.genre_ids || [];
      const title = String(movie.title || '').toLowerCase();
      const overview = String(movie.overview || '').toLowerCase();
      const language = String(movie.original_language || '').toLowerCase();

      if (
        searchTerm &&
        !title.includes(searchTerm) &&
        !overview.includes(searchTerm)
      ) {
        return false;
      }

      if (
        statusValue &&
        String(movie.status || '').toUpperCase() !== statusValue
      ) {
        return false;
      }

      if (scheduleValue === 'now_showing') {
        if (!releaseDate || releaseDate > now) return false;
      } else if (scheduleValue === 'kids') {
        const isKids = genreIds.some((id) =>
          ['16', '10751'].includes(String(id)),
        );
        if (!releaseDate || releaseDate > now || !isKids) return false;
      } else if (scheduleValue === 'coming_soon') {
        if (!releaseDate || releaseDate <= now) return false;
      }

      if (genreList.length) {
        const matchesGenre = genreList.some((genreId) =>
          genreIds.some(
            (movieGenreId) => String(movieGenreId) === String(genreId),
          ),
        );
        if (!matchesGenre) return false;
      }

      if (languageList.length && !languageList.includes(language)) {
        return false;
      }

      if (ratingList.length) {
        const certificate = getCertificate(movie);
        if (!ratingList.includes(certificate)) {
          return false;
        }
      }

      if (hasMinRating && Number(movie.vote_average || 0) < minRatingValue) {
        return false;
      }

      if (hasMaxRating && Number(movie.vote_average || 0) > maxRatingValue) {
        return false;
      }

      return true;
    });

    if (experienceValue && experienceValue !== 'ALL') {
      const movieIds = movies.map((movie) => movie.id);
      const showtimes = movieIds.length
        ? await this.showtimeRepo.find({
            where: { movie_id: In(movieIds) },
            relations: ['experience'],
          })
        : [];

      const experiencesByMovieId = showtimes.reduce(
        (acc, showtime) => {
          const movieId = String(showtime.movie_id);
          const experienceKey = String(
            showtime.experience?.exp_key || '',
          ).toUpperCase();

          if (!experienceKey) {
            return acc;
          }

          if (!acc[movieId]) {
            acc[movieId] = [];
          }

          if (!acc[movieId].includes(experienceKey)) {
            acc[movieId].push(experienceKey);
          }

          return acc;
        },
        {} as Record<string, string[]>,
      );

      movies = movies.filter((movie) =>
        (experiencesByMovieId[String(movie.id)] || []).includes(
          experienceValue,
        ),
      );
    }

    const sortType = String(sortBy || 'default').toLowerCase();
    if (sortType === 'latest') {
      movies.sort((a, b) => {
        const aDate = a.release_date ? new Date(a.release_date).getTime() : 0;
        const bDate = b.release_date ? new Date(b.release_date).getTime() : 0;
        return bDate - aDate;
      });
    } else if (sortType === 'rating') {
      movies.sort(
        (a, b) => Number(b.vote_average || 0) - Number(a.vote_average || 0),
      );
    } else if (sortType === 'popularity') {
      movies.sort(
        (a, b) => Number(b.popularity || 0) - Number(a.popularity || 0),
      );
    } else {
      movies.sort((a, b) => {
        const aDate = a.release_date ? new Date(a.release_date).getTime() : 0;
        const bDate = b.release_date ? new Date(b.release_date).getTime() : 0;
        return (
          bDate - aDate || Number(b.popularity || 0) - Number(a.popularity || 0)
        );
      });
    }

    const total = movies.length;
    const availableLanguages = [
      ...new Set(
        movies.map((movie) => movie.original_language).filter(Boolean),
      ),
    ].sort();
    const pagedMovies = movies.slice(
      (safePage - 1) * safeLimit,
      safePage * safeLimit,
    );
    const movieIds = pagedMovies.map((movie) => movie.id);
    const showtimes = movieIds.length
      ? await this.showtimeRepo.find({
          where: { movie_id: In(movieIds) },
          relations: ['experience'],
        })
      : [];

    const experiencesByMovieId = showtimes.reduce(
      (acc, showtime) => {
        const movieId = String(showtime.movie_id);
        const experienceKey = showtime.experience?.exp_key;

        if (!experienceKey) {
          return acc;
        }

        if (!acc[movieId]) {
          acc[movieId] = [];
        }

        if (!acc[movieId].includes(experienceKey)) {
          acc[movieId].push(experienceKey);
        }

        return acc;
      },
      {} as Record<string, string[]>,
    );

    return {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.max(1, Math.ceil(total / safeLimit)),
      availableLanguages,
      results: pagedMovies.map((m) => ({
        id: m.tmdb_id,
        title: m.title,
        poster: m.poster_path,
        release_date: m.release_date,
        runtime: m.runtime,
        language: m.original_language,
        genre_ids: m.genre_ids || [],
        genres: m.genre_ids || [],
        vote_average: m.vote_average,
        popularity: m.popularity,
        overview: m.overview,
        status: m.status,
        experiences: experiencesByMovieId[String(m.id)] || [],
      })),
    };
  }

  async findOne(id: number, language = 'en-US') {
    const movie = await this.movieRepo.findOne({
      where: { tmdb_id: id },
    });

    if (!movie) return null;

    const showtimes = await this.showtimeRepo.find({
      where: { movie_id: movie.id },
      relations: ['experience'],
    });

    const experiences = [
      ...new Set(showtimes.map((s) => s.experience.exp_key)),
    ];

    const tmdbKey = process.env.TMDB_KEY;
    const tmdbLanguage = this.normalizeTmdbLanguage(language);
    const tmdbParams = `api_key=${tmdbKey}&language=${encodeURIComponent(tmdbLanguage)}`;

    const detailsRes = await axios.get<{
      title: string;
      overview: string;
      original_language: string;
      runtime: number;
      vote_average: number;
      tagline: string;
      popularity: number;
      budget: number;
      revenue: number;
      production_countries: {
        iso_3166_1: string;
        name: string;
      }[];
      production_companies: {
        id: number;
        name: string;
        logo_path: string | null;
        origin_country: string;
      }[];
    }>(`https://api.themoviedb.org/3/movie/${id}?${tmdbParams}`);
    const tmdb = detailsRes.data;

    const creditsRes: AxiosResponse<TmdbCreditsResponse> = await axios.get(
      `https://api.themoviedb.org/3/movie/${id}/credits?${tmdbParams}`,
    );

    const videoRes: AxiosResponse<TmdbVideosResponse> = await axios.get(
      `https://api.themoviedb.org/3/movie/${id}/videos?${tmdbParams}`,
    );

    const imagesRes = await axios.get<TmdbImageResponse>(
      `https://api.themoviedb.org/3/movie/${id}/images?${tmdbParams}`,
    );

    const actors = creditsRes.data.cast.map((a) => ({
      name: a.name,
      character: a.character,
      profile: a.profile_path,
    }));

    const trailer = videoRes.data.results.find(
      (v) => v.type === 'Trailer' && v.site === 'YouTube',
    );

    const trailerUrl = trailer
      ? `https://www.youtube.com/watch?v=${trailer.key}`
      : null;

    const director =
      creditsRes.data.crew?.find((c) => c.job === 'Director')?.name ||
      'Unknown';

    const posters =
      imagesRes.data.posters?.slice(0, 5).map((p) => p.file_path) || [];

    const runtime = tmdb.runtime || movie.runtime || 0;
    const vote_average = tmdb.vote_average || movie.vote_average || 0;
    const tagline = tmdb.tagline || movie.tagline || '';

    const backdrops =
      imagesRes.data.backdrops?.slice(0, 5).map((b) => b.file_path) || [];

    const writers =
      creditsRes.data.crew
        ?.filter((c) => c.job === 'Screenplay' || c.job === 'Writer')
        ?.map((c) => c.name) || [];

    const productionCountries =
      detailsRes.data.production_countries?.map((c) => c.name) || [];

    const productionCompanies = detailsRes.data.production_companies || [];

    const budget = detailsRes.data.budget || 0;

    const revenue = detailsRes.data.revenue || 0;

    return {
      movie: {
        id: movie.tmdb_id,
        title: tmdb.title || movie.title,
        overview: tmdb.overview || movie.overview,
        poster: movie.poster_path,
        posters,
        backdrops,
        backdrop: movie.backdrop_path,
        vote_average: vote_average,
        tagline: tagline,
        director: director,
        release_date: movie.release_date,
        runtime,
        language: tmdb.original_language || movie.original_language,
        genres: movie.genre_ids,
        experiences,
        actors,
        writers,
        trailer: trailerUrl,
        popularity: tmdb.popularity || 0,
        production_countries: productionCountries,
        production_companies: productionCompanies,
        budget,
        revenue,
      },
    };
  }

  async findNowShowing(page = 1, limit = 20) {
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.max(1, Number(limit) || 20);
    const [data, total] = await this.movieRepo.findAndCount({
      where: { status: MovieStatus.NOW_SHOWING },
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
    });

    return {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.max(1, Math.ceil(total / safeLimit)),
      results: data.map((m) => ({
        id: m.tmdb_id,
        title: m.title,
        poster: m.poster_path,
        release_date: m.release_date,
      })),
    };
  }

  async findComingSoon(page = 1, limit = 20) {
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.max(1, Number(limit) || 20);
    const [data, total] = await this.movieRepo.findAndCount({
      where: { status: MovieStatus.COMING_SOON },
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
    });

    return {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.max(1, Math.ceil(total / safeLimit)),
      results: data.map((m) => ({
        id: m.tmdb_id,
        title: m.title,
        poster: m.poster_path,
        release_date: m.release_date,
      })),
    };
  }

  create(createMovieDto) {
    return this.movieRepo.save(createMovieDto);
  }

  update(id: number, updateMovieDto) {
    return this.movieRepo.update({ tmdb_id: id }, updateMovieDto);
  }

  remove(id: number) {
    return this.movieRepo.delete({ tmdb_id: id });
  }
}
