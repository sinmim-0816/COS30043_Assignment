import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Booking } from './entities/booking.entity';
import { BookingStatus } from '../enum/BookingStatus';

@Injectable()
export class BookingsScheduler {
  constructor(
    @InjectRepository(Booking)
    private bookingRepo: Repository<Booking>,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async releaseExpiredSeats() {
    await this.bookingRepo.update(
      {
        status: BookingStatus.PENDING,
        expiresAt: LessThan(new Date()),
      },
      {
        status: BookingStatus.CANCELLED,
      },
    );
  }
}
