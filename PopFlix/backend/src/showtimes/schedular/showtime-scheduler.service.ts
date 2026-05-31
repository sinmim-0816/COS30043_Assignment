import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Showtime } from './../entities/showtime.entity';
import { Cinema } from './../../cinemas/entities/cinema.entity';
import { Movie } from './../../movie/entities/movie.entity';
import { Experience } from './../../experiences/entities/experience.entity';
import moment from 'moment';

@Injectable()
export class ShowtimesSchedulerService {
  constructor(
    @InjectRepository(Showtime)
    private readonly showtimeRepo: Repository<Showtime>,

    @InjectRepository(Cinema)
    private readonly cinemaRepo: Repository<Cinema>,

    @InjectRepository(Movie)
    private readonly movieRepo: Repository<Movie>,

    @InjectRepository(Experience)
    private readonly expRepo: Repository<Experience>,
  ) {}

  @Cron('0 0 * * *')
  async syncShowtimesDaily() {
    console.log('--- [PopFlix] Daily showtime scheduler started ---');
    try {
      console.log('Checking for missing showtimes in the next 8 days...');
      await this.ensureFutureShowtimes(8);
    } catch (error) {
      console.error('Daily showtime scheduler failed:', error);
    }
  }

  async ensureFutureShowtimes(days: number) {
    const start = moment().startOf('day');

    for (let i = 0; i < days; i++) {
      const currentDay = start.clone().add(i, 'days');

      const startOfDay = currentDay.clone().startOf('day').toDate();
      const endOfDay = currentDay.clone().endOf('day').toDate();

      const exists = await this.showtimeRepo.count({
        where: {
          start_time: Between(startOfDay, endOfDay),
        },
      });

      if (exists > 0) {
        console.log(
          `Day ${currentDay.format('YYYY-MM-DD')} already exists → skip`,
        );
        continue;
      }

      console.log(`Generating missing day: ${currentDay.format('YYYY-MM-DD')}`);
      await this.generateForSingleDay(currentDay);
    }

    console.log('Scheduler completed');
  }

  async generateForSingleDay(day: moment.Moment) {
    const cinemas = await this.cinemaRepo.find();
    const movies = await this.movieRepo.find();
    const experiences = await this.expRepo.find();

    const timeSlots = ['10:30', '13:00', '15:45', '18:30', '21:15'];

    const showtimes: Showtime[] = [];

    const getMovieExperiences = (movie: Movie) => {
      const keys: string[] = [];
      const genres = movie.genre_ids || [];

      if (movie.popularity > 500) keys.push('IMAX');
      if (movie.vote_average > 7.5) keys.push('DOLBY');
      if (genres.includes(27) || genres.includes(28)) keys.push('4DX');
      if (movie.runtime > 140 || genres.includes(10749)) keys.push('LUXE');
      if (movie.vote_average > 8 || genres.includes(18)) keys.push('INDULGE');
      if (genres.includes(16) || genres.includes(10751)) {
        keys.push('BEANIE');
        keys.push('JUNIOR');
      }

      if (keys.length === 0) keys.push('LUXE');

      return experiences.filter((e) => keys.includes(e.exp_key.toUpperCase()));
    };

    const dateStr = day.format('YYYY-MM-DD');

    for (const movie of movies) {
      const movieExperiences = getMovieExperiences(movie);

      for (const cinema of cinemas) {
        for (const time of timeSlots) {
          const startTime = new Date(`${dateStr}T${time}:00`);

          const MAX_EXPERIENCES = 2;

          const limitedExperiences = movieExperiences
            .sort(() => Math.random() - 0.5)
            .slice(0, MAX_EXPERIENCES);

          const exp =
            limitedExperiences[
              Math.floor(Math.random() * limitedExperiences.length)
            ];

          showtimes.push(
            this.showtimeRepo.create({
              movie,
              cinema,
              experience: exp,
              start_time: startTime,
              hall_name: `Hall ${Math.floor(Math.random() * 5) + 1}`,
            }),
          );
        }
      }
    }

    await this.showtimeRepo.save(showtimes);

    console.log(`Inserted showtimes for ${dateStr}`);
  }
}
