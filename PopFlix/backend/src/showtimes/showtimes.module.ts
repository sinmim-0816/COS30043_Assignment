import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShowtimesService } from './showtimes.service';
import { ShowtimesController } from './showtimes.controller';
import { Showtime } from './entities/showtime.entity';
import { Experience } from '../experiences/entities/experience.entity';
import { Cinema } from '../cinemas/entities/cinema.entity';
import { Movie } from '../movie/entities/movie.entity';
import { ShowtimesSchedulerService } from 'src/showtimes/schedular/showtime-scheduler.service';

@Module({
  imports: [TypeOrmModule.forFeature([Showtime, Experience, Cinema, Movie])],
  controllers: [ShowtimesController],
  providers: [ShowtimesService, ShowtimesSchedulerService],
})
export class ShowtimesModule {}
