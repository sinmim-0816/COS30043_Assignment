import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Movie } from './entities/movie.entity';
import { MovieController } from './movie.controller';
import { MovieService } from './movie.service';
import { Showtime } from 'src/showtimes/entities/showtime.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Movie, Showtime])],
  controllers: [MovieController],
  providers: [MovieService],
  exports: [TypeOrmModule, MovieService],
})
export class MoviesModule {}
