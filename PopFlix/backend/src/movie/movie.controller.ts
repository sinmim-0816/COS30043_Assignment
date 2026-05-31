import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { MovieService } from './movie.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';

@Controller('movies')
export class MovieController {
  constructor(private readonly movieService: MovieService) {}

  @Post()
  create(@Body() createMovieDto: CreateMovieDto) {
    return this.movieService.create(createMovieDto);
  }

  @Get('now-showing')
  findNowShowing(@Query('page') page = '1', @Query('limit') limit = '20') {
    return this.movieService.findNowShowing(Number(page), Number(limit));
  }

  @Get('coming-soon')
  findComingSoon(@Query('page') page = '1', @Query('limit') limit = '20') {
    return this.movieService.findComingSoon(Number(page), Number(limit));
  }

  @Get(':id/details')
  findFullDetails(@Param('id') id: string) {
    return this.movieService.findOne(Number(id));
  }

  @Get()
  findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '25',
    @Query('search') search = '',
    @Query('status') status = '',
    @Query('schedule') schedule = '',
    @Query('experience') experience = '',
    @Query('genres') genres = '',
    @Query('languages') languages = '',
    @Query('ratings') ratings = '',
    @Query('minRating') minRating = '',
    @Query('maxRating') maxRating = '',
    @Query('sortBy') sortBy = 'default',
  ) {
    return this.movieService.findAll({
      page: Number(page),
      limit: Number(limit),
      search,
      status,
      schedule,
      experience,
      genres,
      languages,
      ratings,
      minRating,
      maxRating,
      sortBy,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    const movieId = Number(id);

    if (isNaN(movieId)) {
      throw new BadRequestException('Invalid movie id');
    }

    return this.movieService.findOne(movieId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMovieDto: UpdateMovieDto) {
    return this.movieService.update(+id, updateMovieDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.movieService.remove(+id);
  }
}
