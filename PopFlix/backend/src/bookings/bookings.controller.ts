import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Request,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Request() req, @Body() dto: CreateBookingDto) {
    return this.bookingsService.createBooking(req.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  findMyBookings(@Request() req) {
    return this.bookingsService.findUserBookings(req.user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bookingsService.findOne(+id);
  }

  @Get('locked-seats/:showtimeId')
  async getLockedSeats(
    @Param('showtimeId', ParseIntPipe) showtimeId: number,
  ): Promise<Array<{ seatNumber: string; status: string }>> {
    return this.bookingsService.findReservedSeats(showtimeId);
  }

  @Get('locked-parking/:showtimeId')
  async getLockedParking(
    @Param('showtimeId', ParseIntPipe) showtimeId: number,
  ): Promise<Array<{ parkingSpot: string; status: string }>> {
    return this.bookingsService.findReservedParkingSpots(showtimeId);
  }
}
