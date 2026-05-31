import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, Between } from 'typeorm';
import { Showtime } from './entities/showtime.entity';
import { Cinema } from '../cinemas/entities/cinema.entity';
import { Experience } from '../experiences/entities/experience.entity';
import moment from 'moment';

@Injectable()
export class ShowtimesService {
  constructor(
    @InjectRepository(Showtime)
    private readonly showtimeRepo: Repository<Showtime>,
    @InjectRepository(Cinema)
    private readonly cinemaRepo: Repository<Cinema>,
    @InjectRepository(Experience)
    private readonly expRepo: Repository<Experience>,
  ) {}

  private normalizeShowtime(showtime: Showtime) {
    return {
      ...showtime,
      movie_id: showtime.movie?.tmdb_id ?? showtime.movie_id,
    };
  }

  async getShowtimesForMovie(movieId: number) {
    const now = new Date();

    const showtimes = await this.showtimeRepo.find({
      where: {
        movie: { tmdb_id: movieId },
        start_time: MoreThan(now),
      },
      relations: ['cinema', 'experience', 'movie'],
      order: { start_time: 'ASC' },
    });

    return showtimes.map((showtime) => this.normalizeShowtime(showtime));
  }

  async findAllSessions(cinemaId: number, date: string) {
    const startOfDay = moment(date).startOf('day').toDate();
    const endOfDay = moment(date).endOf('day').toDate();

    const showtimes = await this.showtimeRepo.find({
      where: {
        cinema: { id: cinemaId },
        start_time: Between(startOfDay, endOfDay),
      },
      relations: ['cinema', 'experience', 'movie'],
    });

    return showtimes.map((showtime) => this.normalizeShowtime(showtime));
  }

  async findOne(id: number) {
    const showtime = await this.showtimeRepo.findOne({
      where: { id },
      relations: ['cinema', 'experience', 'movie'],
    });
    if (!showtime) {
      throw new NotFoundException(`Showtime with ID ${id} not found`);
    }

    return this.normalizeShowtime(showtime);
  }
}
