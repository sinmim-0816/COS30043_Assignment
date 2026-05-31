import { Controller, Body, Param, Query, Get } from '@nestjs/common';
import { ShowtimesService } from './showtimes.service';

@Controller('showtimes')
export class ShowtimesController {
  constructor(private readonly showtimesService: ShowtimesService) {}

  @Get('movie/:id')
  async getByMovie(@Param('id') id: string) {
    return this.showtimesService.getShowtimesForMovie(+id);
  }

  @Get('all')
  async findAllSessions(
    @Query('cinemaId') cinemaId: string,
    @Query('date') date: string,
  ) {
    return this.showtimesService.findAllSessions(+cinemaId, date);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.showtimesService.findOne(+id);
  }
}
