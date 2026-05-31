import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Movie } from './entities/movie.entity';
import { TmdbPopularResponse } from './Interfaces/tmdbMovie.interface';
import axios from 'axios';
import { MovieStatus } from '../enum/movieStatus';
import { DeepPartial } from 'typeorm';

@Injectable()
export class MovieSeedService {
  constructor(
    @InjectRepository(Movie)
    private movieRepo: Repository<Movie>,
  ) {}

  async seedFromTmdb() {
    const baseUrl = `https://api.themoviedb.org/3/movie/popular`;
    const TIMEOUT_MS = 10000;
    const DELAY_MS = 500;

    for (let page = 1; page <= 6; page++) {
      try {
        const url = `${baseUrl}?api_key=${process.env.TMDB_KEY}&page=${page}`;

        const { data } = await axios.get<TmdbPopularResponse>(url, {
          timeout: TIMEOUT_MS,
        });

        for (const m of data.results) {
          try {
            const exists = await this.movieRepo.findOne({
              where: { tmdb_id: m.id },
            });

            if (exists) {
              continue;
            }
            const detailUrl = `https://api.themoviedb.org/3/movie/${m.id}?api_key=${process.env.TMDB_KEY}`;

            const { data: details } = await axios.get(detailUrl, {
              timeout: TIMEOUT_MS,
            });

            const productionCountries =
              details.production_countries?.map((c) => c.iso_3166_1) || [];

            const allowedCountries = ['MY', 'CN', 'TW', 'GB', 'US'];

            const isAllowed = productionCountries.some((country) =>
              allowedCountries.includes(country),
            );

            if (!isAllowed) {
              continue;
            }

            const releaseDate = m.release_date
              ? new Date(m.release_date)
              : null;
            const today = new Date();

            const status = releaseDate
              ? releaseDate > today
                ? MovieStatus.COMING_SOON
                : MovieStatus.NOW_SHOWING
              : MovieStatus.NOW_SHOWING;

            await this.movieRepo.save({
              tmdb_id: m.id,
              title: m.title,
              popularity: m.popularity,
              vote_average: m.vote_average,
              runtime: 120,
              genre_ids: m.genre_ids,
              poster_path: m.poster_path,
              backdrop_path: m.backdrop_path,
              original_language: m.original_language,
              overview: m.overview,
              release_date: releaseDate,
              status,
            } as DeepPartial<Movie>);

            await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
          } catch (error) {
            console.error(
              `Error processing movie ${m.id} (${m.title}):`,
              error.message,
            );
          }
        }
      } catch (error) {
        console.error(`Error fetching page ${page}:`, error.message);
      }
    }
  }
}
