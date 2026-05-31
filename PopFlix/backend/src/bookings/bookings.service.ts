import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, In, Brackets } from 'typeorm';
import { Booking } from './entities/booking.entity';
import { Ticket } from '../ticket/entities/ticket.entity';
import { UsersService } from '../users/users.service';
import { BookingStatus } from '../enum/BookingStatus';
import { MembershipTier } from '../enum/MembershipTier';
import { CreateBookingDto } from './dto/create-booking.dto';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking) private bookingRepo: Repository<Booking>,
    @InjectRepository(Ticket) private ticketRepo: Repository<Ticket>,
    private usersService: UsersService,
  ) {}

  async createBooking(userId: number, dto: CreateBookingDto) {
    let seatsArray: string[] = [];
    const rawSeats = dto.seats as string[] | string | null | undefined;

    if (Array.isArray(rawSeats)) {
      seatsArray = rawSeats;
    } else if (typeof rawSeats === 'string' && rawSeats.length > 0) {
      seatsArray = rawSeats
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (rawSeats == null) {
      seatsArray = [];
    } else {
      throw new BadRequestException(
        'Invalid seats format. Expected an array of seat identifiers.',
      );
    }

    if (seatsArray.length === 0) {
      throw new BadRequestException('No seats selected.');
    }

    const existingTickets = await this.ticketRepo.findOne({
      where: [
        {
          seatNumber: In(seatsArray),
          booking: {
            showtimeId: dto.showtimeId,
            status: BookingStatus.PAID,
          },
        },
        {
          seatNumber: In(seatsArray),
          booking: {
            showtimeId: dto.showtimeId,
            status: BookingStatus.PENDING,
            expiresAt: MoreThan(new Date()),
          },
        },
      ],
    });

    if (existingTickets) {
      throw new BadRequestException(
        'One or more seats are currently unavailable.',
      );
    }

    if (dto.parkingSpot) {
      const existingParkingLock = await this.bookingRepo.findOne({
        where: [
          {
            showtimeId: dto.showtimeId,
            parkingSpot: dto.parkingSpot,
            status: BookingStatus.PAID,
          },
          {
            showtimeId: dto.showtimeId,
            parkingSpot: dto.parkingSpot,
            status: BookingStatus.PENDING,
            expiresAt: MoreThan(new Date()),
          },
        ],
      });

      if (existingParkingLock) {
        throw new BadRequestException(
          `Parking spot ${dto.parkingSpot} is already reserved by another customer.`,
        );
      }
    }

    const user = await this.usersService.findOne(userId);
    let finalPrice = dto.subtotal;
    if (!user) {
      throw new BadRequestException('User not found.');
    }

    const discountRate =
      user.membershipTier === MembershipTier.GOLD
        ? 0.2
        : user.membershipTier === MembershipTier.SILVER
          ? 0.1
          : 0;
    const membershipDiscount = finalPrice * discountRate;
    finalPrice -= membershipDiscount;

    const pointsToUse = dto.pointsToUse ?? 0;
    if (dto.usePoints && user.loyaltyPoints >= pointsToUse) {
      finalPrice -= pointsToUse / 10;
    }

    const multiplier =
      user.membershipTier === MembershipTier.GOLD
        ? 2
        : user.membershipTier === MembershipTier.SILVER
          ? 1.5
          : 1;
    const earned = Math.floor(finalPrice * multiplier);

    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 8);

    const booking = this.bookingRepo.create({
      user: { id: userId },
      showtimeId: dto.showtimeId,
      totalPrice: finalPrice,
      pointsRedeemed: dto.pointsToUse || 0,
      pointsEarned: earned,
      expiresAt: expiry,
      status: BookingStatus.PENDING,
      parkingSpot: dto.parkingSpot || null,
      tickets: seatsArray.map((seat) => ({
        seatNumber: seat,
        price: dto.seatPrice,
      })),
    });

    return await this.bookingRepo.save(booking);
  }

  async findPendingBooking(bookingId: number) {
    return this.bookingRepo.findOne({
      where: {
        id: bookingId,
        status: BookingStatus.PENDING,
        expiresAt: MoreThan(new Date()),
      },
      relations: [
        'user',
        'tickets',
        'showtime',
        'showtime.movie',
        'showtime.cinema',
      ],
    });
  }

  async markAsPaid(bookingId: number) {
    return this.bookingRepo.update(
      {
        id: bookingId,
      },
      {
        status: BookingStatus.PAID,
      },
    );
  }

  async findUserBookings(userId: number) {
    return this.bookingRepo.find({
      where: {
        user: { id: userId },
      },
      relations: ['tickets'],
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findOne(id: number) {
    return this.bookingRepo.findOne({
      where: { id },
      relations: ['tickets', 'user'],
    });
  }

  async findReservedSeats(
    targetShowtimeId: number,
  ): Promise<Array<{ seatNumber: string; status: string }>> {
    const activeTickets = await this.ticketRepo
      .createQueryBuilder('ticket')
      .innerJoinAndSelect('ticket.booking', 'booking')
      .where('booking.showtimeId = :showtimeId', {
        showtimeId: targetShowtimeId,
      })
      .andWhere(
        new Brackets((qb) => {
          qb.where('booking.status = :paidStatus', {
            paidStatus: BookingStatus.PAID,
          }).orWhere(
            new Brackets((pendingQb) => {
              pendingQb
                .where('booking.status = :pendingStatus', {
                  pendingStatus: BookingStatus.PENDING,
                })
                .andWhere('booking.expiresAt > :now', { now: new Date() });
            }),
          );
        }),
      )
      .getMany();

    return activeTickets.map((ticket) => ({
      seatNumber: ticket.seatNumber?.trim(),
      status: ticket.booking.status,
    }));
  }

  async findReservedParkingSpots(
    targetShowtimeId: number,
  ): Promise<Array<{ parkingSpot: string; status: string }>> {
    const activeBookings = await this.bookingRepo
      .createQueryBuilder('booking')
      .where('booking.showtimeId = :showtimeId', {
        showtimeId: targetShowtimeId,
      })
      .andWhere('booking.parkingSpot IS NOT NULL')
      .andWhere(
        new Brackets((qb) => {
          qb.where('booking.status = :paidStatus', {
            paidStatus: BookingStatus.PAID,
          }).orWhere(
            new Brackets((pendingQb) => {
              pendingQb
                .where('booking.status = :pendingStatus', {
                  pendingStatus: BookingStatus.PENDING,
                })
                .andWhere('booking.expiresAt > :now', { now: new Date() });
            }),
          );
        }),
      )
      .getMany();

    return activeBookings.map((booking) => ({
      parkingSpot: (booking.parkingSpot ?? '').trim(),
      status: booking.status,
    }));
  }
}
